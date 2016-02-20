var mongoose = require('mongoose');

var PledgeSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  schedule: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Pledge', PledgeSchema);
