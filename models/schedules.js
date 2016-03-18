var mongoose = require('mongoose');
var mongoose_deleted = require('mongoose-deleted');
var async = require('async');

var Group = require('./groups');

var ScheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  start_time: {
  	type: Date,
  	required: true
  },
  end_time: {
  	type: Date,
  	required: true
  },
  owner: {
  	type: String,
  	required: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// TODO - clarify and check
ScheduleSchema.statics.during = function(start_time, end_time, callback) {
  this.find({
    $or: [
      { start_time: { $gte: start_time, $lt: end_time } },
      { start_time: { $lt: start_time }, end_time: { $gte: end_time } }
    ]
  }, callback);
};

// Find schedules which occur between two tightly defined times.
// Start and end times are inclusive.
ScheduleSchema.statics.bounded = function(start_time, end_time, callback) {
  this.find({
    start_time: { $gte: start_time, $lt: end_time },
    end_time: { $lte: end_time, $gt: start_time}
  }, callback);
};

// Find schedules which occur between two loosely defined times.
ScheduleSchema.statics.overlaps = function(start_time, end_time, callback) {
  this.find({
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  }, callback);
};

ScheduleSchema.statics.group = function(group, callback) {
  var schedules = this;
  Group.members(group, function(err, users){
    if (err) return callback(err);
    if (!users) return callback(err, []);
    var usernames = users.map(function(u){
      return u.username;
    });
    schedules.find({
      owner: { $in: usernames }
    }, callback);
  });
};

ScheduleSchema.statics.groups = function(groups, callback) {
  var schedules = this;
  var results = [];
  async.eachSeries(groups, function(group, next) {
    schedules.group(group, function(err, items) {
      if (err) {
        return next(err);
      }
      else {
        results = results.concat(items);
        next();
      }
    });
  }, function done(err) {
    callback(err, results)
  });
};

ScheduleSchema.statics.owner = function(username, callback) {
  var schedules = this;
  schedules.find({
    owner: username
  }, callback);
};

ScheduleSchema.statics.owners = function(usernames, callback) {
  var schedules = this;
  schedules.find({
    owner: { $in: usernames }
  }, callback);
};

ScheduleSchema.methods.ownedBy = function(usernames, callback) {
  if (typeof(usernames) === 'string') usernames = [usernames];
  return (usernames.indexOf(this.owner) > -1);
};

mongoose_deleted(ScheduleSchema);
module.exports = mongoose.model('Schedule', ScheduleSchema);
