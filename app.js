var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var auth = require('./routes/auth');
var routes = require('./routes/index');
var admin = require('./routes/admin');
var api = require('./routes/api');
var schedules = require('./routes/schedules');

var config = require('./config');

// database connection
var mongoose = require('mongoose');
mongoose.connect(config.database.uri);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connection to database successful.')
});

// Check for installation and run
var install = require('./install');
install();

// app initialisation
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('tokenSecret', config.token.secret);

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(auth);
app.use('/', routes);
app.use('/admin', admin);
app.use('/api', api);

console.log('Setting schedule routes at /' + config.dictionary.schedule.noun);
app.use('/' + config.dictionary.schedule.noun, schedules);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('404', {
    title: 'Not found',
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user
  });
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      title: 'Error',
      message: err.message,
      error: err,
      name: config.name,
      organisation: config.organisation,
      nav: config.nav(),
      user: req.user
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    title: 'Error',
    message: err.message,
    error: {},
    name: config.name,
    organisation: config.organisation,
    nav: config.nav(),
    user: req.user
  });
});

module.exports = app;
