var mongoose = require('mongoose');
var mongoose_deleted = require('mongoose-deleted');

var Schedule = require('./schedules');
var Pledge = require('./pledges');

var FulfilmentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date
  },
  ongoing: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

FulfilmentSchema.statics.overlaps = function(start_time, end_time, callback) {
  this.find({
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  }, callback);
};

var _completes = function(fulfilment, callback) {
Schedule.during(fulfilment.start_time, fulfilment.end_time, function(err, schedules){
    if (err) return callback(err);

    // Add meta data to schedules
    var meta = {};

    schedules.forEach(function(s){
      meta[s._id] = {
        title: s.title,
        completion: 'full'
      };
      if (s.start_time < fulfilment.start_time || s.end_time > fulfilment.end_time) {
        meta[s._id].completion = "partial";
      }
    });

    // Find pledges and add completion status
    Pledge.find({
      schedule: { $in: schedules.map(function(s){
        return s._id;
      }) }
    }, function(err, pledges){
      if (err) return callback(err);

      // Extend pledge objects
      returnVal = pledges.map(function(p){
        return {
          _id: p._id,
          username: p.username,
          schedule: p.schedule,
          scheduleTitle: meta[p.schedule].title,
          completion: meta[p.schedule].completion
        };
      });

      // Return the objects
      return callback(err, returnVal);
    });
  });
};

FulfilmentSchema.statics.completes = function(id, callback) {
  this.findById(id, function(err, fulfilment){
    if (err) return callback(err);
    _completes(fulfilment, callback);
  });
};

FulfilmentSchema.methods.completes = function(callback) {
  _completes(this, callback);
};

mongoose_deleted(FulfilmentSchema);
module.exports = mongoose.model('Fulfilment', FulfilmentSchema);
