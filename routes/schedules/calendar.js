var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var async = require('async');

var User = require('../../models/users');
var Group = require('../../models/groups');
var Schedule = require('../../models/schedules');
var Pledge = require('../../models/pledges');
var Fulfilment = require('../../models/fulfilments');

var config = require('../../config');

var response = require('../response');
var m = require('../middlewares');

var _h = require('../helpers');

var moment = require('moment');
moment.locale(config.locale);

/*
 * Calendar
 * Return the schedules in the format expected by fullcalendar.io
*/

var getScheduleClass = function(schedule, requestingUser, callback) {
    Pledge.findOne({
        schedule: schedule._id, 
        username: requestingUser.username
    }, function(err, pledge) {
        if (err) return callback(err);

        // Pledged schedules are green, others are read
        callback(err, (pledge ? 'bg-success' : 'bg-danger'));
    });
};

var makeCalendarFormat = function(results, requestingUser, callback) {
    var formatted = [];

    async.each(results, function(s, next) {
        getScheduleClass(s, requestingUser, function(err, scheduleClass) {
            if (err) return next(err);

            formatted.push ({
                title: s.title,
                description: s.description,
                start: moment(s.start_time).format(),
                end: moment(s.end_time).format(),
                owner: s.owner,
                url: '/' + config.dictionary.schedule.noun.plural + '/view/' + s._id,
                className: scheduleClass
            });
            next();
        });
    }, function(err) {
        callback(err, formatted)
    });
};

// retrieve events for populating the schedules calendar
router.get('/', function(req, res) {

    // Admin or not?
    if (req.user.admin) {

        // Retrieve all schedules
        Schedule.find({}, function(err, schedules) {
            if (err) return response.JSON.error.server(res, err); 
            makeCalendarFormat(schedules, req.user, function(err, format) {
                if (err) return response.JSON.error.server(res, err); 
                res.json(format);
            });
        });
    } else {     

        async.parallel([
            // Find schedules owner by requesting user
            function(next) {
                Schedule.find({ owner: req.user.username }).exec(next);
            },

            // Find schedules in the groups of the requesting user
            function(next) {
                req.user.groups = req.user.groups || [];
                Schedule.groups(req.user.groups, next);
            }
        ], function(err, results) {
            if (err) return response.JSON.error.server(res, err); 

            // Clean results
            var r = results[0];
            for (var i = 1; i < results.length; i++)
                r = r.concat(results[i]);
            results = _h.uniqFast(r);

            // Map them into the appropriate format
            makeCalendarFormat(results, req.user, function(err, format) {
                if (err) return response.JSON.error.server(res, err); 
                res.json(format);
            });
        });
    }
});

/*
 * Export the routes.
*/

module.exports = router;
