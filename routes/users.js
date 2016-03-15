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

var middlewares = require('./middlewares');

// Middleware to require authorisation for all users routes
router.use(middlewares.isLoggedInRedirect);

/* Retreive the user object and render the page */
var userPage = function(req, res, username) {
  username = sanitize(username);
  User.findOne({ username: username }, function(err, user){
    if (err) return error.server(req, res, err);
    if (!user) return error.notfound(req, res);

    Pledge.find({ username: username }, function(err, pledges) {
      if (err) return error.server(req, res, err);

      var pledged = [];

      // Find Schedule names
      async.eachSeries(pledges, function(pledge, next){
        Schedule.findById(pledge.schedule, function(err, schedule) {
          if (err) return error.server(req, res, err);

          if (!schedule) {
            console.warn('Found a pledge with schedule ID of ' + pledge.schedule + ' and no matching schedule! (' + pledge._id + ')');
            return next();
          }

          console.log(schedule.title);
          pledged.push({
              schedule: schedule._id,
              title: schedule.title
            });
          return next();
        });
      }, function done() {

        // Render!
        Schedule.find({ owner: username }, function(err, schedules) {
          if (err) return error.server(req, res, err);

          // Render!
          res.render('users/view', {
            title: user.username,
            name: config.name,
            organisation: config.organisation,
            nav: config.nav(),
            user: req.user,
            dictionary: config.dictionary,
            _user: user,
            _pledges: pledged,
            _schedules: schedules
          });
        })
      });
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
