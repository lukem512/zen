var express = require('express');
var router = express.Router();

var async = require('async');
var moment = require('moment');
var sanitize = require('mongo-sanitize');
var sm = require('statistical-methods');

var User = require('../../../models/users');
var Group = require('../../../models/groups');
var Schedule = require('../../../models/schedules');
var Pledge = require('../../../models/pledges');
var Fulfilment = require('../../../models/fulfilments');

var m = require('../../middlewares');
var response = require('../../response');

var config = require('../../../config');

var nonparametric = require('./nonparametric');
var parametric = require('./parametric');

var scheduleStatistics = function(usernames, callback) {
	var result = {
		total: 0
	};

	Schedule.find({owner: { $in: usernames }}).exec(function(err, schedules) {
		if (err) return callback(err);

		var durations = schedules.map(function(s) {
			return moment(s.end_time).diff(s.start_time);
		});

		result.total = sm.sum(durations);
		result.range = sm.range(durations);
		result.min = sm.min(durations);
		result.max = sm.max(durations);
		result.mean = sm.mean(durations);
		result.mode = sm.mode(durations);
		result.median = sm.median(durations);
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
			if (fulfilment.real_time) {
				result.real_time += duration;
			} else {
				result.retrospective += duration;
			}
		});

		var durations = fulfilments.map(function(f) {
			return moment(f.end_time).diff(f.start_time);
		});

		result.range = sm.range(durations);
		result.min = sm.min(durations);
		result.max = sm.max(durations);
		result.mean = sm.mean(durations);
		result.mode = sm.mode(durations);
		result.median = sm.median(durations);

		result.total = result.real_time + result.retrospective;
		result.n = fulfilments.length;
		callback(err, result);
	});
};

var pledgeStatistics = function(usernames, callback) {
	var result = {
		total: 0,
		fulfilled: 0
	};

	var durations = [];

	Pledge.find({username: { $in: usernames }}).exec(function(err, pledges) {
		if (err) return callback(err);

		result.n = pledges.length;

		async.each(pledges, function(pledge, next) {
			Schedule.findById(pledge.schedule, function(err, schedule) {
				if (err || !schedule) return next(err);

				// Add time to object
				durations.push(moment(schedule.end_time).diff(schedule.start_time));

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
			result.range = sm.range(durations);
			result.min = sm.min(durations);
			result.max = sm.max(durations);
			result.mean = sm.mean(durations);
			result.mode = sm.mode(durations);
			result.median = sm.median(durations);
			result.total = sm.sum(durations);
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

var overviewGroup = function(groupName, callback) {
	Group.members(groupName, function(err, users) {
		if (err) return callback(err);

		var usernames = [];
		if (users.length > 0)
			usernames = users.map(function(u) { return u.username });

		results = {
			group: groupName,
			schedules: {},
			fulfilments: {},
			pledges: {},
			users: {
				usernames: usernames,
				n: usernames.length
			}
		};

		async.each(usernames, function(u, next){
			overviewUser(u, function(err, result) {
				// TODO - store this data for making averages

				combineOverviewResults(results, result);
				next(err);
			})
		}, function(err){
			// Make averages
			var n = results.users.n;
			results.schedules.meanN = (results.schedules.n / n);
			results.schedules.meanTotal = (results.schedules.total / n);

			callback(err, results);
		});
	});
};

// Retrieve statistics for groups
var overviewGroups = function(callback) {
	Group.find({}).exec(function(err, groups) {
		if (err) return callback(err);
		async.each(groups, function(group, next){
			overviewGroup(group.name, next);
		}, function done(err, results) {
			callback(err, results);
		});
	});
};

router.get('/', function(req, res) {
	Group.find({}, function(err, groups) {

		User.find({}, function(err, users) {

			var results = {
				schedules: {},
				fulfilments: {},
				pledges: {},
				users: {
					usernames: users.map(function(u){return u.username}),
					n: users.length
				}
			};

			async.each(users, function(u, next){
				overviewUser(u.username, function(err, result) {
					// TODO - store this data for making averages

					combineOverviewResults(results, result);
					next(err);
				})
			}, function(err){
				if (err) return response.error.server(req, res, err);

				// Make averages
				results.schedules.meanN = (results.schedules.n / results.users.n);
				results.schedules.meanTotal = (results.schedules.total / results.users.n);

				res.render('admin/analysis/overview', {
			        title: 'Analysis Overview',
			        name: config.name,
			        organisation: config.organisation,
			        nav: config.nav(),
			        user: req.user,
			        dictionary: config.dictionary,
			        statistics: results,
			        users: users,
			        groups: groups
			    });
			});
		});
	});
});

router.get('/compare', function(req, res) {
	Group.find({}, function(err, groups) {
		if (err) return response.error.server(req, res, err);

		res.render('admin/analysis/compare', {
	        title: 'Compare Groups',
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
	        groups: groups
	    });
	});
});

router.get('/user/:username', function(req, res) {
	overviewUser(sanitize(req.params.username), function(err, results) {
		if (err) return response.error.server(req, res, err);

		res.render('admin/analysis/overview', {
	        title: 'User Analysis > ' + req.params.username,
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
	        statistics: results,
	        view: true
	    });
	});
});

router.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		if (err) return response.error.server(req, res, err);

		res.render('admin/analysis/user', {
	        title: 'View User',
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
	        users: users
	    });
	});
});

var _group = function (name, req, res) {
	overviewGroup(name, function(err, results) {
		if (err) return response.error.server(req, res, err);
		if (!name) name = 'Ungrouped';

		res.render('admin/analysis/overview', {
	        title: 'Group Analysis > ' + name,
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
	        statistics: results,
	        view: true
	    });
	});
};

router.get('/group/:name', function(req, res) {
	_group(sanitize(req.params.name), req, res);
});

router.get('/group/', function(req, res) {
	_group(null, req, res);
});

router.get('/groups', function(req, res) {
	Group.find({}, function(err, groups) {
		if (err) return response.error.server(req, res, err);

		res.render('admin/analysis/group', {
	        title: 'View Group',
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
	        groups: groups
	    });
	});
});

var _nonparametric = function(groupA, groupB, trim, req, res) {
	if (groupB == 'null') groupB = null;

	nonparametric.uTest(groupA, groupB, function(err, results) {
		if (err) return response.error.server(req, res, err);

		res.render('admin/analysis/nonparametric', {
			title: 'Nonparametric Analysis',
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
			statistics: results
		});
	}, trim);
}

router.get('/nonparametric/:groupA/:groupB/trim', function(req, res) {
	_nonparametric(sanitize(req.params.groupA), sanitize(req.params.groupB), true, req, res);
});

router.get('/nonparametric/:groupA/:groupB', function(req, res) {
	_nonparametric(sanitize(req.params.groupA), sanitize(req.params.groupB), false, req, res);
});

router.get('/nonparametric/:groupA/', function(req, res) {
	_nonparametric(sanitize(req.params.groupA), null, false, req, res);
});

var _parametric = function(groupA, groupB, trim, req, res) {
	if (groupB == 'null') groupB = null;

	parametric.anova(groupA, groupB, function(err, results) {
		if (err) return response.error.server(req, res, err);

		res.render('admin/analysis/parametric', {
			title: 'Parametric Analysis',
	        name: config.name,
	        organisation: config.organisation,
	        nav: config.nav(),
	        user: req.user,
	        dictionary: config.dictionary,
	        groups: [groupA, groupB],
			statistics: results
		});
	}, trim);
}

router.get('/parametric/:groupA/:groupB/trim', function(req, res) {
	_parametric(sanitize(req.params.groupA), sanitize(req.params.groupB), true, req, res);
});

router.get('/parametric/:groupA/:groupB', function(req, res) {
	_parametric(sanitize(req.params.groupA), sanitize(req.params.groupB), false, req, res);
});

router.get('/parametric/:groupA/', function(req, res) {
	_parametric(sanitize(req.params.groupA), null, false, req, res);
});

/*
 * Export the routes.
*/

module.exports = router;