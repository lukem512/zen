var mongoose = require('mongoose');

var PledgeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    lowercase: true
  },
  schedule: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Pledge', PledgeSchema);
