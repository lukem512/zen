var config = {
	// The name of the application
	name: 'Zen',

	// The organisation running the application
	organisation: 'Luke Mitchell',
	email: 'hi@lukemitchell.co',

	database: {
		// The URI used to connect to your mongo database.
		uri: 'mongodb://zen:password@ds031213.mongolab.com:31213/heroku_0zqsl9g7'
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

  	// Pages to create. These are not included in the navigation
  	// unless specified.
  	pages: {
  		directory: 'views/pages',
  		views: {
  			// This describes the about page.
  			// The page will be added to the navigation bar
  			// with the link text 'About'.
	  		about: {
	  			title: 'About',
	  			href: '/about'
	  		},
	  		// The link text has been changed here from the default,
	  		// which is 'contact'. This link is not displayed.
	  		contact: {
	  			title: 'Contact us',
	  			href: '/contact',
	  			nav: false
	  		}
  		}
  	},

  	// Additional links to include in the navigation bar
	links:
	[
  		{
  			title: 'Home',
  			href: '/'
  		},
  		// This is a link to an off-site page.
  		// This link opens in a new window.
  		{
  			title: 'Code',
  			href: 'https://github.com/lukem512/zen',
  			popup: true
  		}
  	],

  	// Dictionary of vocabulary.
  	// These can be customised to suit the application.
  	dictionary: {
  		action: {
  			// The action is the most important part to change!
			noun: 'meditation',
			verb: {
				present: 'meditate',
				past: 'meditated'
			}
		},
		schedule: {
			noun: 'schedule',
			verb: {
				present: 'schedule',
				past: 'scheduled'
			}
		},
		pledge: {
			noun: 'pledge',
			verb: {
				present: 'pledge',
				past: 'pledged'
			}
		},
		fulfilment: {
			noun: 'fulfilment',
			verb: {
				present: 'fulfil',
				past: 'fulfilled'
			}
		}
    },

    // Function to create list of navigation items
    // No need to modify this unless you know what you're doing!
    nav: function() {
    	var views = this.pages.views;
    	var pageLinks = [];
    	Object.keys(this.pages.views).forEach(function(page){
    		page = views[page];

    		// Displaying a page in the navigation is the default behaviour
    		var nav = true;
    		if (page.nav != null)
    			nav = page.nav;

    		if (nav) {
    			pageLinks.push(page);
    		}
    	});
    	return this.links.concat(pageLinks);
    }
};

module.exports = config;
