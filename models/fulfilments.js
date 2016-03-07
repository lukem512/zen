var mongoose = require('mongoose');

var Schedule = require('./schedules');
var Pledge = require('./pledges');

var FulfilmentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
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
});

FulfilmentSchema.statics.completes = function(id, callback) {
  this.findById(id, function(err, fulfilment){
    if (err) callback(err);
    Schedule.during(fulfilment.start_time, fulfilment.end_time, function(err, schedules){
      if (err) callback(err);
      completion = new Array(schedules.length);
      schedules.forEach(function(s){
        completion[s._id] = "full";
        if (s.start_time < fulfilment.start_time || s.end_time > fulfilment.end_time) {
          completion[s._id] = "partial";
        }
      });
      Pledge.find({
        schedule: { $in: schedules.map(function(s){
          return s._id;
        }) }
      }, function(err, pledges){
        var returnval = pledges.map(function(p){
          return {
            _id: p._id,
            username: p.username,
            schedules: p.schedule,
            completion: completion[p.schedule]
          };
        });
        callback(err, returnVal);
      });
    });
  });
}

module.exports = mongoose.model('Fulfilment', FulfilmentSchema);
