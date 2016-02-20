var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var User = require('../models/users');
var Group = require('../models/groups');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');
var Fulfilment = require('../models/fulfilments');

/*
 * Users.
 * Users within the system.
*/

router.get('/users/list', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(users);
        }
    });
});

router.get('/users/view/:username', function(req, res) {
    User.find({ username: sanitize(req.params.username) }, function(err, user){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            if (!user) {
                res.status(404).json({error: 'not found'});
            } else {
                res.json(user);
            }
        }
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
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.post('/users/update', function(req, res) {
    User.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: sanitize(req.body.userpass),
        groups: sanitize(req.body['usergroups[]'])
    }, function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.delete('/users/update/:username', function(req, res) {
    User.findOneAndRemove({
        username: sanitize(req.params.username)
    }, function(err, result){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

router.get('/groups/list', function(req, res) {
    Group.find(function(err, groups){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(groups);
        }
    });
});

router.get('/groups/view/:name', function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!group) {
            res.status(404).json({error: 'not found'});
        }
        else {
            res.json(group);
        }
    });
});

router.get('/groups/view/:name/members', function(req, res) {
    Group.members(sanitize(req.params.name), function(err, users){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(users);
        }
    });
});

router.post('/groups/new', function(req, res) {
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.post('/groups/update', function(req, res) {
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.delete('/groups/update/:name', function(req, res) {
    Group.findOneAndRemove({
        name: sanitize(req.params.name)
    }, function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

router.get('/schedules/list', function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(schedules);
        }
    });
});

router.get('/schedules/list/owner/:owner', function(req, res) {
    Schedule.find({ owner: sanitize(req.params.owner) }, function(err, schedules){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(schedules);
        }
    });
});

router.get('/schedules/list/group/:group', function(req, res) {
    Schedule.group(sanitize(req.params.group), function(err, schedules){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(schedules);
        }
    });
});

router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id), function(err, schedule){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!schedule) {
            res.status(404).json({error: 'not found'});
        }
        else {
            res.json(schedule);
        }
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
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
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
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!result) {
            res.status(404).json({error: 'not found'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.delete('/schedules/update/:id', function(req, res) {
    Schedule.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!result) {
            res.status(404).json({error: 'not found'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

router.get('/pledges/list', function(req, res) {
    Pledge.find(function(err, pledges){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        res.json(pledges);
    });
});

router.get('/pledges/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!pledge) {
            res.status(404).json({error: 'not found'});
        }
        else {
            res.json(pledge);
        }
    });
});

router.post('/pledges/new', function(req, res) {
    var pledge = new Pledge({
        username: sanitize(req.body.username),
        schedule: sanitize(req.body.schedule)
    });
    pledge.save(function(err, doc) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.delete('/pledges/update/:id', function(req, res) {
    Pledge.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

/*
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

/* GET fulfilment listing page. */
router.get('/fulfilments/list', function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json(fulfilments);
        }
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!fulfilment) {
            res.status(404).json({error: 'not found'});
        }
        else {
            res.json(fulfilment);
        }
    });
});

router.post('/fulfilments/new', function(req, res) {
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    });
    fulfilment.save(function(err, doc) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

router.post('/fulfilments/update', function(req, res) {
    Fulfilment.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    }, function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

/* DELETE to fulfilment update service */
router.delete('/fulfilments/update/:id', function(req, res) {
    Fulfilment.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else {
            res.json({message: 'OK'});
        }
    });
});

function _completes(req, res, callback) {
    Fulfilment.completes(sanitize(req.params.id), function(err, pledges){
       if (err) {
            console.error(err);
            res.status(500).json({error: 'server error'});
        }
        else if (!pledges) {
            res.status(404).json({error: 'not found'});
        }
        else {
            callback(pledges);
        } 
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
