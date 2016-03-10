var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var moment = require('moment');
var async = require('async');

var config = require('../config');

var Fulfilment = require('../models/fulfilments');
var Schedule = require('../models/schedules');

var response = require('./response');
var error = response.error;

// Middleware to require authorisation for all fulfilments routes
router.use(function(req, res, next){
  if (req.authentication.success) {
    next();
  }
  else {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    return res.redirect('/auth?r=' + fullUrl);
  }
});

var getStats = function(fulfilments, schedules) {
  var stats = {
    total: 0,
    weeks: 0,
    scheduled: 0
  };

  // Count filfilled sessions
  fulfilments.forEach(function(f) {
    stats.total += moment.duration(moment(f.end_time).diff(f.start_time));

    var weeks = moment().diff(moment(f.start_time), 'weeks');
    if (weeks > stats.weeks) {
      stats.weeks = weeks;
    }
  });

  // Compute average time per week
  stats.weeklyAverage = (stats.weeks > 0) ? (stats.total / stats.weeks) : stats.total;

  // Count scheduled sessions
  // Only count those in the future!
  schedules.forEach(function(s) {
    if (moment().diff(moment(s.end_time)) < 0)
      stats.scheduled += moment.duration(moment(s.end_time).diff(s.start_time));
  });

  return stats;
}

var getCompletedPledges = function(fulfilments, callback) {
  var pls = [];

  var tasks = [];
  fulfilments.forEach(function(f, i) {
    tasks.push(function(next){
        Fulfilment.completes(f._id, function(err, pledges){
          if (err) return error.server(res, req, err);
          pls[i] = pledges;
          next();
        });
      });
  });

  async.parallel(tasks, function() {
    callback(pls);
  })
}

/* GET list fulfilments page */
router.get('/', function(req, res, next) {
  Fulfilment.find({ username: req.user.username }, function(err, fulfilments) {
    if (err) return error.server(res, req, err);

    Schedule.find({ owner: req.user.username }, function(err, schedules) {
      if (err) return error.server(res, req, err);

      // Find all the pledges that this completes
      getCompletedPledges(fulfilments, function(pledges) {

        // Did the user complete a schedule?
        var schedule = null;
        pledges.forEach(function(p) {
          if (p.username == req.user.username) {
            schedule = p.schedule;
          }
        });

        // Make statistics object
        var statistics = getStats(fulfilments, schedules);

        res.render('fulfilments/list', {
          title: 'View ' + config.dictionary.action.noun.plural,
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          user: req.user,
          dictionary: config.dictionary,
          fulfilments: fulfilments,
          statistics: statistics,
          pledges: pledges
        });
      })
    });
  });
});

/* GET view fulfilment page */
router.get('/view/:id', function(req, res, next) {
  Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
    if (err) return error.server(req, res, err);
    if (!fulfilment) return error.notfound(req, res);
    res.render('fulfilments/view', {
      title: 'View ' + config.dictionary.action.noun.singular,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      fulfilment: fulfilment
    });
  });
});

/* GET edit fulfilment page */
router.get('/edit/:id', function(req, res, next) {
  Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
    if (err) return error.server(req, res, err);
    if (!fulfilment) return error.notfound(req, res);

    var startDate = moment(fulfilment.start_time);
    var endDate = moment(fulfilment.end_time);

    res.render('fulfilments/edit', {
      title: 'Edit ' + config.dictionary.action.noun.singular,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      fulfilment: fulfilment,
      start_date: startDate.format('DD-MM-YYYY'),
      start_time: startDate.format('HH:mm'),
      end_date: endDate.format('DD-MM-YYYY'),
      end_time: endDate.format('HH:mm')
    });
  });
});


/* GET retrospective fulfilment form */
router.get('/log', function(req, res, next) {
  res.render('fulfilments/retrospective', {
    title: 'Log a ' + config.dictionary.action.noun.singular,
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user,
    dictionary: config.dictionary
  });
});

/* GET real-time fulfilment form */
router.get('/now', function(req, res, next) {
  res.render('fulfilments/ongoing', {
    title: 'Log a new ' + config.dictionary.action.noun.singular,
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user,
    dictionary: config.dictionary
  });
});

module.exports = router;
