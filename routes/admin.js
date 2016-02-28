var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');
var moment = require('moment');

var User = require('../models/users');
var Group = require('../models/groups');
var Schedule = require('../models/schedules');
var Pledge = require('../models/pledges');
var Fulfilment = require('../models/fulfilments');

var config = require('../config');

router.get('/', function(req, res) {
    res.render('admin/index', {
        title: 'Control panel',
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        user: req.user
    });
});

// Generic list template
var listModel = function(req, res, params) {
    params.model.find(function(err, objs){
        if (err) {
            console.error(err);
            res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else {
            res.render('admin/list', {
                title: params.title,
                objects: objs,
                keys: {
                    model: params.keys.model,
                    route: params.keys.route || '/admin/' + params.keys.model,
                    link: {
                        id: (params.keys.link) ? (params.keys.link.id || '_id') : '_id',
                        text: (params.keys.link) ? (params.keys.link.text || '_id') : '_id'
                    }
                },
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
    })
};

/*
 * Users.
 * Users within the system.
*/

/* GET user listing page. */
router.get('/users/list', function(req, res) {
    listModel(req, res, {
        model: User,
        title: 'Users',
        keys: {
            model: 'users',
            link: {
                id: 'username',
                text: 'username'
            }
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
                res.render('500', {
                    title: 'Error 500',
                    name: config.name,
                    organisation: config.organisation,
                    nav: config.nav(),
                    user: req.user
                });
            }
            else if (!user) {
                res.render('404', {
                    title: 'Error 404',
                    name: config.name,
                    organisation: config.organisation,
                    nav: config.nav(),
                    user: req.user
                });
            }
            else {
                res.render('admin/users/view', {
                    title: 'View User',
                    _user: user,
                    groups: groups,
                    name: config.name,
                    organisation: config.organisation,
                    nav: config.nav(),
                    user: req.user
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
    		res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
    	}
        else {
        	res.render('admin/users/new', {
    	    	title: 'Add New User',
    	    	groups: groups,
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
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
    listModel(req, res, {
        model: Group,
        title: 'User Groups',
        keys: {
            model: 'groups',
            link: {
                id: 'name',
                text: 'name'
            }
        } 
    });
});

/* GET group information */
router.get('/groups/view/:name', function(req, res) {
   	Group.findOne({ name: sanitize(req.params.name) }, function(err, group){
        if (err) {
            console.error(err);
            res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
    	else if (!group) {
    		res.render('404', {
                title: 'Error 404',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
    	}
        else {
        	res.render('admin/groups/view', {
                title: 'View Group',
            	group: group,
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
        	});
    	}
    });
});

/* GET new group page. */
router.get('/groups/new', function(req, res) {
    res.render('admin/groups/new', {
        title: 'Add New Group',
        name: config.name,
        organisation: config.organisation,
        nav: config.nav(),
        user: req.user
    });
});

/*
 * Schedules
 * Users can create schedules, visible to their group.
*/

/* GET schedules listing page. */
router.get('/schedules/list', function(req, res) {
    listModel(req, res, {
        model: Schedule,
        title: 'Schedules',
        keys: {
            model: 'schedules',
            route: '/schedules',
            link: {
                text: 'title'
            }
        } 
    });
});

/*
 * Pledges
 * Users can pledge to join a schedule.
*/

/* GET pledge listing page. */
router.get('/pledges/list', function(req, res) {
    listModel(req, res, {
        model: Pledge,
        title: 'Pledges',
        keys: {
            model: 'pledges',
        } 
    });
});

/* GET pledge information */
router.get('/pledges/view/:id', function(req, res) {
    Pledge.findById(sanitize(req.params.id), function(err, pledge){
        if (err) {
            console.error(err);
            res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else if (!pledge) {
            res.render('404', {
                title: 'Error 404',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else {
            res.render('admin/pledges/view', {
                title: 'View Pledge',
                pledge: pledge,
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
    });
});

/* GET new pledge page. */
router.get('/pledges/new', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else {
            Schedule.find(function(err, schedules){
                if (err) {
                    console.error(err);
                    res.render('500', {
                        title: 'Error 500',
                        name: config.name,
                        organisation: config.organisation,
                        nav: config.nav(),
                        user: req.user
                    });
                } 
                else {
                    res.render('admin/pledges/new', { 
                        title: 'Add New Pledge',
                        users: users,
                        schedules: schedules,
                        name: config.name,
                        organisation: config.organisation,
                        nav: config.nav(),
                        user: req.user
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
    listModel(req, res, {
        model: Fulfilment,
        title: 'Fulfilments',
        keys: {
            model: 'fulfilments',
        } 
    });
});

/* GET new fulfilment page. */
router.get('/fulfilments/new', function(req, res) {
    User.find(function(err, users){
        if (err) {
            console.error(err);
            res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else {
            res.render('admin/fulfilments/new', { 
                title: 'Add New Fulfilment',
                users: users,
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });  
        }
    });
});

/* GET fulfilment information */
router.get('/fulfilments/view/:id', function(req, res) {
    Fulfilment.findById(sanitize(req.params.id), function(err, fulfilment){
        if (err) {
            console.error(err);
            res.render('500', {
                title: 'Error 500',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else if (!fulfilment) {
            res.render('404', {
                title: 'Error 404',
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
        else {
            res.render('admin/fulfilments/view', {
                title: 'View Fulfilment',
                fulfilment: fulfilment,
                name: config.name,
                organisation: config.organisation,
                nav: config.nav(),
                user: req.user
            });
        }
    });
});

/*
 * Export the routes.
*/

module.exports = router;
