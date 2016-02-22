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
  	nav: config.nav(),
    user: req.user
  });
});

/* GET authentication page */
router.get('/auth', function(req, res, next) {
  res.render('authenticate', {
  	title: 'Sign in',
  	name: config.name,
  	organisation: config.organisation,
  	nav: config.nav(),
    user: req.user
  });
});

/* GET sign out page */
router.get('/end', function(req, res, next) {
  res.render('end', {
    title: 'Sign out',
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user
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
    
    router.get(href, function(req, res){
      res.render('pages/' + page, {
        title: title,
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        email: config.email,
        dictionary: config.dictionary,
        user: req.user
      });
    });
  });
});

module.exports = router;
