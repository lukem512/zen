var mongoose = require('mongoose');

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


FulfilmentSchema.statics.during = function(start_time, end_time, callback) {
  this.find({
    $or: [
      { start_time: { $gte: start_time, $lt: end_time } },
      { start_time: { $lt: start_time }, end_time: { $gte: end_time } }
    ]
  }, callback);
};

FulfilmentSchema.statics.completes = function(id, callback) {
  this.findById(id, function(err, fulfilment){
    if (err) return callback(err);

    Schedule.during(fulfilment.start_time, fulfilment.end_time, function(err, schedules){
      if (err) return callback(err);

      // Add meta data to schedules
      meta = {};

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
            scheduleTitle: meta[p.schedule].title, /// TODO - sometimes this is not defined!
            completion: meta[p.schedule].completion
          };
        });

        // Return the objects
        return callback(err, returnVal);
      });
    });
  });
}

module.exports = mongoose.model('Fulfilment', FulfilmentSchema);
