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
		console.log('You cannot run installation whilst the file ' + lockFile + ' exists. Please remove it if you wish to run the installation script again.');
		process.exit();
	}

	// Check for existing admin
	User.findOne({
		username: config.admin.username
	}, function(err, admin){
		if (err) {
			console.error(err);
			process.exit(1);
		}

		if (admin) {
			console.log('Installation has already been performed!')
			process.exit();
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
				console.error(err);
				process.exit(1);
			}

			// Create lock file
			fs.writeFile(lockFile,
				'Do not remove this file unless you wish to run the installation script again.',
				function(err) {
					if (err) {
						console.error(err);
						process.exit(1);
					}
					console.log('Installation complete!');
					process.exit();
				});
		});
	});
};

module.exports = install;
