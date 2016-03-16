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

var middlewares = require('./middlewares');

// Middleware to require authorisation for all fulfilments routes
router.use(middlewares.isLoggedInRedirect);

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

  async.series(tasks, function() {
    callback(pls);
  })
};

// Retrieves any schedule objects completed by a fulfilment
// for a given user
var getSchedules = function(fulfilment, username, callback) {
  Fulfilment.completes(fulfilment._id, function(err, pledges) {
    if (err) return error.server(req, res, err);
    
    var userSchedules = [];
    pledges.forEach(function(p) {
      if (p.username == username) {
        userSchedules.push(p.schedule);
      }
    });

    Schedule.find({
      _id: {
        $in: userSchedules
      }
    }, callback);
  });
};

var listFulfilments = function(req, res, start, n) {
  // Start at page 1 by default
  if (start)
    start = Math.max(start, 1);
  else
    start = 1;

  // Display 20 by default
  n = n || 20;
  n = 10;

  Fulfilment.find({ username: req.user.username }).sort({ createdAt: 'desc' })
    .skip((start - 1) * n).limit(n).exec(function(err, fulfilments) {
    if (err) return error.server(res, req, err);

    Schedule.find({ owner: req.user.username }, function(err, schedules) {
      if (err) return error.server(res, req, err);

      // Make statistics object
      var statistics = getStats(fulfilments, schedules);

      // Find all the pledges that this completes
      getCompletedPledges(fulfilments, function(pledges) {

        // Clean pledges object
        var schedules = [];

        pledges.forEach(function(arr, i) {
          for (j = arr.length - 1; j >= 0; j -= 1) {
            if (arr[j].username == req.user.username) {
              // Save the schedule details
              schedules[i] = {
                id: arr[j].schedule,
                title: arr[j].scheduleTitle,
                completion: arr[j].completion
              };

              // But remove the pledge from the array
              arr.splice(j, 1);
            }
          }
        });

        Fulfilment.count({ username: req.user.username }).exec(function(err, count) {
          if (err) return error.server(res, req, err);

          res.render('fulfilments/list', {
            title: 'View ' + config.dictionary.action.noun.plural,
            name: config.name,
            organisation: config.organisation,
            nav: config.nav(),
            user: req.user,
            dictionary: config.dictionary,
            fulfilments: fulfilments,
            statistics: statistics,
            pledges: pledges,
            schedules: schedules,
            page: start,
            pages: Math.ceil(count / n)
          });
        })
      })
    });
  });
};

/* GET list fulfilments page */
router.get('/', function(req, res) {
  listFulfilments(req, res);
});

router.get('/list', function(req, res) {
  listFulfilments(req, res);
});

router.get('/list/:start', function(req, res) {
  var start = sanitize(req.params.start);
  listFulfilments(req, res, start);
});

/* GET view fulfilment page */
router.get('/view/:id', function(req, res, next) {
  Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
    if (err) return error.server(req, res, err);
    if (!fulfilment) return error.notfound(req, res);

    // TODO - Check the user is in the same group as the owner, or admin

    getSchedules(fulfilment, req.user.username, function(err, schedules) {
      if (err) return error.server(req, res, err);

      res.render('fulfilments/view', {
        title: 'View ' + config.dictionary.action.noun.singular,
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        user: req.user,
        dictionary: config.dictionary,
        fulfilment: fulfilment,
        schedules: schedules
      });
    });
  });
});

/* GET edit fulfilment page */
router.get('/edit/:id', function(req, res, next) {
  Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
    if (err) return error.server(req, res, err);
    if (!fulfilment) return error.notfound(req, res);

    // Check the user is the owner, or admin
    if (fulfilment.username !== req.user.username && !req.user.admin) {
      return error.invalid(res);
    }

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
