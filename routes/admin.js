var express = require('express');
var router = express.Router();

var users = require('../models/users');
var groups = require('../models/groups');
var schedules = require('../models/schedules');
var pledges = require('../models/pledges');
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
    groups.list(req. db, function(err, groups){
    	if (err) {
    		console.error(err);
    		res.send('There was a problem adding the information to the database.');
    	}
        users.get(req.db, req.params.username, function(err, user){
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
	groups.list(req.db, function(err, groups){
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
   	groups.get(req.db, req.params.name, function(err, group){
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
            res.render('500');
        }
        else if (!schedule) {
            res.render('404');
        }
        else {
            users.list(req.db, function(err, users) {
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
    users.list(req.db, function(err, users){
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

/* POST to add schedule service */
router.post('/schedules/new', function(req, res) {
    schedules.add(req.db, req.body.title, req.body.description, req.body.start_time,
        req.body.end_time, req.body.owner, function(err, doc) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.redirect('/admin/schedules/list');
        }
    });
});

/* POST to schedule update service */
router.post('/schedules/update', function(req, res) {
    schedules.update(req.db, req.body.id, req.body.title, req.body.description, req.body.start_time,
        req.body.end_time, function(err, result) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.status(200).send('OK');
        }
    });
});

/* DELETE to schedule update service */
router.delete('/schedules/update/:id', function(req, res) {
    schedules.delete(req.db, req.params.id, function(err, result) {
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
 * Pledges
 * Users can pledge to join a schedule.
*/

/* GET pledge listing page. */
router.get('/pledges/list', function(req, res) {
    pledges.list(req.db, function(err, pledges){
        res.render('admin-pledges-list', {
            title: 'Pledges',
            pledges: pledges
        });
    });
});

/* GET pledge information */
router.get('/pledges/view/:id', function(req, res) {
    pledges.get(req.db, req.params.id, function(err, pledge){
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
    users.list(req.db, function(err, users){
        if (err) {
            console.error(err);
            res.render('500');
        }
        else {
            schedules.list(req.db, function(err, schedules){
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

/* POST to add pledge service */
router.post('/pledges/new', function(req, res) {
    pledges.add(req.db, req.body.username, req.body.schedule, function(err, doc) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.redirect('/admin/pledges/list');
        }
    });
});

/* DELETE to pledge update service */
router.delete('/pledges/update/:id', function(req, res) {
    pledges.delete(req.db, req.params.id, function(err, result) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.status(200).send('OK');
        }
    });
});

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
