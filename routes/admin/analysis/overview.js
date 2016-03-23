var express = require('express');
var router = express.Router();

var async = require('async');
var moment = require('moment');

var User = require('../../../models/users');
var Group = require('../../../models/groups');
var Schedule = require('../../../models/schedules');
var Pledge = require('../../../models/pledges');
var Fulfilment = require('../../../models/fulfilments');

var m = require('../../middlewares');
var response = require('../../response');

// Retrieve statistics for groups
var overviewGroups = function(callback) {
	var result = {};

	Group.find({}).exec(function(err, groups) {
		if (err) return callback(err);
		groups.forEach(function(group) {
			Group.members(group.name, function(err, users) {
				if (err) return callback(err);

				var usernames = users.map(function(u) { return u.username });

				result[group.name] = {
					schedules: {
						total: 0
					},
					fulfilments: {
						total: 0
					},
					pledges: {
						total: 0,
						fuflfilled: 0
					},
					users: {
						usernames: usernames,
						n: usernames.length
					}
				};

				async.parallel([

					// Find schedules
					function(next) {
						Schedule.find({owner: { $in: usernames }}).exec(function(err, schedules) {
							if (err) return next(err);
							schedules.forEach(function(schedule) {
								result[group.name].schedules.total += moment.duration(moment(schedule.end_time).diff(schedule.start_time));
							});
							result[group.name].schedules.n = schedules.length;
							next();
						});
					},

					// Find fulfilments
					function(next) {
						Fulfilment.find({username: { $in: usernames }}).exec(function(err, fulfilments) {
							if (err) return next(err);
							fulfilments.forEach(function(fulfilment) {
								result[group.name].fulfilments.total += moment.duration(moment(fulfilment.end_time).diff(fulfilment.start_time));
							});
							result[group.name].fulfilments.n = fulfilments.length;
							next();
						});
					},

					// Find pledges
					// TODO - make this work
					function(next) {
						Pledge.find({username: { $in: usernames }}).exec(function(err, pledges) {
							if (err) return next(err);
							pledges.forEach(function(pledge) {
								console.log('Looking for ',pledge.schedule);
								Schedule.findById(pledge.schedule, function(err, schedule) {
									if (err) return next(err);
									if (!schedule) return next('Not found');

									console.log('Looking for ',pledge.schedule);
									Fulfilment.overlaps(schedule.start_time, schedule.end_time, function(err, fulfilments) {
										if (err) return next(err);
										fulfilments.some(function(fulfilment) {
											if (fulfilment.username === pledge.username) {
												result[group.name].pledges.fulfilled += moment.duration(moment(fulfilment.end_time).diff(fulfilment.start_time));;
												// TODO - get complete / partial fulfilment
												return true;
											}
										});
									});
									result[group.name].pledges.total += moment.duration(moment(schedule.end_time).diff(schedule.start_time));;
								});
							});
							result[group.name].pledges.n = pledges.length;
							next();
						});
					}
				], function done(err) {
					callback(err, result);
				});
			});
		});
	});
};

router.get('/', function(req, res) {
    overviewGroups(function(err, data){
        if (err) return response.JSON.error.server(res, err);
        res.json(data);
    });
});

/*
 * Export the routes.
*/

module.exports = router;