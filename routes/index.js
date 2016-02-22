var express = require('express');
var router = express.Router();

var fs = require('fs');

var config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
  	title: 'Welcome to ' + config.name,
  	header: {
  		content: '<h1>Roll up, roll up!</h1>'
  	},
  	name: config.name,
  	organisation: config.organisation,
  	nav: config.nav()
  });
});

/* GET authentication page */
router.get('/auth', function(req, res, next) {
  res.render('authenticate', {
  	title: 'Sign in',
  	name: config.name,
  	organisation: config.organisation,
  	nav: config.nav()
  });
});

/*
 * User-defined pages
*/

fs.readdir(config.pages.directory, function(err, pages){
  if (err) {
    console.error('Could not create user-defined pages');
    if (err.code == 'ENOENT') {
      console.error('No such directory (' + config.pages.directory + ').')
    } else {
      console.error(err);
    }
    return;
  }
  pages.forEach(function(page){
    if (page == '.' || page == '.') return;

    // Clean filename
    page = page.replace('.jade', '');

    // Find URL slug
    var href = config.pages.views[page].href || '/' + page;

    // Find title
    var title = config.pages.views[page].title || page;

    // Create route
    console.log('Creating route ' + title + ' at ' + href);
    router.get(href, function(req, res, next){
      res.render('pages/' + page, {
        title: title,
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        email: config.email,
        dictionary: config.dictionary
      });
    });
  });
});

module.exports = router;
