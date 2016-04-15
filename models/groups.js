var mongoose = require('mongoose');
var mongoose_deleted = require('mongoose-deleted');

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

// Retrieve a list of members from a group,
// use 'ungrouped' users is the group name is null.
GroupSchema.statics.members = function(name, callback) {
	if (name) {
		this.findOne({
			name: name
		}, function(err, group){
			if (err) return callback(err);
			if (!group) return callback(err, null);
			
			User.find({
				groups: group.name
			}, callback);
		});
	}
	else {
		User.find({
			$or: [
				{ groups: { $size: 0}},
				{ groups: null }
			]
		}, callback);
	}
};

mongoose_deleted(GroupSchema);
module.exports = mongoose.model('Group', GroupSchema);
