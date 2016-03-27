
var Pledge = require('../../models/pledges');

var _sh = require('../schedules/helpers');

// Create a new pledge
module.exports.newPledge = function(username, schedule, requestingUser, callback) {
    // Create Pledge object
    var pledgeObj = {
        username: username,
        schedule: schedule
    };

    // Can't pledge to a past schedule
    _sh.schedulePastDatabase(schedule, function(err, past) {
        if (err) return callback(err);

        // Only let an admin do that!
        if (past && !requestingUser.admin) {
            return callback(pastScheduleError);
        }

        // Add a new pledge, if one does not already exist
        Pledge.findOne(pledgeObj, function(err, existing) {
            if (err) return callback(err, existing);
            var pledge = new Pledge(pledgeObj);
            pledge.save(callback);
        });
    })
};
