var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var moment = require('moment');

var config = require('../config');

var Schedule = require('../models/schedules');

var response = require('./response');
var error = response.error;

var m = require('./middlewares');

// Middleware to require authorisation for all schedules routes
router.use(m.isLoggedInRedirect);

/* GET list schedules page */
router.get('/', function(req, res, next) {
  res.render('schedules/list', {
    title: 'View ' + config.dictionary.schedule.noun.plural,
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
      title: 'Create a ' + config.dictionary.schedule.noun.singular,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary
    });
});

/* GET edit schedule page */
router.get('/edit/:id', function(req, res, next) {
  Schedule.findById(sanitize(req.params.id), function(err, schedule){
    if (err) return error.server(req, res, err);
    if (!schedule) return error.notfound(req, res);

    // Check the user is the owner, or admin
    if (schedule.owner !== req.user.username && !req.user.admin) {
      return error.invalid(res);
    }

    // Format the schedule date
    var startDate = moment(schedule.start_time);
    var endDate = moment(schedule.end_time);

    res.render('schedules/edit', {
        title: 'Edit a ' + config.dictionary.schedule.noun.singular,
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        user: req.user,
        dictionary: config.dictionary,
        start_date: startDate.format('DD-MM-YYYY'),
        start_time: startDate.format('HH:mm'),
        end_date: endDate.format('DD-MM-YYYY'),
        end_time: endDate.format('HH:mm'),
        schedule: schedule
    });
  });
});

/* GET view schedule page */
router.get('/view/:id', function(req, res, next) {
  Schedule.findById(sanitize(req.params.id), function(err, schedule){
    if (err) return error.server(req, res, err);
    if (!schedule) return error.notfound(req, res);

    // Check the user is in the same group as the user, or admin
    m._isSameGroupOrAdminDatabase(req.user, schedule.owner, function(err, authorised) {
      if (err) return error.server(req, res, err);

      if (authorised) {
        res.render('schedules/view', {
          title: schedule.title,
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          user: req.user,
          dictionary: config.dictionary,
          schedule: schedule,
          past: (moment().diff(moment(schedule.end_time)) > 0)
        });
      }
      else {
        return error.prohibited(req, res);
      }
    });
  });
});

module.exports = router;
