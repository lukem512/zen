var express = require('express');
var router = express.Router();

var fs = require('fs');

var config = require('../config');

/* GET home page. */
router.get('/', function(req, res, next) {
  var params = {
    title: 'Activity Feed',
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user,
    dictionary: config.dictionary,
    pages: config.pages
  };

  if (!req.user) {
    params.title = 'Welcome to ' + config.name;
    params.header = {
      content: '<h1>Are you ready to supercharge your ' + config.dictionary.action.noun.singular + ' sessions?</h1>'
    };
  }

  res.render('index', params);
});

/* GET authentication page */
router.get('/auth', function(req, res, next) {
  if (req.user) {
    res.redirect('/');
  }
  else {
    res.render('authenticate', {
    	title: 'Sign in',
    	name: config.name,
    	organisation: config.organisation,
    	nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      pages: config.pages
    });
  }
});

/* GET sign out page */
router.get('/end', function(req, res, next) {
  if (!req.user) {
    res.redirect('/');
  }
  else {
    res.render('end', {
      title: 'Sign out',
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      pages: config.pages
    });
  }
});

/* GET settings page */
router.get('/settings', function(req, res, next) {
  res.render('settings', {
    title: 'Settings',
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user,
    dictionary: config.dictionary,
    pages: config.pages
  });
});

/*
 * User-defined pages
*/

// Recurse fs.readdir()
// https://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search
var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

walk(config.pages.directory, function(err, pages){
  if (err) {
    console.error('Could not create user-defined pages');
    if (err.code == 'ENOENT') {
      console.error('No such directory (' + config.pages.directory + ').')
    } else {
      console.error(err);
    }
    return;
  }
  pages.forEach(function(filename){
    if (filename[0] == '.' || filename.split('/').pop()[0] == '.') return;

    // Clean filename
    filename = filename.replace('.jade', '').replace(config.pages.directory + '/', '');

    // Find the config object, if it exists
    var page = config.pages.views[filename];
    page = {
      href: page.href || '/' + filename,
      title: page.title || filename
    };

    // Create route
    console.log('Creating route ' + filename + ' at ' + page.href);
    
    router.get(page.href, function(req, res){
      res.render('pages/' + filename, {
        title: page.title,
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        email: config.email,
        dictionary: config.dictionary,
        user: req.user,
        pages: config.pages
      });
    });
  });
});

module.exports = router;
