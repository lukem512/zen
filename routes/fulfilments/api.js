var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var User = require('../../models/users');
var Group = require('../../models/groups');
var Schedule = require('../../models/schedules');
var Pledge = require('../../models/pledges');
var Fulfilment = require('../../models/fulfilments');

var config = require('../../config');

var response = require('../response');
var m = require('../middlewares');

var h = require('./helpers');
var _sh = require('../schedules/helpers');

var moment = require('moment');
moment.locale(config.locale);

/*
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

/* GET fulfilment listing page. */
router.get('/list', m.isAdmin, function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) return response.JSON.error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment listing page for specified user */
router.get('/list/:username', m.isAdminOrCurrentUser, function(req, res) {
    Fulfilment.find({ username: sanitize(req.params.username) }, function(err, fulfilments){
        if (err) return response.JSON.error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment information */
router.get('/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);

        // Check for current user or admin
        if (fulfilment.username != req.user.username && !req.user.admin) {
            return res.status(403).json({message: notAuthorisedError});
        }

        res.json(fulfilment);
    });
});

router.post('/new', m.isAdminOrCurrentUser, function(req, res) {
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    });

    if (!_sh.timesValid(fulfilment.start_time, fulfilment.end_time)) {
        return response.JSON.invalid(res);
    }

    if (h.fulfilmentFuture(fulfilment)) {
        return response.JSON.invalid(res);
    }

    fulfilment.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.post('/update', m.isAdminOrCurrentUser, function(req, res) {
    Fulfilment.findById(sanitize(req.body.id), function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);
        
        // A fulfilment should only be modifiable for a small amount of time
        // after creating it
        if (!h.recentFulfilment(fulfilment)) {
            return response.JSON.invalid(res);
        }

        if (!_sh.timesValid(fulfilment.start_time, fulfilment.end_time)) {
            return response.JSON.invalid(res);
        }

        if (h.fulfilmentFuture(fulfilment)) {
            return response.JSON.invalid(res);
        }

        fulfilment.update({
            username: sanitize(req.body.username),
            start_time: new Date(req.body.start_time),
            end_time: new Date(req.body.end_time)
        }, function(err, result) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

/* DELETE to fulfilment update service */
router.delete('/update/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);

        // Check for current user or admin
        if (fulfilment.username != req.user.username && !req.user.admin) {
            return res.status(403).json({message: notAuthorisedError});
        }

        // A fulfilment should only be modifiable for a small amount of time
        // after creating it
        if (!h.recentFulfilment(fulfilment)) {
            return response.JSON.invalid(res);
        }

        if (!_sh.timesValid(fulfilment.start_time, fulfilment.end_time)) {
            return response.JSON.invalid(res);
        }

        if (h.fulfilmentFuture(fulfilment)) {
            return response.JSON.invalid(res);
        }

        fulfilment.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

// TODO - restrict to those pledges in the group of the requesting user
function _completes(req, res, callback) {
    Fulfilment.completes(sanitize(req.params.id), function(err, pledges){
       if (err) return response.JSON.error.server(res, err);
        if (!pledges) return response.JSON.error.notfound(res);
        callback(pledges);
    });
}

// Pledges completed by fulfilment
router.get('/view/:id/completes', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges);
    });
});

// Pledges of specified completion status by fulfilment
router.get('/view/:id/completes/:status', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges.filter(function(p){
            return p.completion == req.params.status;
        }));
    });
});

router.post('/ongoing/begin', m.isAdminOrCurrentUser, function(req, res) {
    // Each user can only have one ongoing fulfilment!
    Fulfilment.findOne({
        username: sanitize(req.body.username),
        ongoing: true
    }, function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);

        // 15 minutes
        var threshold = 15 * 60 * 1000;

        // Is there an ongoing fulfilment?
        // Either finish it or continue it.
        if (fulfilment) {
            var delta = (new Date() - fulfilment.start_time);
            if (delta < threshold) {
                return res.json({
                    message: 'Resuming recent ' + config.dictionary.schedule.noun.singular,
                    time: delta
                });
            } else {
                fulfilment.ongoing = false;
                fulfilment.save();
            }
        }

        // Initially, set the fulfilment to 10s
        var start_date = new Date();
        var initial_time = 10; // seconds
        var end_date = new Date();
        end_date.setSeconds(start_date.getSeconds() + initial_time);

        var newf = new Fulfilment({
            username: sanitize(req.body.username),
            start_time: start_date,
            end_time: end_date,
            ongoing: true,
            real_time: true
        });
        newf.save(function(err, doc) {
            if (err) return response.JSON.error.server(res, err);
            return res.json({
                message: 'OK',
                time: 0
            });
        });
    })
});

router.post('/ongoing/alive', m.isAdminOrCurrentUser, function(req, res) {
    // Update the ongoing fulfilment with the current time
    Fulfilment.findOneAndUpdate({
        username: sanitize(req.body.username),
        ongoing: true
    }, {
        end_time: new Date()
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        if (!result) {
            return res.json({
                message: 'No ongoing ' + config.dictionary.fulfilment.noun.singular
            }); 
        }
        else {
            return res.json({
                message: 'OK',
                time: (result.end_time - result.start_time)
            });
        }
    });
});

router.post('/ongoing/end', m.isAdminOrCurrentUser, function(req, res) {
    // Update the user's ongoing fulfilment with the final time
    // and remove the ongoing flag
    Fulfilment.findOneAndUpdate({
        username: sanitize(req.body.username),
        ongoing: true
    }, {
        end_time: new Date(),
        ongoing: false
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        if (!result) {
            return res.json({
                message: 'No ongoing ' + config.dictionary.fulfilment.noun.singular
            }); 
        }
        return res.json({
            message: 'OK',
            time: (result.end_time - result.start_time)
        });
    });
});

router.get('/ongoing/:username', m.isAdminOrCurrentUser, function(req, res) {
    // Find an ongoing fulfilment from the user
    Fulfilment.findOne({
        username: sanitize(req.params.username),
        ongoing: true
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);

        if (!result) return res.json({
            message: 'No ongoing ' + config.dictionary.fulfilment.noun.singular
        });

        return res.json({
            message: 'OK',
            time: (result.end_time - result.start_time)
        });
    });
});

router.delete('/ongoing/:username', m.isAdminOrCurrentUser, function(req, res) {
    // Remove an ongoing fulfilment from the user
    Fulfilment.findOne({
        username: sanitize(req.params.username),
        ongoing: true
    }, function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);

        fulfilment.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

// Return the users that have fulfilled a pledge to attend a given schedule
router.get('/ongoing/users/:schedule', function(req, res) {
    var id = sanitize(req.params.schedule);
    _sh.getSchedulePledgersOnline(id, req.user, function(err, users) {
        if (err) {
            switch (err) {
                case notFoundError:
                    return response.JSON.error.notfound(res);

                case notAuthorisedError:
                    return response.JSON.error.prohibited(res);

                default:
                    return response.JSON.error.server(res, err);
            }
        }
        res.json(users);
    });
});

// Return the users that have fulfilled a pledge to attend a given schedule
router.get('/users/:schedule', function(req, res) {
    var id = sanitize(req.params.schedule);
    _sh.getScheduleFulfilments(id, req.user, function(err, fulfilments) {
        if (err) {
            switch (err) {
                case notFoundError:
                    return response.JSON.error.notfound(res);

                case notAuthorisedError:
                    return response.JSON.error.prohibited(res);

                default:
                    return response.JSON.error.server(res, err);
            }
        }
        res.json(fulfilments);
    });
});

/*
 * Export the routes.
*/

module.exports = router;
