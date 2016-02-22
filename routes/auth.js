var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var jwt = require('jsonwebtoken');

var User = require('../models/users');

var config = require('../config');

// Try to authenticate all calls
router.use(function(req, res, next){
  var token = req.cookies.token || req.body.token || req.query.token || req.headers['x-access-token'];
  req.authentication = {};

  if (token) {
    jwt.verify(token, config.token.secret, function(err, decoded) {
      if (err) {
        req.authentication.status = 403;
        req.authentication.message = "Invalid token provided";
        req.authentication.success = false;
      }
      else {
        req.authentication.status = 200;
        req.authentication.message = "Authenticated successfully";
        req.authentication.success = true;
        req.authentication.decoded = decoded;  
      }
      next();
    });
  } else {
    req.authentication.status = 403;
    req.authentication.message = "No token provided";
    req.authentication.success = false;
    next();
  }
});

// Retrieve the user object
// Add this to the request object, or null
router.use(function(req, res, next){
  req.user = null;

  if (req.authentication.success) {
    var username = req.authentication.decoded._doc.username;
    User.findOne({ username: sanitize(username) }, function(err, user){
      if (!err) {
        req.user = user;
      }
      next();
    });
  }
});

module.exports = router;
