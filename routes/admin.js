var express = require('express');
var sanitize = require('mongo-sanitize');
var router = express.Router();

var users = require('../models/users');
var groups = require('../models/groups');
var schedules = require('../models/schedules');
// var pledges = require('../models/pledges');
// var fulfilments = require('../models/fulfilments');

/*
 * Users.
 * Users within the system.
*/

/* GET user listing page. */
router.get('/users/list', function(req, res) {
    users.list(req.db, function(err, users){
        if (err) {
            console.error(err);
            return res.render('500');
        } else {
            return res.render('admin-users-list', {
                users: users
            });
        }
    });
});

/* GET user information */
router.get('/users/view/:username', function(req, res) {
    groups.list(req. db, function(err, groups){
    	if (err) {
    		console.error(err);
    		return res.render('500');
    	}
        users.get(req.db, req.params.username, function(err, user){
            if (err) {
                console.error(err);
                return res.render('500');
            } else {
                if (!user) {
                    res.render('404');
                } else {
                    res.render('admin-users-view', {
                        user: user,
                        groups: groups
                    });
                }
            }
        });
    });
});

/* GET new user page. */
router.get('/users/new', function(req, res) {
	groups.list(db, function(err, groups){
    	if (err) {
    		console.error(err);
    		return res.render('500');
    	}
    	res.render('admin-users-new', {
	    	title: 'Add New User',
	    	groups: groups
	    });
    });
});

/* POST to add user service */
router.post('/users/new', function(req, res) {
    users.add(req.db, req.body.username, req.body.useremail, req.body.userpass, req.body.usergroups,
        function(err, result) {
            if (err) {
                res.send('There was a problem adding the information to the database.');
            }
            else {
                res.redirect('/admin/users/list');
            }
        });
});

/* GET to user update service */
router.get('/users/update', function(req, res) {
	res.redirect('/admin/users/view/' + req.body.username);
});

/* POST to user update service */
router.post('/users/update', function(req, res) {
	users.update(req.db, req.body.id, req.body.username, req.body.useremail, req.body.userpass, req.body.usergroups,
        function(err, result) {
            if (err) {
                console.error(err);
                res.send('There was a problem adding the information to the database.');
            }
            else {
                res.status(200).send('OK');
            }
        });
});

/* DELETE to user update service */
router.delete('/users/update/:username', function(req, res) {
    users.delete(req.db, req.params.username, function(err, result) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.status(200).send('OK');
        }
    });
});

/*
 * Groups
 * Users belong to one or more groups.
*/

/* GET group listing page. */
router.get('/groups/list', function(req, res) {
    var db = req.db;
    groups.list(db, function(err, groups){
    	if (err) {
    		console.error(err);
    		return res.render('500');
    	}
        res.render('admin-groups-list', {
            groups: groups
        });
    });
});

/* GET group information */
router.get('/groups/view/:name', function(req, res) {
   	groups.get(req.db, req.params.name, function(err, group){
    	if (!group) {
    		res.render('404');
    	} else {
        	res.render('admin-groups-view', {
            	group: group
        	});
    	}
    });
});

/* GET new group page. */
router.get('/groups/new', function(req, res) {
    res.render('admin-groups-new', { title: 'Add New Group' });
});

/* POST to add group service */
router.post('/groups/new', function(req, res) {
    groups.add(req.db, req.body.name, req.body.description, function(err, doc) {
        if (err) {
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.redirect('/admin/groups/list');
        }
    });
});

/* GET to group update service */
router.get('/groups/update/:name', function(req, res) {
	res.redirect('/admin/groups/view/' + req.params.name);
});

/* POST to group update service */
router.post('/groups/update', function(req, res) {
	groups.update(req.db, req.body.id, req.body.name, req.body.description, function(err, result) {
		if (err) {
			console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
        	res.status(200).send('OK');
        }
	});
});

/* DELETE to group update service */
router.delete('/groups/update/:name', function(req, res) {
	groups.delete(req.db, req.params.name, function(err, result) {
		if (err) {
			console.error(err);
            res.send('There was a problem adding the information to the database.');
		}
        else {
        	res.status(200).send('OK');
        }
	});
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

/* GET schedule listing page. */
router.get('/schedules/list', function(req, res) {
    schedules.list(req.db, function(err, schedules){
        res.render('admin-schedules-list', {
            schedules: schedules
        });
    });
});

/* GET schedule information */
router.get('/schedules/view/:id', function(req, res) {
    schedules.get(req.db, req.params.id, function(err, schedule){
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else if (!schedule) {
            return res.render('404');
        }
        else {
            res.render('admin-schedules-list', {
                schedule: schedule
            });
        }
    });
});

// TODO: new, update, delete

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

// TODO

/*
 * Fulfilments
 * Pledges are fulfilled with fulfilments.
*/

// TODO

/*
 * Export the routes.
*/

module.exports = router;
