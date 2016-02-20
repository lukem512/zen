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
            res.status(500);
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
            res.status(500);
        }
        else {
            if (!user) {
                res.status(404);
            } else {
                res.json(user);
            }
        }
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

/* GET group listing page. */
router.get('/groups/list', function(req, res) {
    Group.find(function(err, groups){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else {
            res.json(groups);
        }
    });
});

/* GET group information */
router.get('/groups/view/:name', function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else if (!group) {
            res.status(404);
        }
        else {
            res.json(group);
        }
    });
});

/* GET group membership information */
router.get('/groups/view/:name/users', function(req, res) {
    // TODO
    res.json({message:"Not implemented"});
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

/* GET schedule listing page. */
router.get('/schedules/list', function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else {
            res.json(schedules);
        }
    });
});

/* GET schedule by specified owner. */
router.get('/schedules/list/owner/:owner', function(req, res) {
    Schedule.find({ owner: sanitize(req.params.owner) }, function(err, schedules){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else {
            res.json(schedules);
        }
    });
});

/* GET schedule by specified group of owner. */
router.get('/schedules/list/group/:group', function(req, res) {
    // TODO
    res.json({message:"Not implemented"});
});

/* GET schedule information */
router.get('/schedules/view/:id', function(req, res) {
    Schedule.find({ _id: req.params.id }, function(err, schedule){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else if (!schedule) {
            res.status(404);
        }
        else {
            res.json(schedule);
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
            res.status(500);
        }
        else {
            res.json(fulfilments);
        }
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.find({ _id: req.params.id }, function(err, fulfilment){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else if (!fulfilment) {
            res.status(404);
        }
        else {
            res.json(fulfilment);
        }
    });
});

/* GET pledges complete by fulfilment */
router.get('/fulfilments/view/:id/completes', function(req, res) {
    Fulfilment.find({ _id: req.params.id }, function(err, fulfilment){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else if (!fulfilment) {
            res.status(404);
        }
        else {
            fulfilment.completes(function(err, pledges){
               if (err) {
                    console.error(err);
                    res.status(500);
                }
                else if (!pledges) {
                    res.status(404);
                }
                else {
                    res.json(pledges);
                } 
            });
        }
    });
});

/* GET pledges of specified completion status by fulfilment */
router.get('/fulfilments/view/:id/completes/:status', function(req, res) {
    // TODO
    res.json({message:"Not implemented"});
});

/*
 * Export the routes.
*/

module.exports = router;
