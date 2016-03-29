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

var scheduleStatistics = function(usernames, callback) {
	var result = {
		total: 0
	};

	Schedule.find({owner: { $in: usernames }}).exec(function(err, schedules) {
		if (err) return callback(err);
		schedules.forEach(function(schedule) {
			result.total += moment.duration(moment(schedule.end_time).diff(schedule.start_time));
		});
		result.n = schedules.length;
		callback(err, result);
	});
};

var fulfilmentStatistics = function(usernames, callback) {
	var result = {
		total: 0,
		real_time: 0,
		retrospective: 0
	};

	Fulfilment.find({username: { $in: usernames }}).exec(function(err, fulfilments) {
		if (err) return callback(err);
		fulfilments.forEach(function(fulfilment) {
			var duration = moment.duration(moment(fulfilment.end_time).diff(fulfilment.start_time));
			result.total += duration;
			if (fulfilment.real_time) {
				result.real_time += duration;
			} else {
				result.retrospective += duration;
			}
		});
		result.n = fulfilments.length;
		callback(err, result);
	});
};

var pledgeStatistics = function(usernames, callback) {
	var result = {
		total: 0,
		fulfilled: 0
	};

	Pledge.find({username: { $in: usernames }}).exec(function(err, pledges) {
		if (err) return callback(err);

		result.n = pledges.length;

		async.each(pledges, function(pledge, next) {
			Schedule.findById(pledge.schedule, function(err, schedule) {
				if (err || !schedule) return next(err);

				// Add time to object
				result.total += moment.duration(moment(schedule.end_time).diff(schedule.start_time));

				// Add fulfilment information
				Fulfilment.overlaps(schedule.start_time, schedule.end_time, function(err, fulfilments) {
					if (err) return next(err);

					fulfilments.some(function(fulfilment) {
						if (fulfilment.username === pledge.username) {
							result.fulfilled += moment.duration(moment(fulfilment.end_time).diff(fulfilment.start_time));
							// TODO - get complete / partial fulfilment
							return true;
						}
					});

					return next();
				});
			});
		}, function done(err) {
			callback(err, result);
		});
	});
};

var setZero = function(a, x) {
	if (a[x] === null || a[x] === 'undefined' || isNaN(a[x])) {
		a[x] = 0;
	};
};

var combineOverviewResult = function(a, b, x) {
	setZero(a, x);
	setZero(b, x);
	a[x] += b[x];
};

var combineOverviewResults = function(a, b) {
	combineOverviewResult(a.schedules, b.schedules, 'total');
	combineOverviewResult(a.schedules, b.schedules, 'n');

	combineOverviewResult(a.fulfilments, b.fulfilments, 'total');
	combineOverviewResult(a.fulfilments, b.fulfilments, 'n');
	combineOverviewResult(a.fulfilments, b.fulfilments, 'real_time');
	combineOverviewResult(a.fulfilments, b.fulfilments, 'retrospective');

	combineOverviewResult(a.pledges, b.pledges, 'total');
	combineOverviewResult(a.pledges, b.pledges, 'n');
	combineOverviewResult(a.pledges, b.pledges, 'fulfilled');
};

var overviewUser = function(username, callback) {
	var results = {
		username: username
	};

	async.parallel([

		// Find schedules
		function(next) {
			scheduleStatistics(username, next);
		},

		// Find fulfilments
		function(next) {
			fulfilmentStatistics(username, next);
		},

		// Find pledges
		function(next) {
			pledgeStatistics(username, next);
		}

	], function done(err, result) {
		results.schedules = result[0];
		results.fulfilments = result[1];
		results.pledges = result[2];
		callback(err, results);
	});
};

// Retrieve statistics for groups
var overviewGroups = function(callback) {
	var results = {};

	Group.find({}).exec(function(err, groups) {
		if (err) return callback(err);

		async.each(groups, function(group, next){
			Group.members(group.name, function(err, users) {
				if (err) return callback(err);

				var usernames = users.map(function(u) { return u.username });

				results[group.name] = {
					schedules: {},
					fulfilments: {},
					pledges: {},
					users: {
						usernames: usernames,
						n: usernames.length
					}
				};

				async.each(usernames, function(u, _next){
					overviewUser(u, function(err, result) {
						// TODO - store this date for making averages

						combineOverviewResults(results[group.name], result);
						_next(err);
					})
				}, function(err){
					// Make averages
					var users = results[group.name].users.n;
					results[group.name].schedules.meanN = (results[group.name].schedules.n / users);
					results[group.name].schedules.meanTotal = (results[group.name].schedules.total / users);

					next(err);
				});
			});
		}, function done() {
			callback(err, results);
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