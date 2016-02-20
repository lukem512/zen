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

/* POST to add user service */
router.post('/users/new', function(req, res) {
    var user = new User({
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: sanitize(req.body.userpass),
        groups: sanitize(req.body['usergroups'])
    });
    user.save(function(err, result) {
        if (err) {
            console.error(err);
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
    User.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        email: sanitize(req.body.useremail),
        password: sanitize(req.body.userpass),
        groups: sanitize(req.body['usergroups[]'])
    }, function(err, result) {
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
    User.findOneAndRemove({
        username: sanitize(req.params.username)
    }, function(err, result){
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

/* POST to add group service */
router.post('/groups/new', function(req, res) {
    console.log('Adding a new group');
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
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
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
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
    Group.findOneAndRemove({
        name: sanitize(req.params.name)
    }, function(err, result) {
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

/* POST to add schedule service */
router.post('/schedules/new', function(req, res) {
    var schedule = new Schedule({
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    });
    schedule.save(function(err, doc) {
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
    Schedule.findByIdAndUpdate(sanitize(req.body.id), {
        title: sanitize(req.body.title),
        description: sanitize(req.body.description),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time),
        owner: sanitize(req.body.owner)
    }, function(err, result) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else if (!result) {
            res.send(404);
        }
        else {
            res.status(200).send('OK');
        }
    });
});

/* DELETE to schedule update service */
router.delete('/schedules/update/:id', function(req, res) {
    Schedule.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else if (!result) {
            res.send(404);
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

/* POST to add pledge service */
router.post('/pledges/new', function(req, res) {
    var pledge = new Pledge({
        username: sanitize(req.body.username),
        schedule: sanitize(req.body.schedule)
    });
    pledge.save(function(err, doc) {
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
    Pledge.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
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

/* POST to add fulfilment service */
router.post('/fulfilments/new', function(req, res) {
    var fulfilment = new Fulfilment({
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    })
    fulfilment.save(function(err, doc) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.redirect('/admin/fulfilments/list');
        }
    });
});

/* POST to schedule update service */
router.post('/fulfilments/update', function(req, res) {
    Fulfilment.findByIdAndUpdate(sanitize(req.body.id), {
        username: sanitize(req.body.username),
        start_time: new Date(req.body.start_time),
        end_time: new Date(req.body.end_time)
    }, function(err, result) {
        if (err) {
            console.error(err);
            res.send('There was a problem adding the information to the database.');
        }
        else {
            res.status(200).send('OK');
        }
    });
});

/* DELETE to fulfilment update service */
router.delete('/fulfilments/update/:id', function(req, res) {
    Fulfilment.findByIdAndRemove(sanitize(req.params.id), function(err, result) {
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
 * Export the routes.
*/

module.exports = router;
