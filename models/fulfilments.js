var mongoose = require('mongoose');

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
  }
});

FulfilmentSchema.methods.completes = function(callback) {
  // Return a list of pledges that this completes
  // TODO
  callback("Not implemented");
}

module.exports = mongoose.model('Fulfilment', FulfilmentSchema);
