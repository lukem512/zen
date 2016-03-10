var mongoose = require('mongoose');
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

ScheduleSchema.statics.during = function(start_time, end_time, callback) {
  this.find({
    $or: [
      { start_time: { $gte: start_time, $lt: end_time } },
      { start_time: { $lt: start_time }, end_time: { $gte: end_time } }
    ]
  }, callback);
};

ScheduleSchema.statics.group = function(group, callback) {
  var schedules = this;
  Group.members(group, function(err, users){
    if (err) return callback(err);
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

module.exports = mongoose.model('Schedule', ScheduleSchema);
