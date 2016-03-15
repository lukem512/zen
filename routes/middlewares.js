
var response = require('./response');

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
    if (req.body.username != req.user.username) {
        return response.JSON.invalid(res);
    }
    else {
        next();
    }
};

module.exports.isAdminOrCurrentUser = function(req, res, next) {
    if (req.body.owner != req.user.username && !req.user.admin) {
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
