var express = require('express');
var router = express.Router();

var users = require('../models/users');
var groups = require('../models/groups');
var schedules = require('../models/schedules');
// var pledges = require('../models/pledges');
// var fulfilments = require('../models/fulfilments');

/*
 * Users.
 * Users within the system.
*/

router.get('/users/list', function(req, res) {
    users.list(req.db, function(err, users){
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
    users.get(req.db, req.params.username, function(err, user){
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
    var db = req.db;
    groups.list(db, function(err, groups){
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
    groups.get(req.db, req.params.name, function(err, group){
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
    groups.members(req.db, req.params.name, function(err, members){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else if (!members) {
            res.status(404);
        }
        else {
            res.json(members);
        }
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

/* GET schedule listing page. */
router.get('/schedules/list', function(req, res) {
    schedules.list(req.db, function(err, schedules){
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
    schedules.getByOwner(req.db, req.params.owner, function(err, schedules){
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
    schedules.getByOwnerGroup(req.db, req.params.group, function(err, schedules){
        if (err) {
            console.error(err);
            res.status(500);
        }
        else {
            res.json(schedules);
        }
    });
});

/* GET schedule information */
router.get('/schedules/view/:id', function(req, res) {
    schedules.get(req.db, req.params.id, function(err, schedule){
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
 * Export the routes.
*/

module.exports = router;
