var config = {
	database: {
		// The URI used to connect to your mongo database.
		uri: 'mongodb://localhost:27017/zen'
	},
	token: {
		// This is used to encrypt client connections.
		// Change this to something secure.
		secret: 'super_secure_string_here'
	},
	admin: {
		// The initial admin credentials.
		// These should be changed as soon as possible
		// after installation.
		username: 'admin',
		password: 'change_me',
		email: 'you@yourdomain.com'
	}
};

module.exports = config;
