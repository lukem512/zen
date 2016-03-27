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

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

router.get('/list', m.isAdmin, function(req, res) {
    Pledge.find(function(err, pledges){
        if (err) return response.JSON.error.server(res, err);
        res.json(pledges);
    });
});

router.get('/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) return response.JSON.error.server(res, err);
        if (!pledge) return response.JSON.error.notfound(res);

        m._isSameGroupOrAdminDatabase(req.user, pledge.username, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                res.json(pledge);
            } else {
                return response.JSON.invalid(res);
            }
        });
    });
});

router.post('/new', m.isAdminOrCurrentUser, function(req, res) {
    h.newPledge(sanitize(req.body.username), sanitize(req.body.schedule), req.user, function(err, pledge) {
        if (err) {
            switch (err) {
                case response.strings.notFoundError:
                    return res.status(404).json({ message: config.dictionary.schedule.noun.singular + ' not found' });

                case response.strings.pastScheduleError:
                    return res.status(403).json({ message: response.strings.pastScheduleError });

                default:
                    return response.JSON.error.server(res, err);
            }
        }
        response.JSON.ok(res);
    });
});

var deletePledge = function(req, res, pledge) {
    // Check for Admin, or current User
    if (pledge.username != req.user.username && !req.user.admin) {
        return res.status(403).json({message: response.strings.notAuthorisedError});
    }

    // Can't delete a pledge for a past schedule
    _sh.schedulePastDatabase(pledge.schedule, function(err, past) {
        if (err) {
            switch (err) {
                case response.strings.notFoundError:
                    return res.status(404).json({ message: config.dictionary.schedule.noun.singular + ' not found' });

                case response.strings.pastScheduleError:
                    return res.status(403).json({ message: response.strings.pastScheduleError });

                default:
                    return response.JSON.error.server(res, err);
            }
        }

        // Only let an admin do that!
        if (past && !req.user.admin) {
            return res.status(403).json({ message: response.strings.pastScheduleError });
        }

        pledge.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
};

router.delete('/update/:id', m.isAdminOrCurrentUser, function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge) {
        if (err) return response.JSON.error.server(res, err);
        if (!pledge) return esponse.JSON.error.notfound(res);
        deletePledge(req, res, pledge);
    });
});

router.delete('/update/schedule/:schedule/username/:username', function(req, res) {
    Pledge.findOne({
        schedule: sanitize(req.params.schedule),
        username: sanitize(req.params.username)
    }, function(err, pledge) {
        if (err) return response.JSON.error.server(res, err);
        if (!pledge) return response.JSON.error.notfound(res);
        deletePledge(req, res, pledge);
    });
});

// Return the users that have pledged to attend a given schedule
router.get('/users/:schedule', function(req, res) {
    var schedule = sanitize(req.params.schedule);

    // Ensure the schedule owner and the requesting user are in the same group
    Schedule.findOne({ _id: schedule }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        if (!result) return response.JSON.error.notfound(res);

        m._isSameGroupOrAdminDatabase(req.user, result.owner, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                Pledge.find({
                    schedule: schedule
                }, function(err, pledges){
                    if (err) return response.JSON.error.server(res, err);

                    res.json(pledges.map(function(p){ return p.username; }));
                });
            } else {
                return response.JSON.invalid(res);
            }
        });
    });
});

// Return the active schedules that the user has pledged to.
// The schedule can be active now or starting soon.
router.get('/username/:username/now', function(req, res) {
    var username = sanitize(req.params.username);

    m._isSameGroupOrAdminDatabase(req.user, username, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);
        
        if (authorised) {
            Pledge.find({
                username: username
            }, function(err, pledges) {
                if (err) return response.JSON.error.server(res, err);

                // Use now as the start date,
                // and 15 minutes in the future as the end date.
                var now = new Date();
                var soon = new Date(now.getTime() + 15*60000);

                Schedule.overlaps(now, soon, function(err, schedules) {
                    if (err) return response.JSON.error.server(res, err);

                    var results = []
                    schedules.forEach(function(s) {
                        pledges.forEach(function(p) {
                            if (p.schedule == s._id) {
                                results.push(s);
                            }
                        });
                    });

                    return res.json(results);
                })
            });
        } else {
            return response.JSON.invalid(res);
        }
    });
});

/*
 * Export the routes.
*/

module.exports = router;
