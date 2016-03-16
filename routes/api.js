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

var config = require('../config');

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
var isSameGroupOrAdmin = function(requestingUser, resultingUser) {
    var authorised = requestingUser.admin;
    resultingUser.groups.some(function(g) {
        if (requestingUser.indexOf(g)) {
            authorised = true;
        }
        return authorised;
    });
    return authorised;
};

var isSameGroupOrAdminDatabase = function(requestingUser, resultingUsername, callback) {
    User.findOne({ username: resultingUsername }, function(err, user) {
        if (err) return callback(err);
        callback(err, isSameGroupOrAdmin(requestingUser, user));
    });
};

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
            update['username'] = sanitize(req.body.username);
        }

        if (req.body.userpass) {
            update['password'] = bcrypt.hashSync(sanitize(req.body.userpass));
        }

        if (req.body['usergroups[]']) {
            update['groups'] = sanitize(req.body['usergroups[]']);
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
                    deleteSchedule(schedule._id, function(err, result) {
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

    isSameGroupOrAdmin(req.user, user, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);
        
        if (authorised) {
            Schedule.find({ owner: username }, function(err, schedules){
                if (err) return response.JSON.error.server(res, err);
                res.json(schedules);
            });
        } else {
            return response.JSON.error.invalid(res);
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
        return response.JSON.error.invalid(res);
    }
});

router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id), function(err, schedule){
        if (err) return response.JSON.error.server(res, err);
        if (!schedule) return response.JSON.error.notfound(res);

        isSameGroupOrAdminDatabase(req.user, schedule.owner, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                res.json(schedule);
            } else {
                return response.JSON.error.invalid(res);
            }
        });
    });
});

router.post('/schedules/new', m.isAdminOrCurrentUser, function(req, res) {
    var username = sanitize(req.body.username);

    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: username
    });

    schedule.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);

        newPledge(username, doc._id, function(err, doc) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

router.post('/schedules/update', m.isAdminOrCurrentUser, function(req, res) {
    Schedule.findByIdAndUpdate(sanitize(req.body.id), {
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        if (!result) return response.JSON.error.notfound(res);
        response.JSON.ok(res);
    });
});

var deleteSchedule = function(id, callback) {
    Schedule.findById(id, function(err, schedule) {
        if (err || !schedule) return callback(err);

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

router.delete('/schedules/update/:id', m.isAdminOrCurrentUser, function(req, res) {
    deleteSchedule(sanitize(req.params.id), function(err, result) {
        if (err) return response.JSON.error.server(res, err);
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

var getScheduleClass = function(schedule, requestingUser) {
    // User-owned events are green, others are red.
    // TODO - a better colouring scheme is needed
    return (schedule.owner == requestingUser.username) ? 'bg-success' : 'bg-danger';
};

var makeCalendarFormat = function(results, requestingUser) {
    return results.map(function(s){
        return {
            title: s.title,
            description: s.description,
            start: moment(s.start_time).format(),
            end: moment(s.end_time).format(),
            owner: s.owner,
            url: '/' + config.dictionary.schedule.noun.plural + '/view/' + s._id,
            className: getScheduleClass(s, requestingUser)
        }
    });
};

// retrieve events for populating the schedules calendar
router.get('/calendar', function(req, res) {

    // Admin or not?
    if (req.user.admin) {

        // Retrieve all schedules
        Schedule.find({}, function(err, schedules) {
            if (err) return response.JSON.error.server(res, err); 
            res.json(makeCalendarFormat(schedules, req.user));
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
            res.json(makeCalendarFormat(results, req.user));
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

        isSameGroupOrAdminDatabase(req.user, pledge.username, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                res.json(pledge);
            } else {
                return response.JSON.error.invalid(res);
            }
        });
    });
});

// Create a new pledge
var newPledge = function(username, schedule, callback) {
    // Create Pledge object
    var pledgeObj = {
        username: username,
        schedule: schedule
    };

    // Add a new pledge, if one does not already exist
    Pledge.findOne(pledgeObj, function(err, existing) {
        if (err) return callback(err, existing);
        var pledge = new Pledge(pledgeObj);
        pledge.save(callback);
    });
}

router.post('/pledges/new', m.isAdminOrCurrentUser, function(req, res) {
    newPledge(sanitize(req.body.username), sanitize(req.body.schedule), function(err, pledge) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.delete('/pledges/update/:id', m.isAdminOrCurrentUser, function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge) {
        if (err) return response.JSON.error.server(res, err);
        if (!pledge) return response.JSON.error.notfound(res);

        pledge.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

router.delete('/pledges/update/schedule/:schedule/username/:username', m.isAdminOrCurrentUser, function(req, res) {
    Pledge.findOne({
        schedule: sanitize(req.params.schedule),
        username: sanitize(req.params.username)
    }, function(err, pledge) {
        if (err) return response.JSON.error.server(res, err);
        if (!pledge) return response.JSON.error.notfound(res);

        pledge.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

// Return the users that have pledged to attend a given schedule
router.get('/pledges/users/:schedule', function(req, res) {
    var schedule = sanitize(req.params.schedule);

    // Ensure the schedule owner and the requesting user are in the same group
    Schedule.findOne({ _id: schedule }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        if (!result) return response.JSON.error.notfound(res);

        isSameGroupOrAdminDatabase(req.user, result.owner, function(err, authorised) {
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

// Return an active schedule that the user has pledged to.
// The schedule can be active now or starting soon.
router.get('/pledges/username/:username/now', function(req, res) {
    var username = sanitize(req.params.username);

    isSameGroupOrAdminDatabase(req.user, username, function(err, authorised) {
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

                    var result = {
                        message: 'No ' + config.dictionary.schedule.noun.singular
                    };

                    schedules.some(function(s) {
                        pledges.some(function(p) {
                            if (p.schedule == s._id) {
                                result = {
                                    message: 'OK',
                                    schedule: s
                                };
                                return true;
                            }
                        });
                    });

                    return res.json(result);
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

/* GET fulfilment listing page. */
router.get('/fulfilments/list', m.isAdmin, function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) return response.JSON.error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);
        res.json(fulfilment);
    });
});

router.post('/fulfilments/new', m.isAdminOrCurrentUser, function(req, res) {
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    });
    fulfilment.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.post('/fulfilments/update', m.isAdminOrCurrentUser, function(req, res) {
    Fulfilment.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

/* DELETE to fulfilment update service */
router.delete('/fulfilments/update/:id', m.isAdminOrCurrentUser, function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment) {
        if (err) return response.JSON.error.server(res, err);
        if (!fulfilment) return response.JSON.error.notfound(res);

        fulfilment.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

function _completes(req, res, callback) {
    Fulfilment.completes(sanitize(req.params.id), function(err, pledges){
       if (err) return response.JSON.error.server(res, err);
        if (!pledges) return response.JSON.error.notfound(res);
        callback(pledges);
    });
}

// pledges completed by fulfilment
// TODO - restrict to those pledges in the group of the requesting user
router.get('/fulfilments/view/:id/completes', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges);
    });
});

// pledges of specified completion status by fulfilment
// TODO - restrict to those pledges in the group of the requesting user
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
            ongoing: true
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
        if (!result) return response.JSON.error.notfound(res);

        fulfilment.delete(function(err) {
            if (err) return response.JSON.error.server(res, err);
            response.JSON.ok(res);
        });
    });
});

// Return the users that have fulfilled a pledge to attend a given schedule
router.get('/fulfilments/users/:schedule', function(req, res) {
    var id = sanitize(req.params.schedule);

    // Find the schedule
    Schedule.findById(id, function(err, schedule) {
        if (err) return response.JSON.error.server(res, err);
        if (!schedule) return response.JSON.error.notfound(res);

        isSameGroupOrAdminDatabase(req.user, schedule.owner, function(err, authorised) {
            if (err) return response.JSON.error.server(res, err);

            if (authorised) {
                // Find all fulfilments during this schedule
                Fulfilment.overlaps(schedule.start_time, schedule.end_time, function(err, fulfilments) {
                    if (err) return response.JSON.error.server(res, err);

                    // Were any of these users pledged?
                    Pledge.find({
                        schedule: id
                    }, function(err, pledges){
                        if (err) return response.JSON.error.server(res, err);
                                        
                        // Find the fulfilments that correspond to pledges
                        var fulfilled = [];
                        pledges.forEach(function(f) {
                            fulfilments.some(function(p) {
                                if (f.username == p.username) {
                                    fulfilled.push(p.username);
                                    return true;
                                }
                            });
                        });
                        
                        // TODO - partial / fully complete
                        res.json(fulfilled);
                    });
                });
            } else {
                return response.JSON.error.invalid(res);
            }
        });
    });
});

/*
 * Feed routes
*/

router.get('/feed', function(req, res) {
    // TODO

    // Get user feed for all users in group of requesting user

    // Interlace them in chronological order
});

router.get('/feed/:username', function(req, res) {
    var username = sanitize(req.params.username);

    isSameGroupOrAdminDatabase(req.user, username, function(err, authorised) {
        if (err) return response.JSON.error.server(res, err);

        if (authorised) {
            // Retrieve pledges, schedules and fulfilments, most-recent first
            async.parallel([
                function(next) {
                    Pledge.find({username: username}).sort({ createdAt: 'desc' }).exec(next);
                },
                // TODO - restrict to one user!
                function(next) {
                    Schedule.find({}).sort({ createdAt: 'desc' }).exec(next);
                },
                function(next) {
                    Fulfilment.find({username: username}).sort({ createdAt: 'desc' }).exec(next);
                }
            ], function(results) {
                console.log(results);

                // TODO - Humanize

                // TODO - Return as array

                return res.json(results);
            });
        } else {
            return response.JSON.invalid(res);
        }
    });
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
