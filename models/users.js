var mongoose = require('mongoose');
var mongoose_deleted = require('mongoose-deleted');

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
}, {
  timestamps: true
});

mongoose_deleted(UserSchema);
module.exports = mongoose.model('User', UserSchema);
