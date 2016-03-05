var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var moment = require('moment');

var config = require('../config');

var Fulfilment = require('../models/fulfilments');

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

/* GET list fulfilments page */
router.get('/', function(req, res, next) {
  Fulfilment.find({ username: sanitize(req.user.username) }, function(err, fulfilments) {
    if (err) return error.server(res, req, err);
    res.render('fulfilments/list', {
      title: config.dictionary.action.noun.plural,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user,
      dictionary: config.dictionary,
      fulfilments: fulfilments,
      statistics: {
        total: '10 hours',
        weeklyAverage: '2.5 hours',
        scheduled: '1.5 hours'
      }
    });
  });
});

/* GET view fulfilment page */
router.get('/view/:id', function(req, res, next) {
  Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
    if (err) return error.server(req, res, err);
    if (!fulfilment) return error.notfound(req, res);
    res.render('fulfilments/view', {
      title: config.dictionary.fulfilment.noun.singular,
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
      title: config.dictionary.fulfilment.noun.singular,
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
    title: 'Log ' + config.dictionary.action.noun.singular,
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user,
    dictionary: config.dictionary
  });
});

module.exports = router;
