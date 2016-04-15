var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var async = require('async');

var User = require('../../models/users');
var Group = require('../../models/groups');
var Schedule = require('../../models/schedules');
var Pledge = require('../../models/pledges');
var Fulfilment = require('../../models/fulfilments');

var config = require('../../config');

var response = require('../response');
var m = require('../middlewares');

var _h = require('../helpers');
var _sh = require('../schedules/helpers');

var moment = require('moment');
moment.locale(config.locale);

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
            _sh.getScheduleFulfilments(p.schedule, requestingUser, function(err, fulfilments) {
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
            users = _h.uniqFast(users);

            // Retrieve their feeds
            localFeeds(users, fromTime, req.user, function(err, feedCombined) {
                if (err) return response.JSON.error.server(res, err);
                res.json(feedCombined);
            });
        });
    }
};

router.get('/', function(req, res) {
    _globalFeed(req, res);
});

router.get('/from/:from', function(req, res) {
    _globalFeed(req, res);
});

router.get('/user/:username/fulfilments', function(req, res) {
    _fulfilmentsFeed(req, res);
});

router.get('/user/:username/from/:from', function(req, res) {
    _localFeed(req, res);
});

router.get('/user/:username', function(req, res) {
    _localFeed(req, res);
});

/*
 * Export the routes.
*/

module.exports = router;
