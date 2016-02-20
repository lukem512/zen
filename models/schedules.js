var mongoose = require('mongoose');

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

module.exports = mongoose.model('Schedule', ScheduleSchema);
