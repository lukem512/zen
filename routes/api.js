var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var User = require('../models/users');

var config = require('../config');

var response = require('./response');
var m = require('./middlewares');

/*
 * Authentication functions.
*/

router.post('/authenticate', function(req, res){
    User.findOne({
        username: sanitize(req.body.username)
    }, function (err, user){
        if (err) return response.JSON.error.server(res, err);

        if (!user) {
            res.status(403).json({
                success: false,
                message: 'We couldn\'t find an account with that username.'
            });
        }
        else {
            if (!bcrypt.compareSync(req.body.password, user.password)) {
                res.status(403).json({
                    success: false,
                    message: 'The password you entered is incorrect.'
                });
            }
            else {
                var token = jwt.sign(user, config.token.secret, {
                    algorithm: 'HS256',
                    expiresIn: 60*60*24
                });
                res.cookie('token', token, { expires: new Date(Date.now() + (24*60*60*1000)), httpOnly: true });
                res.json({
                    success: true,
                    message: 'Signed in successfully!',
                    token: token
                });
            }
        }
    });
});

router.post('/end', function(req, res){
    res.clearCookie('token');
    response.JSON.ok(res);
});

/*
 * Middleware for all other API routes.
 * Require users to be authenticated.
*/
router.use(m.isLoggedIn);

/*
 * Users.
 * Users within the system.
*/

var users = require('./users/api');
router.use('/users', users);

/*
 * Groups
 * Users belong to one or more groups.
*/

var groups = require('./groups/api');
router.use('/groups', groups);

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

var schedules = require('./schedules/api');
router.use('/schedules', schedules);

/*
 * Calendar
 * Return the schedules in the format expected by fullcalendar.io
*/

var calendar = require('./schedules/calendar');
router.use('/calendar', calendar);

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

var pledges = require('./pledges/api');
router.use('/pledges', pledges);

/*
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

var fulfilments = require('./fulfilments/api');
router.use('/fulfilments', fulfilments);

/*
 * Feed routes
*/

var feed = require('./feed/api');
router.use('/feed', feed);

/*
 * Add a JSON 404 route
*/

router.use(function(req, res, next) {
  response.JSON.error.notfound(res);
});

/*
 * Export the routes.
*/

module.exports = router;
