var User = require('../models/users');

var response = require('./response');

// Middleware helper functions to check user group
module.exports._isSameGroupOrAdmin = function(requestingUser, resultingUser) {
    if (!requestingUser || !resultingUser) return false;
    if (requestingUser.username === resultingUser.username) return true;

    var authorised = requestingUser.admin;
    resultingUser.groups.some(function(g) {
        if (requestingUser.groups.indexOf(g) > -1) {
            authorised = true;
        }
        return authorised;
    });
    return authorised;
};

module.exports._isSameGroupOrAdminDatabase = function(requestingUser, resultingUsername, callback) {
    if (requestingUser.username === resultingUsername || requestingUser.admin) return callback(null, true);

    User.findOne({ username: resultingUsername }, function(err, user) {
        if (err) return callback(err);
        callback(err, module.exports._isSameGroupOrAdmin(requestingUser, user));
    });
};

// Actual middleware functions
module.exports.isLoggedIn = function(req, res, next) {
    if (req.authentication.success) {
        next();
    }
    else {
        return res.status(req.authentication.status).json({
            success: req.authentication.success,
            message: req.authentication.message
        }); 
    }
};

module.exports.isAdmin = function(req, res, next) {
    if (!req.user.admin) {
        return response.JSON.invalid(res);
    }
    else {
        next();
    }
};

module.exports.isCurrentUser = function(req, res, next) {
    var username = req.body.username || req.params.username;
    if (username != req.user.username) {
        return response.JSON.invalid(res);
    }
    else {
        next();
    }
};

module.exports.isAdminOrCurrentUser = function(req, res, next) {
    var username = req.body.username || req.params.username;
    if (username != req.user.username && !req.user.admin) {
        return response.JSON.invalid(res);
    }
    else {
        next();
    }
};

module.exports.isLoggedInRedirect = function(req, res, next){
  if (req.authentication.success) {
    next();
  }
  else {
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    return res.redirect('/auth?r=' + fullUrl);
  }
};
