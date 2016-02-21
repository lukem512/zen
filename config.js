var config = {
	// The name of the application
	name: 'Zen',
	// The organisation running the application
	organisation: 'Luke Mitchell',
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
	},
	// Pages to include in the navigation bar
	pages: [
  		{
  			name: 'Home',
  			href: '/'
  		},
  		{
  			name: 'About',
  			href: '#'
  		}
  	]
};

module.exports = config;
