var mongoose = require('mongoose');

var User = require('./users');

var GroupSchema = new mongoose.Schema({
	name: {
		type: String,
		unique: true,
		required: true
	},
	description: {
		type: String,
	}
}, {
	timestamps: true
});

GroupSchema.statics.members = function(name, callback) {
	this.findOne({
		name: name
	}, function(err, group){
		if (err) return callback(err);
		if (!group) return callback(err, null);
		
		User.find({
			groups: group.name
		}, callback);
	});
};

module.exports = mongoose.model('Group', GroupSchema);
