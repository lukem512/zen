var fs = require('fs');
var bcrypt = require('bcryptjs');

// Load configuration
var config = require('./config');

// Connect to the database
var mongoose = require('mongoose');
mongoose.connect(config.database.uri);

// Retrieve the user model
var User = require('./models/users');

// File used to lock this script
var lockFile = './install.lock';

// Export the function
var install = function() {
	// Check for lock file
	if (fs.existsSync(lockFile)) {
		return console.log('Installation has already been performed! Please remove the file ' + lockFile + ' if you wish to run installation again.');
		return console.log();
	}

	// Check for existing admin
	User.findOne({
		username: config.admin.username
	}, function(err, admin){
		if (err) {
			return console.error(err);
		}

		if (admin) {
			return console.log('Installation has already been performed!');
		}

		var hash = bcrypt.hashSync(config.admin.password);

		var admin = new User({
			username: config.admin.username,
			password: hash,
			email: config.admin.email,
			admin: true
		});

		admin.save(function(err, doc){
			if (err) {
				return console.error(err);
			}

			// Create lock file
			fs.writeFile(lockFile,
				'Do not remove this file unless you wish to run installation again.',
				function(err) {
					if (err) {
						return console.error(err);
					}
					return console.log('Installation complete!');
				});
		});
	});
};

module.exports = install;
