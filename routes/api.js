var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var moniker = require('moniker');

var User = require('../models/users');
var Group = require('../models/groups');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');
var Fulfilment = require('../models/fulfilments');

var config = require('../config');

/*
 * Response functions.
*/

var error = {
    notfound: function(res) {
        res.status(404).json({error: 'Resource not found'});
    },
    server: function(res, err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
};

var response = {
    ok: function(res) {
        res.json({message: 'OK'});
    },
    invalid: function(res) {
        res.json({message: 'Invalid'});
    }
};

/*
 * Authentication functions.
*/

router.post('/authenticate', function(req, res){
    User.findOne({
        username: sanitize(req.body.username)
    }, function (err, user){
        if (err) return error.server(res, err);

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
router.use(function(req, res, next){
    if (req.authentication.success) {
        next();
    }
    else {
        return res.status(req.authentication.status).json({
            success: req.authentication.success,
            message: req.authentication.message
        }); 
    }
});

var isAdmin = function(req, res, next) {
    if (!req.user.admin) {
        return response.invalid(res);
    }
    else {
        next();
    }
};

var isCurrentUser = function(req, res, next) {
    if (req.body.username != req.user.username) {
        return response.invalid(res);
    }
    else {
        next();
    }
};

var isAdminOrCurrentUser = function(req, res, next) {
    if (req.body.owner != req.user.username && !req.user.admin) {
        return response.invalid(res);
    }
    else {
        next();
    }
};

/*
 * Users.
 * Users within the system.
*/

router.get('/users/list', function(req, res) {
    User.find(function(err, users){
        if (err) return error.server(res, err);
        res.json(users);
    });
});

router.get('/users/view/:username', function(req, res) {
    User.find({ username: sanitize(req.params.username) }, function(err, user){
        if (err) return error.server(res, err);
        if (!user) return error.notfound(res);
        res.json(user);
    });
});

router.post('/users/new', function(req, res) {
    // TODO - is admin
    if (!req.user.admin) return response.invalid(res);

    var user = new User({
        username: sanitize(req.body.username),
        password: bcrypt.hashSync(sanitize(req.body.userpass)),
        groups: sanitize(req.body['usergroups[]'])
    });
    user.save(function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/users/update', function(req, res) {
    // TODO - is admin or current user
    User.findById(req.body.id, function (err, user) {
        if (err) return error.server(res, err);

        if (user.username != req.user.username && !req.user.admin) return response.invalid(res);

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
            if (err) return error.server(res, err);
            response.ok(res);
        });
    })
});

router.delete('/users/update/:username', function(req, res) {
    // TODO - is admin
    if (!req.user.admin) return response.invalid(res);

    User.findOneAndRemove({
        username: sanitize(req.params.username)
    }, function(err, result){
        if (err) return error.server(res, err);
        response.ok(res);
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

router.get('/users/generate', function(req, res) {
    // TODO - is user admin?

    return res.json({
        username: generateUsername(),
        password: generatorPassword()
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

router.get('/groups/list', function(req, res) {
    // TODO - is admin
    Group.find(function(err, groups){
        if (err) return error.server(res, err);
        res.json(groups);
    });
});

router.get('/groups/view/:name', function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) return error.server(res, err);
        if (!group) return error.notfound(res);
        res.json(group);
    });
});

router.get('/groups/view/:name/members', function(req, res) {
    Group.members(sanitize(req.params.name), function(err, users){
        if (err) return error.server(res, err);
        res.json(users);
    });
});

router.post('/groups/new', function(req, res) {
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/groups/update', function(req, res) {
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.delete('/groups/update/:name', function(req, res) {
    Group.findOneAndRemove({
        name: sanitize(req.params.name)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

router.get('/schedules/list', function(req, res) {
    Schedule.find(function(err, schedules){
        if (err) return error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/list/owner/:owner', function(req, res) {
    Schedule.find({ owner: sanitize(req.params.owner) }, function(err, schedules){
        if (err) return error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/list/group/:group', function(req, res) {
    Schedule.group(sanitize(req.params.group), function(err, schedules){
        if (err) return error.server(res, err);
        res.json(schedules);
    });
});

router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id), function(err, schedule){
        if (err) return error.server(res, err);
        else if (!schedule) return error.notfound(res);
        res.json(schedule);
    });
});

router.post('/schedules/new', function(req, res) {
    // TODO - is admin or current user
    if (req.body.owner != req.user.username && !req.user.admin) return response.invalid(res);
    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    });
    schedule.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/schedules/update', function(req, res) {
    // TODO - is admin or current user
    Schedule.findByIdAndUpdate(sanitize(req.body.id), {
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    }, function(err, result) {
        if (err) return error.server(res, err);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

router.delete('/schedules/update/:id', function(req, res) {
    // TODO - is admin or current user
    Schedule.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res, err);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

// retrieve events for populating the schedules calendar
router.get('/calendar', function(req, res) {

        // User-owned events are green, others are red.
        // TODO - a better colouring scheme is needed
        // TODO - if the user is admin, display ALL groups

        // Set groups to be an empty array if its null
        req.user.groups = req.user.groups || [];

        // Retrieve all schedules for all groups the user
        // is a member of.
        Schedule.groups(req.user.groups, function(err, schedules) {
            var json = schedules.map(function(s){
                return {
                    title: s.title,
                    description: s.description,
                    start: moment(s.start_time).format(),
                    end: moment(s.end_time).format(),
                    owner: s.owner,
                    url: '/' + config.dictionary.schedule.noun.plural + '/view/' + s._id,
                    className: (s.owner == req.user.username) ? 'bg-success' : 'bg-danger'
                }
            });
            res.json(json);
        })
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

router.get('/pledges/list', function(req, res) {
    Pledge.find(function(err, pledges){
        if (err) return error.server(res, err);
        res.json(pledges);
    });
});

router.get('/pledges/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) return error.server(res, err);
        if (!pledge) return error.notfound(res);
        res.json(pledge);
    });
});

router.post('/pledges/new', function(req, res) {
    // TODO - is admin or current user
    if (req.body.username != req.user.username && !req.user.admin) return response.invalid(res);

    var pledgeObj = {
        username: sanitize(req.body.username),
        schedule: sanitize(req.body.schedule)
    };

    // Add a new pledge, if one does not already exist
    Pledge.findOne(pledgeObj, function(err, existing) {
        if (err) return error.server(res, err);
        if (existing) return response.invalid(res);

        var pledge = new Pledge(pledgeObj);
        pledge.save(function(err, doc) {
            if (err) return error.server(res, err);
            response.ok(res);
        });
    });
});

router.delete('/pledges/update/:id', function(req, res) {
    // TODO - is admin or current user
    Pledge.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.delete('/pledges/update/schedule/:schedule/username/:username', function(req, res) {
    Pledge.findOneAndRemove({
        schedule: sanitize(req.params.schedule),
        username: sanitize(req.params.username)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

// Return the users that have pledged to attend a given schedule
router.get('/pledges/users/:schedule', function(req, res) {
    Pledge.find({
        schedule: sanitize(req.params.schedule)
    }, function(err, pledges){
        if (err) return error.server(res, err);
        res.json(pledges.map(function(p){ return p.username; }));
    });
});

// Return an active schedule that the user has pledged to.
// The schedule can be active now or starting soon.
router.get('/pledges/username/:username/now', function(req, res) {
    var username = sanitize(req.params.username);
    Pledge.find({
        username: username
    }, function(err, pledges) {
        if (err) return error.server(res, err);

        // Use now as the start date,
        // and 15 minutes in the future as the end date.
        var now = new Date();
        var soon = new Date(now.getTime() + 15*60000);

        Schedule.overlaps(now, soon, function(err, schedules) {
            if (err) return error.server(res, err);

            var result = {
                message: 'No ' + config.dictionary.schedule.noun.singular
            };

            schedules.some(function(s) {
                if (s.ownedBy(username)) {
                    result = {
                        message: 'OK',
                        schedule: s
                    };
                    return true;
                }
            });

            return res.json(result);
        })
    });
});

/*
 * Fulfilments
 * Users can create schedules, visible to their group.
*/

/* GET fulfilment listing page. */
router.get('/fulfilments/list', function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        if (err) return error.server(res, err);
        res.json(fulfilments);
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) return error.server(res, err);
        if (!fulfilment) return error.notfound(res);
        res.json(fulfilment);
    });
});

router.post('/fulfilments/new', function(req, res) {
    // TODO - is admin or current user
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    });
    fulfilment.save(function(err, doc) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

router.post('/fulfilments/update', function(req, res) {
    // TODO - is admin or current user
    Fulfilment.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    }, function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

/* DELETE to fulfilment update service */
router.delete('/fulfilments/update/:id', function(req, res) {
    // TODO - is admin or current user
    Fulfilment.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) return error.server(res, err);
        response.ok(res);
    });
});

function _completes(req, res, callback) {
    Fulfilment.completes(sanitize(req.params.id), function(err, pledges){
       if (err) return error.server(res, err);
        if (!pledges) return error.notfound(res);
        callback(pledges);
    });
}

// pledges completed by fulfilment
router.get('/fulfilments/view/:id/completes', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges);
    });
});

// pledges of specified completion status by fulfilment
router.get('/fulfilments/view/:id/completes/:status', function(req, res) {
    _completes(req, res, function(pledges){
        res.json(pledges.filter(function(p){
            return p.completion == req.params.status;
        }));
    });
});

router.post('/fulfilments/ongoing/begin', function(req, res) {
    // TODO - is admin or current user

    // Each user can only have one ongoing fulfilment!
    Fulfilment.findOne({
        username: sanitize(req.body.username),
        ongoing: true
    }, function(err, fulfilment) {
        if (err) return error.server(res, err);

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
            if (err) return error.server(res, err);
            return res.json({
                message: 'OK',
                time: 0
            });
        });
    })
});

router.post('/fulfilments/ongoing/alive', function(req, res) {
    // TODO - is admin or current user

    // Update the ongoing fulfilment with the current time
    Fulfilment.findOneAndUpdate({
        username: sanitize(req.body.username),
        ongoing: true
    }, {
        end_time: new Date()
    }, function(err, result) {
        if (err) return error.server(res, err);
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

router.post('/fulfilments/ongoing/end', function(req, res) {
    // TODO - is admin or current user

    // Update the user's ongoing fulfilment with the final time
    // and remove the ongoing flag
    Fulfilment.findOneAndUpdate({
        username: sanitize(req.body.username),
        ongoing: true
    }, {
        end_time: new Date(),
        ongoing: false
    }, function(err, result) {
        if (err) return error.server(res, err);
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

router.get('/fulfilments/ongoing/:username', function(req, res) {
    // TODO - is admin or current user

    // Find an ongoing fulfilment from the user
    Fulfilment.findOne({
        username: sanitize(req.params.username),
        ongoing: true
    }, function(err, result) {
        if (err) return error.server(res, err);

        if (!result) return res.json({
            message: 'No ongoing ' + config.dictionary.fulfilment.noun.singular
        });

        return res.json({
            message: 'OK',
            time: (result.end_time - result.start_time)
        });
    });
});

router.delete('/fulfilments/ongoing/:username', function(req, res) {
    // TODO - is admin or current user

    // Remove an ongoing fulfilment from the user
    Fulfilment.findOneAndRemove({
        username: sanitize(req.params.username),
        ongoing: true
    }, function(err, result) {
        if (err) return error.server(res, err);
        if (!result) return error.notfound(res);
        response.ok(res);
    });
});

// Return the users that have fulfilled a pledge to attend a given schedule
router.get('/fulfilments/users/:schedule', function(req, res) {
    // TODO - return results for current group only

    var id = sanitize(req.params.schedule);

    // Find the schedule
    Schedule.findById(id, function(err, schedule) {
        if (err) return error.server(res, err);
        if (!schedule) return error.notfound(res);

        // Find all fulfilments during this schedule
        Fulfilment.during(schedule.start_time, schedule.end_time, function(err, fulfilments) {
            if (err) return error.server(res, err);

            // Were any of these users pledged?
            Pledge.find({
                schedule: id
            }, function(err, pledges){
                if (err) return error.server(res, err);
                                
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

router.get('/feed/:user', function(req, res) {
    // TODO

    // Retrieve pledges, schedules and fulfilments, most-recent first
    // TODO - restrict to one user!
    async.parallel([
        function(next) {
            Pledge.find({}).sort({ createdAt: 'desc' }).exec(next);
        },
        function(next) {
            Schedule.find({}).sort({ createdAt: 'desc' }).exec(next);
        },
        function(next) {
            Fulfilment.find({}).sort({ createdAt: 'desc' }).exec(next);
        }
    ], function(results) {
        console.log(results);
    });

    // Humanize

    // Return as array
});

/*
 * Add a JSON 404 route
*/

router.use(function(req, res, next) {
  error.notfound(res);
});

/*
 * Export the routes.
*/

module.exports = router;
