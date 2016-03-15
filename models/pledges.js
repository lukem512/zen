var mongoose = require('mongoose');
var mongoose_deleted = require('mongoose-deleted');

var PledgeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true
  },
  schedule: {
    type: String,
    required: true
  },
  fulfilment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'fulfilment',
    required: false
  }
}, {
  timestamps: true
});

PledgeSchema.statics.complete = function(callback) {
  this.find({fulfilment: { $ne: null }}, callback);
};

PledgeSchema.statics.completeSchedule = function(schedule, callback) {
  this.find({
    fulfilment: { $ne: null },
    schedule: schedule
  }, callback);
};

PledgeSchema.statics.completeUser = function(username, callback) {
  this.find({
    fulfilment: { $ne: null },
    username: username
  }, callback);
};

mongoose_deleted(PledgeSchema);
module.exports = mongoose.model('Pledge', PledgeSchema);
