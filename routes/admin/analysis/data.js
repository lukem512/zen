var express = require('express');
var router = express.Router();

var async = require('async');
var moment = require('moment');
var sanitize = require('mongo-sanitize');
var csv = require('express-csv');
var sm = require('statistical-methods');

var User = require('../../../models/users');
var Group = require('../../../models/groups');
var Fulfilment = require('../../../models/fulfilments');

var response = require('../../response');

var defaultRange = function(start_time, end_time) {
	var dateFormat = 'DD-MM-YYYY';
	var start = moment(start_time, dateFormat),
		end = moment(end_time, dateFormat);

	if (!start.isValid()) {
		start = moment()
			.set('year', 1970)
			.set('month', 1)
			.set('day', 1)
			.set('hour', 0)
			.set('minute', 0)
			.set('second', 0);
	}

	if (!end.isValid()) {
		end = moment();
	}

	return {
		start_time: start,
		end_time: end
	};
};

// Return all fulfilments in the form: username, groups, timestamp, duration
var getFulfilmentsCSV = function (start_time, end_time, callback) {
	var result = [];
	var range = defaultRange(start_time, end_time);

	result.push(["Username", "Groups", "Timestamp", "Duration"]);

	User.find({}).sort({ groups: 'desc' }).exec(function(err, users) {
		if (err) return callback(err);

		var groups = {};
		users.forEach(function(u) {
			groups[u.username] = (u.groups && u.groups.length > 0) ? u.groups : 'CONTROL';
		});

		Fulfilment.overlaps(range.start_time, range.end_time, function(err, fulfilments) {
			if (err) return callback(err);

			fulfilments.forEach(function(f) {
				var duration = moment(f.end_time).diff(f.start_time);
				result.push([f.username, groups[f.username], f.start_time, duration]);
			});
			callback(err, result);
		})
	});
};

// Return all counts in the form: username, groups, total
var getCountsCSV = function (start_time, end_time, callback) {
	var result = [];
	var range = defaultRange(start_time, end_time);

	result.push(["Username", "Groups", "Count"]);

	User.find({}).sort({ groups: 'desc' }).exec(function(err, users) {
		if (err) return callback(err);

		var groups = {};
		async.each(users, function(u, next) {
			groups[u.username] = (u.groups && u.groups.length > 0) ? u.groups : 'CONTROL';
			Fulfilment.count({
				username: u.username,
				start_time: { $lt: range.end_time },
	    	end_time: { $gt: range.start_time }
			}, function(err, count) {
				if (err) return next(err);
				result.push([u.username, groups[u.username], count]);
				next()
			});
		}, function(err) {
			callback(err, result);
		});
	});
};

// Return the total fulfilment times of participants in the form:
// username, groups, total duration
var getDurationsCSV = function (start_time, end_time, callback) {
	getFulfilmentsCSV(start_time, end_time, function(err, data) {
		if (err) return callback(err);

		// Remove the CSV heading line
		data.splice(0, 1)

		var result = [];
		result.push(['Username', 'Groups', 'Total Duration']);

		var Username = 0, Groups = 1, Duration = 3;

		var durations = {};
		data.forEach(function(d) {
			if (!durations[d[Groups]]) durations[d[Groups]] = {};
			if (!durations[d[Groups]][d[Username]]) durations[d[Groups]][d[Username]] = 0;
			durations[d[Groups]][d[Username]] += d[Duration];
		});

		Object.keys(durations).forEach(function(group) {
			Object.keys(durations[group]).forEach(function(username) {
				result.push([username, group, durations[group][username]])
			});
		});

		callback(err, result);
	})
};

// Return the regularity of frequency of fulfilment times in the form:
// username, groups, variance
var getRegularityCSV = function (start_time, end_time, callback) {
	getFulfilmentsCSV(start_time, end_time, function(err, data) {
		if (err) return callback(err);

		// Remove the CSV heading line
		data.splice(0, 1)

		var result = [];
		result.push(['Username', 'Groups', 'Variance']);

		var Username = 0, Groups = 1, Timestamp = 2, Duration = 3;

		var fulfilments = [];
		data.forEach(function(d) {
			if (!fulfilments[d[Username]]) {
				fulfilments[d[Username]] = {
					data: [],
					groups: d[Groups]
				};
			}

			var start = moment(d[Timestamp]);
			var end = moment(d[Timestamp]).add(moment.duration(d[Duration]));

			fulfilments[d[Username]].data.push({
				start: start,
				end: end
			});
		});

		Object.keys(fulfilments).forEach(function(username) {
			// Sort by start time
			var sorted = fulfilments[username].data.sort(function(a, b) {
				if (a.start.isBefore(b.start)) return -1;
				if (a.start.isAfter(b.start)) return 1;
				return 0;
			});

			// Find time between fulfilments
			var differences = [];
			for(var i = 0; i < sorted.length - 1; i++) {
				differences.push(sorted[i + 1].start.diff(sorted[i].end, 'minutes'));
			}

			var variance = 0;
			if (differences.length > 1) {
				variance = sm.variance(differences);
			}

			result.push([username, fulfilments[username].groups, variance]);
		});

		callback(err, result);
	})
};

// Return the frequency of fulfilment times in the form: duration, groups, frequency
var getFrequencyCSV = function (start_time, end_time, callback) {
	getFulfilmentsCSV(start_time, end_time, function(err, data) {
		if (err) return callback(err);

		// Remove the CSV heading line
		data.splice(0, 1)

		var result = [];
		result.push(['Duration', 'Groups', 'Frequency']);

		var Duration = 3, Groups = 1;

		var frequencies = {};
		data.forEach(function(d) {
			if (!frequencies[d[Duration]]) frequencies[d[Duration]] = {};
			if (!frequencies[d[Duration]][d[Groups]]) frequencies[d[Duration]][d[Groups]] = 1;
			else frequencies[d[Duration]][d[Groups]]++;
		});

		Object.keys(frequencies).forEach(function(duration) {
			Object.keys(frequencies[duration]).forEach(function(group) {
				result.push([duration, group, frequencies[duration][group]])
			});
		});

		callback(err, result);
	})
};

// Return the frequency of fulfilment times in the form:
// groups, mean, median, mode, range, stddev
var getGroupTotalsCSV = function (start_time, end_time, callback) {
	getFulfilmentsCSV(start_time, end_time, function(err, data) {
		if (err) return callback(err);

		// Remove the CSV heading line
		data.splice(0, 1)

		var result = [];
		result.push(['Groups', 'Participant Count',
								 'Mean', 'Median', 'Mode', 'Range',
								 'Minimum', 'Maximum', 'Standard Deviation']);

	  var Username = 0, Groups = 1, Timestamp = 2, Duration = 3;

		var totals = {};
		data.forEach(function(d) {
			if (!totals[d[Groups]]) totals[d[Groups]] = {};
			if (!totals[d[Groups]][d[Username]]) totals[d[Groups]][d[Username]] = [];
			totals[d[Groups]][d[Username]].push(d[Duration]);
		});

		Object.keys(totals).forEach(function(group) {
			var durations = [];
			Object.keys(totals[group]).forEach(function(username) {
				durations.push(sm.sum(totals[group][username]));
			});

			result.push([
				group,
				Object.keys(totals[group]).length,
				sm.mean(durations),
				sm.median(durations),
				sm.mode(durations),
				sm.range(durations),
				sm.min(durations),
				sm.max(durations),
				sm.stddev(durations)
			]);
		});

		callback(err, result);
	})
};

router.get('/fulfilments', function(req, res) {
	getFulfilmentsCSV(null, null, function(err, data) {
		if (err) return response.error.server(req, res, err);
		return res.csv(data);
	})
});

router.get('/fulfilments/:from/:to', function(req, res) {
	getFulfilmentsCSV(
		sanitize(req.params.from),
		sanitize(req.params.to),
		function(err, data) {
			if (err) return response.error.server(req, res, err);
			return res.csv(data);
		})
});

router.get('/counts', function(req, res) {
	getCountsCSV(null, null, function(err, data) {
		if (err) return response.error.server(req, res, err);
		return res.csv(data);
	})
});

router.get('/frequency', function(req, res) {
	getFrequencyCSV(null, null, function(err, data) {
		if (err) return response.error.server(req, res, err);
		return res.csv(data);
	})
});

router.get('/regularity', function(req, res) {
	getRegularityCSV(null, null, function(err, data) {
		if (err) return response.error.server(req, res, err);
		return res.csv(data);
	})
});

router.get('/group', function(req, res) {
	getGroupTotalsCSV(null, null, function(err, data) {
		if (err) return response.error.server(req, res, err);
		return res.csv(data);
	})
});

router.get('/durations', function(req, res) {
	getDurationsCSV(null, null, function(err, data) {
		if (err) return response.error.server(req, res, err);
		return res.csv(data);
	})
});

/*
 * Export the routes.
*/

module.exports = router;
