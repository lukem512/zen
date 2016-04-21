var express = require('express');
var router = express.Router();

var async = require('async');
var moment = require('moment');
var sanitize = require('mongo-sanitize');
var csv = require('express-csv');

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

/*
 * Export the routes.
*/

module.exports = router;
