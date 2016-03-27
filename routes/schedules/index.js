var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var Schedule = require('../../models/schedules');

var response = require('../response');
var error = response.error;

var config = require('../../config');

var m = require('../middlewares');

var moment = require('moment');
moment.locale(config.locale);

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
    dictionary: config.dictionary,
    locale: config.locale
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
      dictionary: config.dictionary,
      locale: config.locale
    });
});

/* GET edit schedule page */
router.get('/edit/:id', function(req, res, next) {
  Schedule.findById(sanitize(req.params.id)).select('+deleted').exec(function(err, schedule){
    if (err) return error.server(req, res, err);
    if (!schedule) return error.notfound(req, res);

    if (schedule.deleted  && !req.user.admin) {
      return error.deleted(req, res);
    }

    // Check the user is the owner, or admin
    if (schedule.owner !== req.user.username && !req.user.admin) {
      return error.prohibited(req, res);
    }

    // Format the schedule date
    var startDate = moment(schedule.start_time);
    var endDate = moment(schedule.end_time);

    // Only past schedules can be edited
    if (startDate.isBefore(moment()) && !req.user.admin) {
      return error.prohibited(req, res);
    }

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
        schedule: schedule,
        locale: config.locale
    });
  });
});

/* GET view schedule page */
router.get('/view/:id', function(req, res, next) {
  Schedule.findById(sanitize(req.params.id)).select('+deleted').exec(function(err, schedule){
    if (err) return error.server(req, res, err);
    if (!schedule) return error.notfound(req, res);

    if (schedule.deleted  && !req.user.admin) {
      return error.deleted(req, res);
    }

    // Check the user is in the same group as the user, or admin
    m._isSameGroupOrAdminDatabase(req.user, schedule.owner, function(err, authorised) {
      if (err) return error.server(req, res, err);

      var diff = moment().diff(moment(schedule.start_time), 'minutes');

      var past = (moment().diff(moment(schedule.end_time)) > 0);
      var soon = (0 < diff && diff < 15);
      var ongoing = (!past && (moment().diff(moment(schedule.start_time)) > 0));

      if (authorised) {
        res.render('schedules/view', {
          title: schedule.title,
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          user: req.user,
          dictionary: config.dictionary,
          schedule: schedule,
          past: past,
          soon: soon,
          ongoing: ongoing,
          locale: config.locale
        });
      }
      else {
        return error.prohibited(req, res);
      }
    });
  });
});

module.exports = router;
