var Schedule = require('../../models/schedules');
var Fulfilment = require('../../models/fulfilments');
var Pledge = require('../../models/pledges');

var config = require('../../config');

var m = require('../middlewares');

var moment = require('moment');
moment.locale(config.locale);

// Are the times valid?
module.exports.timesValid = function(start_time, end_time) {
    return (moment(start_time).diff(end_time) < 0);
};

module.exports.timePast = function(time) {
    return (moment().diff(time) > 0);
};

// Is the schedule in the past?
module.exports.schedulePast = function(schedule) {
    return module.exports.timePast(schedule.end_time);
};

module.exports.schedulePastDatabase = function(scheduleId, callback) {
    Schedule.findById(scheduleId, function(err, schedule) {
        if (err) callback(err);
        if (!schedule) callback(err, response.stringsnotFoundError);
        callback(err, module.exports.schedulePast(schedule));
    });
};

module.exports.deleteSchedule = function(id, requestingUser, callback) {
    Schedule.findById(id, function(err, schedule) {
        if (err || !schedule) return callback(err);

        // Check for Admin, or current User
        if (schedule.owner != requestingUser.username && !requestingUser.admin) {
            return callback(response.strings.notAuthorisedError);
        }

        // Check the schedule isn't in the past
        if (module.exports.schedulePast(schedule) && !requestingUser.admin) {
            return callback(response.strings.pastScheduleError);
        }

        schedule.delete(function(err) {
            if (err) return callback(err);

            // Remove all pledges associated with this schedule
            Pledge.find({schedule: id}, function(err, pledges) {
                pledges.forEach(function(pledge) {
                    pledge.delete(function(err) {
                        if (err) console.error(err);
                    });
                });
            });

            callback(err, schedule);
        });
    });
};

module.exports.getScheduleFulfilments = function(id, requestingUser, callback) {
    // Find the schedule
    Schedule.findById(id, function(err, schedule) {
        if (err) return callback(err);
        if (!schedule) return callback(response.strings.notFoundError);

        m._isSameGroupOrAdminDatabase(requestingUser, schedule.owner, function(err, authorised) {
            if (err) return callback(err);

            if (authorised) {
                // Find all fulfilments during this schedule
                Fulfilment.overlaps(schedule.start_time, schedule.end_time, function(err, fulfilments) {
                    if (err) return callback(err);

                    // Were any of these users pledged?
                    Pledge.find({
                        schedule: id
                    }, function(err, pledges){
                        if (err) return callback(err);
                                        
                        // Find the fulfilments that correspond to pledges
                        var fulfilled = [];
                        pledges.forEach(function(p) {
                            fulfilments.some(function(f) {
                                if (f.username == p.username) {
                                    var obj = {
                                        completion: ((schedule.start_time < f.start_time || schedule.end_time > f.end_time) ? "partial" : "full"),
                                        username: p.username,
                                        owner: schedule.owner
                                    };

                                    fulfilled.push(obj);
                                    return true;
                                }
                            });
                        });

                        return callback(err, fulfilled);
                    });
                });
            } else {
                return callback(response.strings.notAuthorisedError);
            }
        });
    });
};

module.exports.getSchedulePledgersOnline = function(id, requestingUser, callback) {
    // Find the schedule
    Schedule.findById(id, function(err, schedule) {
        if (err) return callback(err);
        if (!schedule) return callback(response.strings.notFoundError);

        m._isSameGroupOrAdminDatabase(requestingUser, schedule.owner, function(err, authorised) {
            if (err) return callback(err);

            if (authorised) {

                // Find users pledged to the schedule.
                Pledge.find({schedule: id}, function(err, pledges) {
                    if (err) return callback(err);

                    var results = {
                        pledged: pledges.map(function(p) { return p.username })
                    };

                    // Find pledged users that are online
                    Fulfilment.find({
                        username: { $in: results.pledged },
                        ongoing: true
                    }, function(err, fulfilments) {
                        if (err) return callback(err);

                        results.online = fulfilments.map(function(f) { return f.username });
                        callback(err, results);
                    });
                });
            }
            else {
                return callback(response.strings.notAuthorisedError);
            }
        });
    });
};
