var async = require('async');
var moment = require('moment');
var sanitize = require('mongo-sanitize');

var User = require('../../../models/users');
var Group = require('../../../models/groups');
var Schedule = require('../../../models/schedules');
var Pledge = require('../../../models/pledges');
var Fulfilment = require('../../../models/fulfilments');

var m = require('../../middlewares');
var response = require('../../response');

var config = require('../../../config');

// Retrieve a list of members from a group,
// use 'ungrouped' users is the group name is null.
var members = function(group, callback) {
	if (group) {
		Group.members(group, callback);
	}
	else {
		User.find({
			$or: [
				{ groups: { $size: 0}},
				{ groups: null }
			]
		}, callback);
	}
};

// Rank the list.
// Inspired by https://gist.github.com/gungorbudak/1c3989cc26b9567c6e50
var rank = function(list, key) {
	var key = key || 'total';

	// First, sort in ascending order
	list.sort(function(a, b) {
		return (a[key] - b[key]);
	});

	// Second, add the rank to the objects
	list = list.map(function(item, index) {
		item.rank = index + 1;
		return item;
	});

	// Third, use median values for groups with the same rank
	for (var i = 0; i < list.length; /* nothing */ ) {
		var count = 1;
		var total = list[i].rank;
		
		for (var j = 0; list[i + j + 1] && (list[i + j][key] === list[i + j + 1][key]); j++) {
			total += list[i + j + 1].rank;
			count++;
		}

		var rank = (total / count);

		for (var k = 0; k < count; k++) {
			list[i + k].rank = rank;
		}

		i = i + count;
	}

	return list;
}

// Compute the rank of a group, given a ranked
// list and a list of members.
var groupRank = function(rankedList, members) {
	var rank = 0;

	rankedList.forEach(function(username) {
		if (members.indexOf(username)) {
			rank += username.rank;
		}
	});

	return rank;
};

// Compute the U value of a group.
var uValue = function(rank, members) {
	var k = members.length;
	return rank - ((k * (k+1)) / 2);
};

// Perform the Mann-Whitney U test.
// groupA and groupB are the names of groups to compare,
// if a group is null then 'ungrouped' users are used.
module.exports.uTest = function(groupA, groupB, callback) {
	async.parallel([
		function(next) {
			members(groupA, next);
		},
		function(next) {
			members(groupB, next);
		}
	], function done(err, members) {
		if (err) return callback(err);
		if (!members[0] || !members[1]) return callback('Not found');

		// Store list of members from each group
		var membersA = members[0].map(function(member) { return member.username });
		var membersB = members[1].map(function(member) { return member.username });

		// Warn if empty
		if (membersA.length == 0) console.warn('Running U test on an empty group (' + groupA + ')');
		if (membersB.length == 0) console.warn('Running U test on an empty group (' + groupB + ')');

		// Combine results
		var all = membersA.concat(membersB);

		// Retrieve the fulfilments for all the members
		var fulfilments = [];
		async.each(all, function(username, next) {
			Fulfilment.find({ username: username}, function(err, f){
				fulfilments.push(f);
				next(err);
			});
		}, function done(err) {
			if (err) return callback(err);

			// Initial ranking
			var ranked =[];

			// Compute total time fulfilled
			fulfilments.forEach(function(schedules, index) {
				var total = 0;
				schedules.forEach(function(s) {
					total += moment.duration(moment(s.end_time).diff(s.start_time));
				});
				ranked[index] = {
					username: all[index],
					total: total
				};
			});

			// Rank the list by the total time fulfilled
			var ranked = rank(ranked);

			// Find the rank of each group
			var rankA = groupRank(ranked, membersA);
			var rankB = groupRank(ranked, membersB);

			// Compute the U values
			var uA = uValue(rankA, membersA);
			var uB = uValue(rankB, membersB);

			// An optimisation is to use a property of the U test
			// to calculate the U value of group B based on the value
			// of group A
			// var uB = (membersA.length * membersB.length) - uA;

			// Return results object
			var results = {};
			results[groupA] = uA;
			results[groupB] = uB;

			callback(err, results);
		});
	});
};
