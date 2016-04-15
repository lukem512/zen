var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var User = require('../../models/users');
var Group = require('../../models/groups');
var Schedule = require('../../models/schedules');
var Pledge = require('../../models/pledges');
var Fulfilment = require('../../models/fulfilments');

var config = require('../../config');

var response = require('../response');
var m = require('../middlewares');

var h = require('./helpers');
var _ph = require('../pledges/helpers');

var moment = require('moment');
moment.locale(config.locale);

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

router.get('/list', m.isAdmin, function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) return response.JSON.error.server(res, err);
        res.json(schedules);
    });
});

router.get('/list/owner/:username', function(req, res) {
    var username = sanitize(req.params.username);

    m._isSameGroupOrAdmin(req.user, user, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);
        
        if (authorised) {
            Schedule.find({ owner: username }, function(err, schedules){
                if (err) return response.JSON.error.server(res, err);
                res.json(schedules);
            });
        } else {
            return response.JSON.invalid(res);
        }
    });
});

router.get('/list/group/:group', function(req, res) {
    var group = sanitize(req.params.group);

    // Is the requesting user a member of the specified group?
    if (req.user.groups.indexOf(group) || req.user.admin) {
        Schedule.group(group, function(err, schedules){
            if (err) return response.JSON.error.server(res, err);
            res.json(schedules);
        });
    } else {
        return response.JSON.invalid(res);
    }
});

router.get('/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id)).select('+deleted').exec(function(err, schedule){
        if (err) return response.JSON.error.server(res, err);
        if (!schedule) return response.JSON.error.notfound(res);

        m._isSameGroupOrAdminDatabase(req.user, schedule.owner, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                res.json(schedule);
            } else {
                return response.JSON.invalid(res);
            }
        });
    });
});

router.post('/new', m.isAdminOrCurrentUser, function(req, res) {
    var username = sanitize(req.body.username);

    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: username
    });

    if (h.schedulePast(schedule) && !requestingUser.admin) {
        return response.JSON.invalid(res);
    }

    if (!h.timesValid(schedule.start_time, schedule.end_time)) {
        return response.JSON.invalid(res);
    }

    schedule.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);

        _ph.newPledge(username, doc._id, req.user, function(err, doc) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

router.post('/update', m.isAdminOrCurrentUser, function(req, res) {
    Schedule.findById(sanitize(req.body.id), function(err, schedule) {
        if (err) return response.JSON.error.server(res, err);

        // Check the schedule isn't in the past
        if (h.schedulePast(schedule) && !req.user.admin) {
            return response.JSON.invalid(res);
        }

        var obj = {
            title: sanitize(req.body.title),
            description: sanitize(req.body.description),
            start_time: new Date(req.body.start_time),
            end_time: new Date(req.body.end_time)
        };

        if (!h.timesValid(obj.start_time, obj.end_time)) {
            return response.JSON.invalid(res);
        }

        var owner = sanitize(req.body.owner);
        if (owner) {
            obj.owner = owner;
        }

        schedule.update(obj, function(err, result) {
            if (err) return response.JSON.error.server(res, err);
            if (!result) return response.JSON.error.notfound(res);
            response.JSON.ok(res);
        });
    });
});

router.delete('/update/:id', function(req, res) {
    h.deleteSchedule(sanitize(req.params.id), req.user, function(err, result) {
        if (err) {
            switch (err) {
                case pastScheduleError:
                    return response.JSON.invalid(res);

                case notAuthorisedError:
                    res.status(403).json({message: notAuthorisedError});

                default:
                    return response.JSON.error.server(res, err);
            }
        }
        if (!result) return response.JSON.error.notfound(res);
        response.JSON.ok(res);
    });
});

/*
 * Export the routes.
*/

module.exports = router;
