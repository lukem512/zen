var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var moniker = require('moniker');
var bcrypt = require('bcryptjs');

var User = require('../../models/users');
var Schedule = require('../../models/schedules');
var Pledge = require('../../models/pledges');

var response = require('../response');
var m = require('../middlewares');

var config = require('../../config');

/*
 * Users.
 * Users within the system.
*/

router.get('/list', m.isAdmin, function(req, res) {
    User.find(function(err, users){
        if (err) return response.JSON.error.server(res, err);
        res.json(users);
    });
});

router.get('/view/:username', function(req, res) {
    User.find({ username: sanitize(req.params.username) }, function(err, user){
        if (err) return response.JSON.error.server(res, err);
        if (!user) return response.JSON.error.notfound(res);
        res.json(user);
    });
});

router.post('/new', m.isAdmin, function(req, res) {
    var user = new User({
        username: sanitize(req.body.username),
        password: bcrypt.hashSync(sanitize(req.body.userpass)),
        groups: sanitize(req.body['usergroups[]'])
    });
    user.save(function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.post('/update', m.isAdminOrCurrentUser, function(req, res) {
    User.findById(req.body.id, function (err, user) {
        if (err) return response.JSON.error.server(res, err);

        var update = {};

        if (req.body.username) {
            update.username = sanitize(req.body.username);
        }

        if (req.body.userpass) {
            update.password = bcrypt.hashSync(sanitize(req.body.userpass));
        }

        if (req.body['usergroups[]']) {
            update.groups = sanitize(req.body['usergroups[]']);
        }

        if (req.body.admin) {
            update.admin = sanitize(req.body.admin);
        }

        User.findByIdAndUpdate(sanitize(req.body.id), update, function(err, result) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    })
});

router.delete('/update/:username', m.isAdmin, function(req, res) {
    var username = sanitize(req.params.username);
    User.findOne({
        username: username
    }, function(err, user){
        if (err) return response.JSON.error.server(res, err);
        if (!user) return response.JSON.error.notfound(res);

        user.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            
            Schedule.find( { owner: username }, function(err, schedules) {
                if (err) return response.JSON.error.server(res, err);
                schedules.forEach(function(schedule) {
                    deleteSchedule(schedule._id, req.user, function(err, result) {
                        if (err) return console.error(err);
                        if (!result) return console.error('Unable to locate schedule ' + schedule._id);
                    });
                });
            });

            Pledge.find({ username: username }, function(err, results) {
                if (err) return response.JSON.error.server(res, err);
                results.forEach(function(result) {
                    result.delete(function(err) {
                        if (err) return console.error(err);
                    });
                });
            });

            Fulfilment.find({ username: username }, function(err, results) {
                if (err) return response.JSON.error.server(res, err);
                results.forEach(function(result) {
                    result.delete(function(err) {
                        if (err) return console.error(err);
                    });
                });
            });

            response.JSON.ok(res);
        });
    });
});

// Generate user credentials
var randomNumber = function(high, low) {
    return Math.floor(Math.random() * (high - low + 1) + low);
};

var generateUsername = function() {
    var noun = moniker.generator([moniker.noun]);
    return noun.choose() + randomNumber(100, 1);
};

var generatorPassword = function() {
    var noun = moniker.generator([moniker.noun]);
    var adjective = moniker.generator([moniker.adjective]);
    return adjective.choose() + randomNumber(100, 1) + noun.choose() + randomNumber(1000, 1);
};

router.get('/generate', m.isAdmin, function(req, res) {
    return res.json({
        username: generateUsername(),
        password: generatorPassword()
    });
});

/*
 * Export the routes.
*/

module.exports = router;
