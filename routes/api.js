var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var moniker = require('moniker');
var async = require('async');

var User = require('../models/users');
var Group = require('../models/groups');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');
var Fulfilment = require('../models/fulfilments');

var m = require('./middlewares');
var response = require('./response');

var fulfilmentHelpers = require('./fulfilments/helpers');

var config = require('../config');

var pastScheduleError = 'Cannot delete past schedules';
var notAuthorisedError = 'Not authorised';
var notFoundError = 'Not found';

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
                res.json({
                    success: true,
                    message: 'Signed in successfully!',
                    token: token
                });
            }
        }
    });
});

// Middleware to require authorisation for all API routes
router.use(m.isLoggedIn);

/*
 * Users.
 * Users within the system.
*/

router.get('/users/list', m.isAdmin, function(req, res) {
    User.find(function(err, users){
        if (err) return response.JSON.error.server(res, err);
        res.json(users);
    });
});

router.get('/users/view/:username', function(req, res) {
    User.find({ username: sanitize(req.params.username) }, function(err, user){
        if (err) return response.JSON.error.server(res, err);
        if (!user) return response.JSON.error.notfound(res);
        res.json(user);
    });
});

router.post('/users/new', m.isAdmin, function(req, res) {
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

router.post('/users/update', m.isAdminOrCurrentUser, function(req, res) {
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

router.delete('/users/update/:username', m.isAdmin, function(req, res) {
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

router.get('/users/generate', m.isAdmin, function(req, res) {
    return res.json({
        username: generateUsername(),
        password: generatorPassword()
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

router.get('/groups/list', m.isAdmin, function(req, res) {
    Group.find(function(err, groups){
        if (err) return response.JSON.error.server(res, err);
        res.json(groups);
    });
});

router.get('/groups/view/:name', m.isAdmin, function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) return response.JSON.error.server(res, err);
        if (!group) return response.JSON.error.notfound(res);
        res.json(group);
    });
});

router.get('/groups/view/:name/members', m.isAdmin, function(req, res) {
    Group.members(sanitize(req.params.name), function(err, users){
        if (err) return response.JSON.error.server(res, err);
        res.json(users);
    });
});

router.post('/groups/new', m.isAdmin, function(req, res) {
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.post('/groups/update', m.isAdmin, function(req, res) {
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.delete('/groups/update/:name', m.isAdmin, function(req, res) {
    var name = sanitize(req.params.name);

    // Remove the group!
    Group.findOne({
        name: name
    }, function(err, group) {
        if (err) return response.JSON.error.server(res, err);
        if (!group) return response.JSON.error.notfound(res);

        group.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);

            // Remove the group from all member documents
            User.update({ groups: name }, { $pullAll: { groups: [name] } }, function(err, users) {
                if (err) return console.error(err);
            });

            // Send back response
            response.JSON.ok(res);
        })
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

router.get('/schedules/list', m.isAdmin, function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) return response.JSON.error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/list/owner/:username', function(req, res) {
    var username = sanitize(req.params.username);

    m._isSameGroupOrAdmin(req.user, user, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);
        
        if (authorised) {
            Schedule.find({ owner: username }, function(err, schedules){
                if (err) return response.JSON.error.server(res, err);
                res.json(schedules);
            });
        } else {
            return response.JSON.invalid(res);
        }
    });
});

router.get('/schedules/list/group/:group', function(req, res) {
    var group = sanitize(req.params.group);

    // Is the requesting user a member of the specified group?
    if (req.user.groups.indexOf(group) || req.user.admin) {
        Schedule.group(group, function(err, schedules){
            if (err) return response.JSON.error.server(res, err);
            res.json(schedules);
        });
    } else {
        return response.JSON.invalid(res);
    }
});

router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id)).select('+deleted').exec(function(err, schedule){
        if (err) return response.JSON.error.server(res, err);
        if (!schedule) return response.JSON.error.notfound(res);

        m._isSameGroupOrAdminDatabase(req.user, schedule.owner, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                res.json(schedule);
            } else {
                return response.JSON.invalid(res);
            }
        });
    });
});

// Are the times valid?
var timesValid = function(start_time, end_time) {
    return (moment(start_time).diff(end_time) < 0);
};

var timePast = function(time) {
    return (moment().diff(time) > 0);
};

// Is the schedule in the past?
var schedulePast = function(schedule) {
    return timePast(schedule.end_time);
};

var schedulePastDatabase = function(scheduleId, callback) {
    Schedule.findById(scheduleId, function(err, schedule) {
        if (err) callback(err);
        if (!schedule) callback(err, notFoundError);
        callback(err, schedulePast(schedule));
    });
};

router.post('/schedules/new', m.isAdminOrCurrentUser, function(req, res) {
    var username = sanitize(req.body.username);

    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: username
    });

    if (schedulePast(schedule) && !requestingUser.admin) {
        return response.JSON.invalid(res);
    }

    if (!timesValid(schedule.start_time, schedule.end_time)) {
        return response.JSON.invalid(res);
    }

    schedule.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);

        newPledge(username, doc._id, req.user, function(err, doc) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

router.post('/schedules/update', m.isAdminOrCurrentUser, function(req, res) {
    Schedule.findById(sanitize(req.body.id), function(err, schedule) {
        if (err) return response.JSON.error.server(res, err);

        // Check the schedule isn't in the past
        if (schedulePast(schedule) && !req.user.admin) {
            return response.JSON.invalid(res);
        }

        var obj = {
            title: sanitize(req.body.title),
            description: sanitize(req.body.description),
            start_time: new Date(req.body.start_time),
            end_time: new Date(req.body.end_time)
        };

        if (!timesValid(obj.start_time, obj.end_time)) {
            return response.JSON.invalid(res);
        }

        var owner = sanitize(req.body.owner);
        if (owner) {
            obj.owner = owner;
        }

        schedule.update(obj, function(err, result) {
            if (err) return response.JSON.error.server(res, err);
            if (!result) return response.JSON.error.notfound(res);
            response.JSON.ok(res);
        });
    });
});

var deleteSchedule = function(id, requestingUser, callback) {
    Schedule.findById(id, function(err, schedule) {
        if (err || !schedule) return callback(err);

        // Check for Admin, or current User
        if (schedule.owner != requestingUser.username && !requestingUser.admin) {
            return callback(notAuthorisedError);
        }

        // Check the schedule isn't in the past
        if (schedulePast(schedule) && !requestingUser.admin) {
            return callback(pastScheduleError);
        }

        schedule.delete(function(err) {
            if (err) return callback(err);

            // Remove all pledges associated with this schedule
            Pledge.find({schedule: id}, function(err, pledges) {
                pledges.forEach(function(pledge) {
                    pledge.delete(function(err) {
                        if (err) console.error(err);
                    });
                });
            });

            callback(err, schedule);
        });
    });
};

router.delete('/schedules/update/:id', function(req, res) {
    deleteSchedule(sanitize(req.params.id), req.user, function(err, result) {
        if (err) {
            switch (err) {
                case pastScheduleError:
                    return response.JSON.invalid(res);

                case notAuthorisedError:
                    res.status(403).json({message: notAuthorisedError});

                default:
                    return response.JSON.error.server(res, err);
            }
        }
        if (!result) return response.JSON.error.notfound(res);
        response.JSON.ok(res);
    });
});

// Fast, unique function
// Thanks to http://stackoverflow.com/a/9229821
function uniqFast(a) {
    var seen = {};
    var out = [];
    var len = a.length;
    var j = 0;
    for(var i = 0; i < len; i++) {
         var item = a[i];
         if(seen[item] !== 1) {
               seen[item] = 1;
               out[j++] = item;
         }
    }
    return out;
};

var getScheduleClass = function(schedule, requestingUser, callback) {
    Pledge.findOne({
        schedule: schedule._id, 
        username: requestingUser.username
    }, function(err, pledge) {
        if (err) return callback(err);

        // Pledged schedules are green, others are read
        callback(err, (pledge ? 'bg-success' : 'bg-danger'));
    });
};

var makeCalendarFormat = function(results, requestingUser, callback) {
    var formatted = [];

    async.each(results, function(s, next) {
        getScheduleClass(s, requestingUser, function(err, scheduleClass) {
            if (err) return next(err);

            formatted.push ({
                title: s.title,
                description: s.description,
                start: moment(s.start_time).format(),
                end: moment(s.end_time).format(),
                owner: s.owner,
                url: '/' + config.dictionary.schedule.noun.plural + '/view/' + s._id,
                className: scheduleClass
            });
            next();
        });
    }, function(err) {
        callback(err, formatted)
    });
};

// retrieve events for populating the schedules calendar
router.get('/calendar', function(req, res) {

    // Admin or not?
    if (req.user.admin) {

        // Retrieve all schedules
        Schedule.find({}, function(err, schedules) {
            if (err) return response.JSON.error.server(res, err); 
            makeCalendarFormat(schedules, req.user, function(err, format) {
                if (err) return response.JSON.error.server(res, err); 
                res.json(format);
            });
        });
    } else {     

        async.parallel([
            // Find schedules owner by requesting user
            function(next) {
                Schedule.find({ owner: req.user.username }).exec(next);
            },

            // Find schedules in the groups of the requesting user
            function(next) {
                req.user.groups = req.user.groups || [];
                Schedule.groups(req.user.groups, next);
            }
        ], function(err, results) {
            if (err) return response.JSON.error.server(res, err); 

            // Clean results
            var r = results[0];
            for (var i = 1; i < results.length; i++)
                r = r.concat(results[i]);
            results = uniqFast(r);

            // Map them into the appropriate format
            makeCalendarFormat(results, req.user, function(err, format) {
                if (err) return response.JSON.error.server(res, err); 
                res.json(format);
            });
        });
    }
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

router.get('/pledges/list', m.isAdmin, function(req, res) {
    Pledge.find(function(err, pledges){
        if (err) return response.JSON.error.server(res, err);
        res.json(pledges);
    });
});

router.get('/pledges/view/:id', function(req, res) {
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

// Create a new pledge
var newPledge = function(username, schedule, requestingUser, callback) {
    // Create Pledge object
    var pledgeObj = {
        username: username,
        schedule: schedule
    };

    // Can't pledge to a past schedule
    schedulePastDatabase(schedule, function(err, past) {
        if (err) return callback(err);

        // Only let an admin do that!
        if (past && !requestingUser.admin) {
            return callback(pastScheduleError);
        }

        // Add a new pledge, if one does not already exist
        Pledge.findOne(pledgeObj, function(err, existing) {
            if (err) return callback(err, existing);
            var pledge = new Pledge(pledgeObj);
            pledge.save(callback);
        });
    })
};

router.post('/pledges/new', m.isAdminOrCurrentUser, function(req, res) {
    newPledge(sanitize(req.body.username), sanitize(req.body.schedule), req.user, function(err, pledge) {
        if (err) {
            switch (err) {
                case notFoundError:
                    return res.status(404).json({ message: config.dictionary.schedule.noun.singular + ' not found' });

                case pastScheduleError:
                    return res.status(403).json({ message: pastScheduleError });

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
        return res.status(403).json({message: notAuthorisedError});
    }

    // Can't delete a pledge for a past schedule
    schedulePastDatabase(pledge.schedule, function(err, past) {
        if (err) {
            switch (err) {
                case notFoundError:
                    return res.status(404).json({ message: config.dictionary.schedule.noun.singular + ' not found' });

                case pastScheduleError:
                    return res.status(403).json({ message: pastScheduleError });

                default:
                    return response.JSON.error.server(res, err);
            }
        }

        // Only let an admin do that!
        if (past && !req.user.admin) {
            return res.status(403).json({ message: pastScheduleError });
        }

        pledge.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
};

router.delete('/pledges/update/:id', m.isAdminOrCurrentUser, function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge) {
        if (err) return response.JSON.error.server(res, err);
        if (!pledge) return esponse.JSON.error.notfound(res);
        deletePledge(req, res, pledge);
    });
});

router.delete('/pledges/update/schedule/:schedule/username/:username', function(req, res) {
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
router.get('/pledges/users/:schedule', function(req, res) {
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
router.get('/pledges/username/:username/now', function(req, res) {
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
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

var fulfilmentFuture = function(fulfilment) {
    return (!timePast(fulfilment.start_time));
};

/* GET fulfilment listing page. */
router.get('/fulfilments/list', m.isAdmin, function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) return response.JSON.error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment listing page for specified user */
router.get('/fulfilments/list/:username', m.isAdminOrCurrentUser, function(req, res) {
    Fulfilment.find({ username: sanitize(req.params.username) }, function(err, fulfilments){
        if (err) return response.JSON.error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
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

router.post('/fulfilments/new', m.isAdminOrCurrentUser, function(req, res) {
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    });

    if (!timesValid(fulfilment.start_time, fulfilment.end_time)) {
        return response.JSON.invalid(res);
    }

    if (fulfilmentFuture(fulfilment)) {
        return response.JSON.invalid(res);
    }

    fulfilment.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.post('/fulfilments/update', m.isAdminOrCurrentUser, function(req, res) {
    Fulfilment.findById(sanitize(req.body.id), function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);
        
        // A fulfilment should only be modifiable for a small amount of time
        // after creating it
        if (!fulfilmentHelpers.recentFulfilment(fulfilment)) {
            return response.JSON.invalid(res);
        }

        if (!timesValid(fulfilment.start_time, fulfilment.end_time)) {
            return response.JSON.invalid(res);
        }

        if (fulfilmentFuture(fulfilment)) {
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
router.delete('/fulfilments/update/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);

        // Check for current user or admin
        if (fulfilment.username != req.user.username && !req.user.admin) {
            return res.status(403).json({message: notAuthorisedError});
        }

        // A fulfilment should only be modifiable for a small amount of time
        // after creating it
        if (!fulfilmentHelpers.recentFulfilment(fulfilment)) {
            return response.JSON.invalid(res);
        }

        if (!timesValid(fulfilment.start_time, fulfilment.end_time)) {
            return response.JSON.invalid(res);
        }

        if (fulfilmentFuture(fulfilment)) {
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
router.get('/fulfilments/view/:id/completes', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges);
    });
});

// Pledges of specified completion status by fulfilment
router.get('/fulfilments/view/:id/completes/:status', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges.filter(function(p){
            return p.completion == req.params.status;
        }));
    });
});

router.post('/fulfilments/ongoing/begin', m.isAdminOrCurrentUser, function(req, res) {
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

router.post('/fulfilments/ongoing/alive', m.isAdminOrCurrentUser, function(req, res) {
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

router.post('/fulfilments/ongoing/end', m.isAdminOrCurrentUser, function(req, res) {
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

router.get('/fulfilments/ongoing/:username', m.isAdminOrCurrentUser, function(req, res) {
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

router.delete('/fulfilments/ongoing/:username', m.isAdminOrCurrentUser, function(req, res) {
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

var getScheduleFulfilments = function(id, requestingUser, callback) {
    // Find the schedule
    Schedule.findById(id, function(err, schedule) {
        if (err) return callback(err);
        if (!schedule) return callback(notFoundError);

        m._isSameGroupOrAdminDatabase(requestingUser, schedule.owner, function(err, authorised) {
            if (err) return callback(err);

            if (authorised) {
                // Find all fulfilments during this schedule
                Fulfilment.overlaps(schedule.start_time, schedule.end_time, function(err, fulfilments) {
                    if (err) return callback(err);

                    // Were any of these users pledged?
                    Pledge.find({
                        schedule: id
                    }, function(err, pledges){
                        if (err) return callback(err);
                                        
                        // Find the fulfilments that correspond to pledges
                        var fulfilled = [];
                        pledges.forEach(function(p) {
                            fulfilments.some(function(f) {
                                if (f.username == p.username) {
                                    var obj = {
                                        completion: ((schedule.start_time < f.start_time || schedule.end_time > f.end_time) ? "partial" : "full"),
                                        username: p.username,
                                        owner: schedule.owner
                                    };

                                    fulfilled.push(obj);
                                    return true;
                                }
                            });
                        });

                        return callback(err, fulfilled);
                    });
                });
            } else {
                return callback(notAuthorisedError);
            }
        });
    });
}

// Return the users that have fulfilled a pledge to attend a given schedule
router.get('/fulfilments/users/:schedule', function(req, res) {
    var id = sanitize(req.params.schedule);
    getScheduleFulfilments(id, req.user, function(err, fulfilments) {
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
 * Feed routes
*/

var humanizePledge = function(pledge, requestingUser, callback) {
    Schedule.findById(pledge.schedule, function(err, schedule) {
        if (err) return callback(err);

        var you = (pledge.username === requestingUser.username);

        var html = '<span class=\"text-capitalize\">' + 
            '<a href=\"/users/' + pledge.username + '\" title=\"View ' + (you ? 'your' : (pledge.username + '\'s')) + ' profile\">' +
            (you ? 'you' : pledge.username) + 
            '</a></span> ' + 
            config.dictionary.pledge.verb.past + 
            ' to ';

        if (err || !schedule) {
            html += 'an <em>unknown schedule</em>.';
        }
        else {
            html += '<a href=\"/' + 
                config.dictionary.schedule.noun.plural + 
                '/view/' + 
                schedule._id + 
                '\" title=\"View the ' + 
                config.dictionary.schedule.noun.singular + 
                '\">' + 
                schedule.title + 
                '</a>.';
        }

        callback(html);
    });
};

var humanizeSchedule = function(schedule, requestingUser) {
    var you = (schedule.owner === requestingUser.username);

    var html = '<span class=\"text-capitalize\">' +
        '<a href=\"/users/' + schedule.owner + '\" title=\"View ' + (you ? 'your' : (schedule.owner + '\'s')) + ' profile\">' +
        (you ? 'you' : schedule.owner) +
        '</a></span> created <a href=\"/' +
        config.dictionary.schedule.noun.plural +
        '/view/' +
        schedule._id + 
        '\" title=\"View the ' + 
        config.dictionary.schedule.noun.singular + 
        '\">' +
        schedule.title +
        '</a> for ' + 
        moment(schedule.start_time).calendar() + 
        '.';

    if (schedule.description) {
        html = html +
            ' ' +
            (you ? 'You' : 'They') +
            ' described it as &ldquo;' +
            '<em>' + schedule.description + '</em>' +
            '&rdquo;.';
    }

    return html;
};

var humanizeFulfilment = function(fulfilment, requestingUser, callback) {

    // Find all pledges that are completed by the fulfilment
    fulfilment.completes(function(err, pledges) {
        if (err) return callback(err);

        var schedules = [];

        async.each(pledges, function(p, next) {

            // TODO - this can be added to fulfilment.completes directly
            if (p.username !== fulfilment.username) {
                return next();
            }

            // Get completion status of other pledged users
            getScheduleFulfilments(p.schedule, requestingUser, function(err, fulfilments) {
                if (err) return next(err);

                schedules.push({
                    id: p.schedule,
                    title: p.scheduleTitle,
                    fulfilments: fulfilments
                });
                next();
            });
        }, function done(err) {
            if (err) return callback(err);

            var you = (requestingUser.username === fulfilment.username);

            var html = "";
            if (fulfilment.ongoing) {
                html = '<span class=\"text-capitalize\">' +
                    '<a href=\"/users/' + fulfilment.username + '\" title=\"View ' + (you ? 'your' : (fulfilment.username + '\'s')) + ' profile\">' +
                    (you ? 'you' : fulfilment.username) + 
                    '</a></span> ' +
                    (you ? 'are ' : 'is ') +
                    config.dictionary.action.verb.presentParticiple +
                    ' now! ' +
                    (you ? 'You' : 'They') + ' have been ' +
                    config.dictionary.action.verb.presentParticiple + ' for ' +
                    moment.duration(moment(fulfilment.end_time).diff(fulfilment.start_time)).humanize() +
                    '.';
            }
            else {
                var html = '<span class=\"text-capitalize\">' +
                    '<a href=\"/users/' + fulfilment.username + '\" title=\"View ' + (you ? 'your' : (fulfilment.username + '\'s')) + ' profile\">' +
                    (you ? 'you' : fulfilment.username) +
                    '</a></span> logged a ' + 
                    config.dictionary.action.noun.singular + 
                    ' of <a href=\"/' + 
                    config.dictionary.action.noun.plural + 
                    '/view/' + 
                    fulfilment._id + 
                    '\" title=\"View the ' + 
                    config.dictionary.fulfilment.noun.singular + 
                    '\">' + 
                    moment.duration(moment(fulfilment.end_time).diff(fulfilment.start_time)).humanize() + 
                    '</a> that began ' +
                    moment(fulfilment.start_time).fromNow() +
                    '.';

                    schedules.forEach(function(s) {

                    // Is it not you?
                    // Did the user complete it?
                    var userCompletion = '';

                    // Store other fulfilled users
                    var partial = [];
                    var full = [];

                    s.fulfilments.forEach(function(f) {
                        var _user = (f.username === fulfilment.username);

                        if (_user) {
                            userCompletion = f.completion;
                        }
                        else {
                            if (f.completion === 'partial')
                                partial.push(f.username);
                            else
                                full.push(f.username);
                        }
                    });

                    var vocab = {
                        they: 'They',
                        their: 'their',
                        completion: (userCompletion == 'partial') ? 'partially' : 'completely',
                        otherCompletion: (userCompletion == 'partial') ? 'completely' : 'partially'
                    };

                    if (you) {
                        vocab.they = 'You';
                        vocab.their = 'your';
                    }

                    // Display the fulfilment user's pledge status first
                    html = html +
                        ' ' + vocab.they + ' ' + vocab.completion +
                        ' ' + config.dictionary.fulfilment.verb.past + ' ' + vocab.their + ' ' +
                        config.dictionary.pledge.noun.singular + ' to ' +
                        '<a href=\"/' + config.dictionary.schedule.noun.plural + '/view/'+ s.id + 
                        '\" title=\"View the ' + config.dictionary.schedule.noun.singular + '\">' + 
                        s.title + '</a>';

                    // Followed by other user's with the same pledge status 
                    var sameCompletion = full;
                    var otherCompletion = partial;

                    if (userCompletion === 'partial') {
                        sameCompletion = partial;
                        otherCompletion = full;
                    }

                    for (var i = 0; i < sameCompletion.length; i++) {
                        if (i == sameCompletion.length - 1 && sameCompletion.length > 1) {
                            html += ' and ';
                        }
                        else if (i < sameCompletion.length - 1 && i > 0) {
                            html += ', ';
                        }
                        else {
                            html += ' with ';
                        }

                        var _you = (sameCompletion[i] === requestingUser.username);

                        html = html +
                            '<a href=\"/users/' + sameCompletion[i] + '\">' +
                            (_you ? 'you' : sameCompletion[i]) +
                            '</a>';
                    }
                    html += '.';

                    // Then the other pledges last
                    var youFound = false;
                    for (var i = 0; i < otherCompletion.length; i++) {
                        if (i == otherCompletion.length - 1 && otherCompletion.length > 1) {
                            html += ' and ';
                        }
                        else if (i < otherCompletion.length - 1 && i > 0) {
                            html += ', ';
                        }
                        else {
                            html += ' ';
                        }

                        var _you = (otherCompletion[i] === requestingUser.username);
                        if (_you) {
                            youFound = true;
                        }

                        html = html +
                            '<a href=\"/users/' + otherCompletion[i] + '\">' +
                            ((i == 0) ? '<span class=\"text-capitalize\">' : '') +
                            (_you ? 'you' : otherCompletion[i]) +
                            ((i == 0) ? '</span>' : '') +
                            '</a>';
                    }

                    if (otherCompletion.length) {
                        html = html +
                            ' ' + vocab.otherCompletion + ' ' + config.dictionary.fulfilment.verb.past + 
                            (youFound ? ' your ' : ' their ') +
                            ((otherCompletion.length > 1) ? config.dictionary.pledge.noun.plural : config.dictionary.pledge.noun.singular) +
                            '.';
                    }
                });
            }

            callback(err, html);
        });
    });
};

// Local feed; feed for specified user
var localFeed = function(username, fromTime, requestingUser, callback) {

    fromTime = new Date(fromTime);

    // No fromTime specified?
    if (!fromTime || isNaN(fromTime.getTime())) {
        // Use three days in the past
        var threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        fromTime = threeDaysAgo;
    }

    async.parallel([
        function(next) {
            Pledge.find({username: username, createdAt: { $gte: fromTime } }).exec(next);
        },
        function(next) {
            Schedule.find({owner: username, createdAt: { $gte: fromTime }}).exec(next);
        },
        function(next) {
            fulfilmentsFeed(username, fromTime, requestingUser, next);
        }
    ], function(err, results) {

        var resultCombined = [];

        // Humanize the entries!
        async.parallel([     
            function(next) {
                async.each(results[0], function(pledge, _callback) {
                    humanizePledge(pledge, requestingUser, function(html) {
                        var o = {
                        type: 'pledge',
                        html: html,
                        createdAt: pledge.createdAt
                    };
                        resultCombined.push(o);
                        _callback();
                    });
                }, function done() {
                    next();
                });
            },
            function(next) {
                results[1].forEach(function(schedule){
                    var o = {
                        type: 'schedule',
                        html: humanizeSchedule(schedule, requestingUser),
                        createdAt: schedule.createdAt
                    };
                    resultCombined.push(o);
                });
                next();
            },
            function(next) {
                resultCombined = resultCombined.concat(results[2]);
                next();
            }],
            function done(err) {
                if (err) return callback(err);

                // Sort by creation date, descending
                resultCombined.sort(function(a, b){
                    if (a.createdAt > b.createdAt) return -1;
                    if (a.createdAt < b.createdAt) return 1;
                    return 0;
                });

                // Return as array
                callback(err, resultCombined);
            });
    });
};

// Retrieve the feeds for an array of users (or usernames)
var localFeeds = function(users, fromTime, requestingUser, callback) {
    var feedCombined = [];

    // Retrieve the user feeds
    async.each(users, function(u, next) {
        // Is the input an object or a username?
        var username = u;
        if (u && u.username)
            username = u.username;

        // Get the user's feed
        localFeed(username, fromTime, requestingUser, function(err, items) {
            if (err) return next(err);
            feedCombined = feedCombined.concat(items);
            next();
        });
    }, function done(err) {
        if (err) return callback(err);

        // Interlace the entries in chronological order
        feedCombined.sort(function(a, b){
            if (a.createdAt > b.createdAt) return -1;
            if (a.createdAt < b.createdAt) return 1;
            return 0;
        });

        callback(err, feedCombined)
    });
};

var _localFeed = function(req, res) {
    var username = sanitize(req.params.username);
    var fromTime = sanitize(req.params.from);

    m._isSameGroupOrAdminDatabase(req.user, username, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);

        if (authorised) {
            localFeed(username, fromTime, req.user, function(err, feedArray) {
                if (err) return response.JSON.error.server(res, err);
                res.json(feedArray);
            });
        } else {
            return response.JSON.invalid(res);
        }
    });
};

router.get('/feed/user/:username/from/:from', function(req, res) {
    _localFeed(req, res);
});

router.get('/feed/user/:username', function(req, res) {
    _localFeed(req, res);
});

var fulfilmentsFeed = function(username, fromTime, requestingUser, callback) {
    fromTime = new Date(fromTime);

    // No fromTime specified?
    if (!fromTime || isNaN(fromTime.getTime())) {
        // Use three days in the past
        var threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        fromTime = threeDaysAgo;
    }

    Fulfilment.find({username: username, createdAt: { $gte: fromTime }}).sort({createdAt: 'desc'}).exec(function(err, fulfilments) {
        if (err) return callback(err);
        var results = [];
        async.each(fulfilments, function(fulfilment, next) {
            humanizeFulfilment(fulfilment, requestingUser, function(err, html){
                if (err) return next(err);

                var o = {
                    type: 'fulfilment',
                    html: html,
                    createdAt: fulfilment.createdAt
                };
                results.push(o);  
                next(); 
            });
        }, function done(err){
            callback(err, results);
        });
    });
};

var _fulfilmentsFeed = function(req, res) {
    var username = sanitize(req.params.username);
    var fromTime = sanitize(req.params.from);

    m._isSameGroupOrAdminDatabase(req.user, username, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);

        if (authorised) {
            fulfilmentsFeed(username, fromTime, req.user, function(err, feedArray) {
                if (err) return response.JSON.error.server(res, err);
                res.json(feedArray);
            });
        } else {
            return response.JSON.invalid(res);
        }
    });
};

router.get('/feed/user/:username/fulfilments', function(req, res) {
    _fulfilmentsFeed(req, res);
});

// Global feed; all users in requesting user's group
var _globalFeed = function(req, res) {
    var users = [];

    var fromTime = sanitize(req.params.from);

    if (req.user.admin) {
        // Get all the users
        User.find({}, function(err, users) {
            if (err) return response.JSON.error.server(res, err);

            // Retrieve their feeds
            localFeeds(users, fromTime, req.user, function(err, feedCombined) {
                if (err) return response.JSON.error.server(res, err);
                res.json(feedCombined);
            });
        });
    }
    else {
        // Get all the users from all groups of the requesting user
        async.each(req.user.groups, function(g, callback) {
            Group.members(g, function(err, _users) {
                if (err || !_users) return callback(err);
                users = users.concat(_users);
                callback();
            });
        }, function done(err) {
            if (err) return response.JSON.error.server(res, err);

            // Add the user to the array
            users.push(req.user);

            // Remove duplicate users from the array
            users = uniqFast(users);

            // Retrieve their feeds
            localFeeds(users, fromTime, req.user, function(err, feedCombined) {
                if (err) return response.JSON.error.server(res, err);
                res.json(feedCombined);
            });
        });
    }
};

router.get('/feed', function(req, res) {
    _globalFeed(req, res);
});

router.get('/feed/from/:from', function(req, res) {
    _globalFeed(req, res);
});

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
