var express = require('express');
var router = express.Router();

var sanitize = require('mongo-sanitize');

var User = require('../../models/users');
var Group = require('../../models/groups');
var Schedule = require('../../models/schedules');
var Pledge = require('../../models/pledges');
var Fulfilment = require('../../models/fulfilments');

var response = require('../response');
var m = require('../middlewares');

/*
 * Groups
 * Users belong to one or more groups.
*/

router.get('/list', m.isAdmin, function(req, res) {
    Group.find(function(err, groups){
        if (err) return response.JSON.error.server(res, err);
        res.json(groups);
    });
});

router.get('/view/:name', m.isAdmin, function(req, res) {
    Group.find({ name: sanitize(req.params.name) }, function(err, group){
        if (err) return response.JSON.error.server(res, err);
        if (!group) return response.JSON.error.notfound(res);
        res.json(group);
    });
});

router.get('/view/:name/members', m.isAdmin, function(req, res) {
    Group.members(sanitize(req.params.name), function(err, users){
        if (err) return response.JSON.error.server(res, err);
        res.json(users);
    });
});

router.post('/new', m.isAdmin, function(req, res) {
    var group = new Group({
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    });
    group.save(function(err, doc) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.post('/update', m.isAdmin, function(req, res) {
    Group.findByIdAndUpdate(sanitize(req.body.id), {
        name: sanitize(req.body.name),
        description: sanitize(req.body.description)
    }, function(err, result) {
        if (err) return response.JSON.error.server(res, err);
        response.JSON.ok(res);
    });
});

router.delete('/update/:name', m.isAdmin, function(req, res) {
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
 * Export the routes.
*/

module.exports = router;
