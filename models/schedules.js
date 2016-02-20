var mongoose = require('mongoose');

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
  	required: true
  }
});

ScheduleSchema.statics.during = function(start_time, end_time, callback) {
  this.find({
    $or: [
      { start_time: { $gte: start_time } },
      { end_time: { $lte: end_time } }
    ]
  }, callback);
};

ScheduleSchema.statics.group = function(group, callback) {
  var schedules = this;
  Group.members(group, function(err, users){
    if (err) callback(err);
    var usernames = users.map(function(u){
      return u.username;
    });
    schedules.find({
      owner: { $in: usernames }
    }, callback);
  });
};

module.exports = mongoose.model('Schedule', ScheduleSchema);
