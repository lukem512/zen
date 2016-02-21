var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

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
    server: function(res) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
};

var response = {
    ok: function(res) {
        res.json({message: 'OK'});
    }
}

/*
 * Authentication functions.
*/

router.post('/authenticate', function(req, res){
    User.findOne({
        username: sanitize(req.body.username)
    }, function (err, user){
        if (err) return error.server(res);

        if (!user) {
            console.log('User not found');
            res.status(403).json({
                success: false,
                message: 'Username was not found'
            });
        }
        else {
            if (bcrypt.compareSync(req.body.password, user.password)) {
                console.log('Invalid password');
                res.status(403).json({
                    success: false,
                    message: 'Invalid password'
                });
            }
            else {
                var token = jwt.sign(user, config.token.secret, {
                    algorithm: 'HS256',
                    expiresIn: 60*60*24
                });
                res.json({
                    success: true,
                    message: 'Signed in successfully',
                    token: token
                });
            }
        }
    });
});

router.use(function(req, res, next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if (token) {
        jwt.verify(token, config.token.secret, function(err, decoded) {
            if (err) {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid token'
                });    
            } 
            else {
                req.decoded = decoded; 
                console.log('Decoded');
                console.log(decoded);   
                next();
            }
        });
    }
    else {
        return res.status(403).json({
            success: false,
            message: 'no token provided'
        })
    }
});

/*
 * Users.
 * Users within the system.
*/

router.get('/users/list', function(req, res) {
    User.find(function(err, users){
        if (err) return error.server(res);
        res.json(users);
    });
});

router.get('/users/view/:username', function(req, res) {
    User.find({ username: sanitize(req.params.username) }, function(err, user){
        if (err) return error.server(res);
        if (!user) return error.notfound(res);
        res.json(user);
    });
});

router.post('/users/new', function(req, res) {
    var user = new User({
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: sanitize(req.body.userpass),
        groups: sanitize(req.body['usergroups[]'])
    });
    user.save(function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

router.post('/users/update', function(req, res) {
    User.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: sanitize(req.body.userpass),
        groups: sanitize(req.body['usergroups[]'])
    }, function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

router.delete('/users/update/:username', function(req, res) {
    User.findOneAndRemove({
        username: sanitize(req.params.username)
    }, function(err, result){
        if (err) return error.server(res);
        response.ok(res);
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

router.get('/groups/list', function(req, res) {
    Group.find(function(err, groups){
        if (err) return error.server(res);
        res.json(groups);
    });
});

router.get('/groups/view/:name', function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) return error.server(res);
        if (!group) return error.notfound(res);
        res.json(group);
    });
});

router.get('/groups/view/:name/members', function(req, res) {
    Group.members(sanitize(req.params.name), function(err, users){
        if (err) return error.server(res);
        res.json(users);
    });
});

router.post('/groups/new', function(req, res) {
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

router.post('/groups/update', function(req, res) {
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

router.delete('/groups/update/:name', function(req, res) {
    Group.findOneAndRemove({
        name: sanitize(req.params.name)
    }, function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

router.get('/schedules/list', function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) return error.server(res);
        res.json(schedules);
    });
});

router.get('/schedules/list/owner/:owner', function(req, res) {
    Schedule.find({ owner: sanitize(req.params.owner) }, function(err, schedules){
        if (err) return error.server(res);
        res.json(schedules);
    });
});

router.get('/schedules/list/group/:group', function(req, res) {
    Schedule.group(sanitize(req.params.group), function(err, schedules){
        if (err) return error.server(res);
        res.json(schedules);
    });
});

router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id), function(err, schedule){
        if (err) return error.server(res);
        else if (!schedule) return error.notfound(res);
        res.json(schedule);
    });
});

router.post('/schedules/new', function(req, res) {
    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    });
    schedule.save(function(err, doc) {
        if (err) return error.server(res);
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
        if (err) return error.server(res);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

router.delete('/schedules/update/:id', function(req, res) {
    Schedule.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

router.get('/pledges/list', function(req, res) {
    Pledge.find(function(err, pledges){
        if (err) return error.server(res);
        res.json(pledges);
    });
});

router.get('/pledges/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) return error.server(res);
        if (!pledge) return error.notfound(res);
        res.json(pledge);
    });
});

router.post('/pledges/new', function(req, res) {
    var pledge = new Pledge({
        username: sanitize(req.body.username),
        schedule: sanitize(req.body.schedule)
    });
    pledge.save(function(err, doc) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

router.delete('/pledges/update/:id', function(req, res) {
    Pledge.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

/*
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

/* GET fulfilment listing page. */
router.get('/fulfilments/list', function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) return error.server(res);
        res.json(fulfilments);
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) return error.server(res);
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
        if (err) return error.server(res);
        response.ok(res);
    });
});

router.post('/fulfilments/update', function(req, res) {
    Fulfilment.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    }, function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

/* DELETE to fulfilment update service */
router.delete('/fulfilments/update/:id', function(req, res) {
    Fulfilment.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res);
        response.ok(res);
    });
});

function _completes(req, res, callback) {
    Fulfilment.completes(sanitize(req.params.id), function(err, pledges){
       if (err) return error.server(res);
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
 * Export the routes.
*/

module.exports = router;
