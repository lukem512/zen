var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var moment = require('moment');
var async = require('async');

var config = require('../config');

var User = require('../models/users');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');

var response = require('./response');
var error = response.error;

var m = require('./middlewares');

// Middleware to require authorisation for all users routes
router.use(m.isLoggedInRedirect);

/* Retreive the user object and render the page */
var userPage = function(req, res, username) {
  username = sanitize(username);
  User.findOne({ username: username }, function(err, user){
    if (err) return error.server(req, res, err);
    if (!user) return error.notfound(req, res);

    // Is requesting user in the same group?
    if (!m._isSameGroupOrAdmin(req.user, user)) {
      return error.prohibited(req, res);
    }

    // Render!
    res.render('users/view', {
      title: user.username,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      _user: user
    });
  })
};

/* GET user page */
router.get('/:username', function(req, res) {
  userPage(req, res, req.params.username);
});

/* GET user page - alias */
router.get('/view/:username', function(req, res) {
  userPage(req, res, req.params.username);
});

module.exports = router;
