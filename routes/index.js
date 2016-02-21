var express = require('express');
var router = express.Router();

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
  	pages: config.pages
  });
});

/* GET authentication page */
router.get('/auth', function(req, res, next) {
  res.render('authenticate', {
  	title: 'Sign in',
  	name: config.name,
  	organisation: config.organisation,
  	pages: config.pages
  });
});

module.exports = router;
