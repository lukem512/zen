var mongoose = require('mongoose');

var GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true
  },
  description: {
    type: String,
  }
});

module.exports = mongoose.model('Group', GroupSchema);
