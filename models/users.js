var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  groups: {
    type: [String]
  },
  admin: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('User', UserSchema);
