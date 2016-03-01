var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var moment = require('moment');

var User = require('../models/users');
var Group = require('../models/groups');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');
var Fulfilment = require('../models/fulfilments');

var config = require('../config');

/*
 * Response functions.
*/

var error = {
    notfound: function(res) {
        res.status(404).json({error: 'Resource not found'});
    },
    server: function(res, err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
};

var response = {
    ok: function(res) {
        res.json({message: 'OK'});
    },
    invalid: function(res) {
        res.json({message: 'Invalid'});
    }
};

/*
 * Authentication functions.
*/

router.post('/authenticate', function(req, res){
    User.findOne({
        username: sanitize(req.body.username)
    }, function (err, user){
        if (err) return error.server(res, err);

        if (!user) {
            res.status(403).json({
                success: false,
                message: 'We couldn\'t find an account with that username.'
            });
        }
        else {
            if (!bcrypt.compareSync(req.body.password, user.password)) {
                res.status(403).json({
                    success: false,
                    message: 'The password you entered is incorrect.'
                });
            }
            else {
                var token = jwt.sign(user, config.token.secret, {
                    algorithm: 'HS256',
                    expiresIn: 60*60*24
                });
                res.json({
                    success: true,
                    message: 'Signed in successfully!',
                    token: token
                });
            }
        }
    });
});

// Middleware to require authorisation for all API routes
router.use(function(req, res, next){
    if (req.authentication.success) {
        next();
    }
    else {
        return res.status(req.authentication.status).json({
            success: req.authentication.success,
            message: req.authentication.message
        }); 
    }
});

/*
 * Users.
 * Users within the system.
*/

router.get('/users/list', function(req, res) {
    User.find(function(err, users){
        if (err) return error.server(res, err);
        res.json(users);
    });
});

router.get('/users/view/:username', function(req, res) {
    User.find({ username: sanitize(req.params.username) }, function(err, user){
        if (err) return error.server(res, err);
        if (!user) return error.notfound(res);
        res.json(user);
    });
});

router.post('/users/new', function(req, res) {
    var user = new User({
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: bcrypt.hashSync(sanitize(req.body.userpass)),
        groups: sanitize(req.body['usergroups[]'])
    });
    user.save(function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/users/update', function(req, res) {
    User.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: bcrypt.hashSync(sanitize(req.body.userpass)),
        groups: sanitize(req.body['usergroups[]'])
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.delete('/users/update/:username', function(req, res) {
    User.findOneAndRemove({
        username: sanitize(req.params.username)
    }, function(err, result){
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

router.get('/groups/list', function(req, res) {
    Group.find(function(err, groups){
        if (err) return error.server(res, err);
        res.json(groups);
    });
});

router.get('/groups/view/:name', function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) return error.server(res, err);
        if (!group) return error.notfound(res);
        res.json(group);
    });
});

router.get('/groups/view/:name/members', function(req, res) {
    Group.members(sanitize(req.params.name), function(err, users){
        if (err) return error.server(res, err);
        res.json(users);
    });
});

router.post('/groups/new', function(req, res) {
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/groups/update', function(req, res) {
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.delete('/groups/update/:name', function(req, res) {
    Group.findOneAndRemove({
        name: sanitize(req.params.name)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

router.get('/schedules/list', function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) return error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/list/owner/:owner', function(req, res) {
    Schedule.find({ owner: sanitize(req.params.owner) }, function(err, schedules){
        if (err) return error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/list/group/:group', function(req, res) {
    Schedule.group(sanitize(req.params.group), function(err, schedules){
        if (err) return error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id), function(err, schedule){
        if (err) return error.server(res, err);
        else if (!schedule) return error.notfound(res);
        res.json(schedule);
    });
});

router.post('/schedules/new', function(req, res) {
    if (req.body.owner != req.user.username && !req.user.admin) return response.invalid(res);
    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    });
    schedule.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/schedules/update', function(req, res) {
    Schedule.findByIdAndUpdate(sanitize(req.body.id), {
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    }, function(err, result) {
        if (err) return error.server(res, err);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

router.delete('/schedules/update/:id', function(req, res) {
    Schedule.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res, err);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

// retrieve events for populating the schedules calendar
router.get('/calendar', function(req, res) {

        // User-owned events are green, others are red.
        // TODO - a better colouring scheme is needed
        // TODO - if the user is admin, display ALL groups

        // Set groups to be an empty array if its null
        req.user.groups = req.user.groups || [];

        // Retrieve all schedules for all groups the user
        // is a member of.
        Schedule.groups(req.user.groups, function(err, schedules) {
            var json = schedules.map(function(s){
                return {
                    title: s.title,
                    description: s.description,
                    start: moment(s.start_time).format(),
                    end: moment(s.end_time).format(),
                    owner: s.owner,
                    url: '/' + config.dictionary.schedule.noun + 's/view/' + s._id,
                    className: (s.owner == req.user.username) ? 'bg-success' : 'bg-danger'
                }
            });
            res.json(json);
        })
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

router.get('/pledges/list', function(req, res) {
    Pledge.find(function(err, pledges){
        if (err) return error.server(res, err);
        res.json(pledges);
    });
});

router.get('/pledges/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) return error.server(res, err);
        if (!pledge) return error.notfound(res);
        res.json(pledge);
    });
});

router.post('/pledges/new', function(req, res) {
    if (req.body.username != req.user.username && !req.user.admin) return response.invalid(res);
    var pledge = new Pledge({
        username: sanitize(req.body.username),
        schedule: sanitize(req.body.schedule)
    });
    pledge.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.delete('/pledges/update/:id', function(req, res) {
    Pledge.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res, err);
        console.log(result);
        response.ok(res);
    });
});

router.delete('/pledges/update/schedule/:schedule/username/:username', function(req, res) {
    Pledge.findOneAndRemove({
        schedule: sanitize(req.params.schedule),
        username: sanitize(req.params.username)
    }, function(err, result) {
        if (err) return error.server(res, err);
        console.log(result);
        response.ok(res);
    });
});

// Return the users that have pledged to attend a given schedule
router.get('/pledges/users/:schedule', function(req, res) {
    Pledge.find({
        schedule: sanitize(req.params.schedule)
    }, function(err, pledges){
        if (err) return error.server(res, err);
        res.json(pledges.map(function(p){ return p.username; }));
    });
});

/*
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

/* GET fulfilment listing page. */
router.get('/fulfilments/list', function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) return error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) return error.server(res, err);
        if (!fulfilment) return error.notfound(res);
        res.json(fulfilment);
    });
});

router.post('/fulfilments/new', function(req, res) {
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    });
    fulfilment.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/fulfilments/update', function(req, res) {
    Fulfilment.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

/* DELETE to fulfilment update service */
router.delete('/fulfilments/update/:id', function(req, res) {
    Fulfilment.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

function _completes(req, res, callback) {
    Fulfilment.completes(sanitize(req.params.id), function(err, pledges){
       if (err) return error.server(res, err);
        if (!pledges) return error.notfound(res);
        callback(pledges);
    });
}

// pledges completed by fulfilment
router.get('/fulfilments/view/:id/completes', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges);
    });
});

// pledges of specified completion status by fulfilment
router.get('/fulfilments/view/:id/completes/:status', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges.filter(function(p){
            return p.completion == req.params.status;
        }));
    });
});

/*
 * Add a JSON 404 route
*/

router.use(function(req, res, next) {
  error.notfound(res);
});

/*
 * Export the routes.
*/

module.exports = router;
