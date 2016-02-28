var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var config = require('../config');

var Schedule = require('../models/schedules');

/* GET list schedules page */
router.get('/', function(req, res, next) {
  res.render('schedules/list', {
    title: 'View ' + config.dictionary.schedule.noun + 's',
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user,
    dictionary: config.dictionary
  });
});


/* GET new schedule page */
router.get('/new', function(req, res, next) {
  res.render('schedules/new', {
      title: 'Create a ' + config.dictionary.schedule.noun,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary
    });
});

/* GET view schedule page */
router.get('/view/:id', function(req, res, next) {
  Schedule.findById(sanitize(req.params.id), function(err, schedule){
    if (err) {
      console.error(err);
      return res.render('500', {
          title: 'Error 500',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          user: req.user
      });
    }
    else if (!schedule) {
      return res.render('404', {
          title: 'Error 404',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          user: req.user
      });
    }
    res.render('schedules/view', {
      title: schedule.title,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      schedule: schedule
    });
  });
});

module.exports = router;
