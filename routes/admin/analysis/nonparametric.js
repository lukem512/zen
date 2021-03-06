var async = require('async');
var moment = require('moment');
var sanitize = require('mongo-sanitize');
var mwu = require('mann-whitney-utest');
var sm = require('statistical-methods');

var User = require('../../../models/users');
var Group = require('../../../models/groups');
var Schedule = require('../../../models/schedules');
var Pledge = require('../../../models/pledges');
var Fulfilment = require('../../../models/fulfilments');

var m = require('../../middlewares');
var response = require('../../response');

var config = require('../../../config');

// Perform the Mann-Whitney U test.
// groupA and groupB are the names of groups to compare,
// if a group is null then 'ungrouped' users are used.
module.exports.uTest = function(groupA, groupB, callback, trim) {
	async.parallel([
		function(next) {
			Group.members(groupA, next);
		},
		function(next) {
			Group.members(groupB, next);
		}
	], function done(err, members) {
		if (err) return callback(err);
		if (!members[0] || !members[1]) return callback('Not found');

		// Warn if empty
		for (var i = 0; i < 2; i++) {
			if (members[i].length == 0) {
				var group = (i == 0 ? groupA : groupB);
				console.warn('Running U test on an empty group (' + group + ')');
			}
		}

		// Store a list of member usernames
		var usernames = [];
		for (var i = 0; i < 2; i++) {
			usernames[i] = members[i].map(function(member) { return member.username });
		}

		var fulfilments = [];
		async.forEachOf(members, function(sampleMembers, index, outer) {
			async.each(sampleMembers, function(member, inner) {
				Fulfilment.find({ username: member.username}, (function(i, username){
					return function(err, f){
						fulfilments.push({
							u: username,
							f: f
						});
						inner(err);
					};
				})(index, member.username));
			}, outer);
		}, function(err) {
			if (err) return callback(err);

			// Initial ranking
			var samples = [];

			// Compute total time fulfilled
			fulfilments.forEach(function(fulfilments) {
				var total = 0;
				fulfilments.f.forEach(function(s) {
					total += moment.duration(moment(s.end_time).diff(s.start_time));
				});
				if (trim && total <= 0) { return };

				for (var i = 0; i < 2; i++) {
					if (usernames[i].indexOf(fulfilments.u) > -1) {
						if (!samples[i]) samples[i] = [];
						samples[i].push(total);
					}
				}
			});

			var u = mwu.test(samples);

			if (!mwu.check(u, samples)) {
				return callback('Mann-Whitney check failed');
			}

			// 	// Return results object
			var results = {};
			results[groupA] = {};
			results[groupA].u = u[0];
			results[groupA].mean = sm.mean(samples[0]);
			results[groupA].median = sm.median(samples[0]);
			results[groupA].n = samples[0].length;
			
			results[groupA].critical = mwu.criticalValue(u, samples);

			results[groupB] = {};
			results[groupB].u = u[1];
			results[groupB].mean = sm.mean(samples[1]);
			results[groupB].median = sm.median(samples[1]);
			results[groupB].n = samples[1].length;

			callback(err, results);
		});
	});
};
