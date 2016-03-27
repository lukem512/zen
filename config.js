var config = {
	// The name of the application
	name: process.env.zenName || 'Zen',

	// The organisation running the application
	organisation: process.env.zenOrganisation || 'Luke Mitchell',
	email: process.env.zenEmail || 'hi@lukemitchell.co',

	// Date locale for moment.js
	locale: process.env.zenLocale || 'en-gb',

	database: {
		// The URI used to connect to your mongo database.
		uri: process.env.zenDatabaseUri || 'zen:password@localhost:27017/zen'
	},

	token: {
		// This is used to encrypt client connections.
		// Change this to something secure.
		secret: process.env.zenTokenSecret || 'super_secure_string_here'
	},

	admin: {
		// The initial admin credentials.
		// These should be changed as soon as possible
		// after installation, via the admin panel or the users settings.
		username: process.env.zenAdminUsername || 'admin',
		password: process.env.zenAdminPassword || 'change_me'
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
	  			href: '/about',
	  			// The link will not be shown to signed-in users
	  			guestOnly: true,
	  			// The link will be shown in the left-hand footer column
	  			footer: {
	  				display: true,
	  				position: 'left'
	  			}
	  		},
	  		// The link text has been changed here from the default,
	  		// which is 'contact'. This link is not displayed.
	  		contact: {
	  			title: 'Contact us',
	  			href: '/contact',
	  			// The link will not be shown in the nav
	  			nav: false,
	  			footer: {
	  				display: true,
	  				position: 'left'
	  			}
	  		},
	  		terms: {
	  			title: 'Terms of Use',
	  			href: '/terms',
	  			nav: false,
	  			footer: {
	  				display: true,
	  				position: 'right'
	  			}
	  		},
	  		cookies: {
	  			title: 'Cookie Policy',
	  			href: '/cookies',
	  			nav: false,
	  			footer: {
	  				display: true,
	  				position: 'right'
	  			}
	  		}
  		}
  	},

  	// Additional links to include in the navigation bar
  	// and/or the website footer.
	links:
	[
  		{
  			title: 'Home',
  			href: '/'
  		},
  		{
  			title: 'Code',
  			href: 'https://github.com/lukem512/zen',
  			popup: true,
  			nav: false,
  			footer: {
  				display: true,
  				position: 'left'
  			}
  		}
  	],

  	// Dictionary of vocabulary.
  	// These can be customised to suit the application.
  	dictionary: {
  		action: {
  			// The action is the most important part to change!
			noun: {
				singular: 'meditation',
				plural: 'meditation'
			},
			verb: {
				present: 'meditate',
				past: 'meditated',
				presentParticiple: 'meditating'
			}
		},
		schedule: {
			noun: {
				singular: 'schedule',
				plural: 'schedules'
			},
			verb: {
				present: 'schedule',
				past: 'scheduled'
			}
		},
		pledge: {
			noun: {
				singular: 'pledge',
				plural: 'pledges'
			},
			verb: {
				present: 'pledge',
				past: 'pledged'
			}
		},
		fulfilment: {
			noun: {
				singular: 'fulfilment',
				plural: 'fulfilments'
			},
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
    		if (page.nav == null)
    			page.nav = true;

    		// Displaying a page in the footer is not default behaviour
    		if (page.footer == null)
    			page.footer = false;

    		// Displaying a page to guests only is not the default behaviour
    		if (page.guestOnly == null)
    			page.guestOnly = false;

    		if (page.nav || page.footer) {
    			pageLinks.push(page);
    		}
    	});
    	return this.links.concat(pageLinks);
    },
};

module.exports = config;
