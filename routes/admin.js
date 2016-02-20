var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var User = require('../models/users');
var Group = require('../models/groups');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');
var Fulfilment = require('../models/fulfilments');

/*
 * Users.
 * Users within the system.
*/

/* GET user listing page. */
router.get('/users/list', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.render('admin-users-list', {
                title: 'Users',
                users: users
            });
        }
    });
});

/* GET user information */
router.get('/users/view/:username', function(req, res) {
    Group.find(function(err, groups){
    	if (err) {
    		console.error(err);
    		res.send('There was a problem adding the information to the database.');
    	}
        User.findOne({ username: sanitize(req.params.username) }, function(err, user){
            if (err) {
                console.error(err);
                return res.render('500');
            }
            else if (!user) {
                res.render('404');
            }
            else {
                res.render('admin-users-view', {
                    title: 'View User',
                    user: user,
                    groups: groups
                });
            }
        });
    });
});

/* GET new user page. */
router.get('/users/new', function(req, res) {
	Group.find(function(err, groups){
    	if (err) {
    		console.error(err);
    		res.render('500');
    	}
        else {
        	res.render('admin-users-new', {
    	    	title: 'Add New User',
    	    	groups: groups
    	    });
        }
    });
});

/*
 * Groups
 * Users belong to one or more Group.
*/

/* GET group listing page. */
router.get('/groups/list', function(req, res) {
    Group.find(function(err, groups){
    	if (err) {
    		console.error(err);
    		res.render('500');
    	}
        else {
            res.render('admin-groups-list', {
                title: 'User Groups',
                groups: groups
            });
        }
    });
});

/* GET group information */
router.get('/groups/view/:name', function(req, res) {
   	Group.findOne({ name: sanitize(req.params.name) }, function(err, group){
        if (err) {
            console.error(err);
            res.render('500');
        }
    	else if (!group) {
    		res.render('404');
    	}
        else {
        	res.render('admin-groups-view', {
                title: 'View Group',
            	group: group
        	});
    	}
    });
});

/* GET new group page. */
router.get('/groups/new', function(req, res) {
    res.render('admin-groups-new', { title: 'Add New Group' });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

/* GET schedule listing page. */
router.get('/schedules/list', function(req, res) {
    Schedule.find(function(err, schedules){
        res.render('admin-schedules-list', {
            schedules: schedules
        });
    });
});

/* GET schedule information */
router.get('/schedules/view/:id', function(req, res) {
    Schedule.findById(sanitize(req.params.id), function(err, schedule){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else if (!schedule) {
            res.render('404');
        }
        else {
            User.find(function(err, users) {
                if (err) {
                    console.error(err);
                    res.render('500');
                }
                else {
                    if (!users) {
                        users = [];
                    }
                    res.render('admin-schedules-view', {
                        title: 'View Schedule',
                        schedule: schedule,
                        users: users
                    });
                }
            });
        }
    });
});

/* GET new schedule page. */
router.get('/schedules/new', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else {
            res.render('admin-schedules-new', { 
                title: 'Add New Schedule',
                users: users
            });
        }
    });
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

/* GET pledge listing page. */
router.get('/pledges/list', function(req, res) {
    Pledge.find(function(err, pledges){
        res.render('admin-pledges-list', {
            title: 'Pledges',
            pledges: pledges
        });
    });
});

/* GET pledge information */
router.get('/pledges/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else if (!pledge) {
            res.render('404');
        }
        else {
            res.render('admin-pledges-view', {
                title: 'View Pledge',
                pledge: pledge
            });
        }
    });
});

/* GET new pledge page. */
router.get('/pledges/new', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else {
            Schedule.find(function(err, schedules){
                if (err) {
                    console.error(err);
                    res.render('500');
                } 
                else {
                    res.render('admin-pledges-new', { 
                        title: 'Add New Pledge',
                        users: users,
                        schedules: schedules
                    });
                }
            })   
        }
    });
});

/*
 * Fulfilments
 * Pledges are completed by fulfilments.
*/

/* GET list fulfilments page. */
router.get('/fulfilments/list', function(req, res) {
    Fulfilment.find(function(err, fulfilments){
        res.render('admin-fulfilments-list', {
            title: 'Fulfilments',
            fulfilments: fulfilments
        });
    });
});

/* GET new fulfilment page. */
router.get('/fulfilments/new', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else {
            res.render('admin-fulfilments-new', { 
                title: 'Add New Fulfilment',
                users: users
            });  
        }
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else if (!fulfilment) {
            res.render('404');
        }
        else {
            res.render('admin-fulfilments-view', {
                title: 'View Fulfilment',
                fulfilment: fulfilment
            });
        }
    });
});

/*
 * Export the routes.
*/

module.exports = router;
