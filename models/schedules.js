var sanitize = require('mongo-sanitize');

var groups = require('./groups');
var v = require('./validation');

/*
 * Exports
*/

module.exports.list = function(db, callback) {
	var collection = db.get('schedules');
    collection.find({}, {}, callback);
};

module.exports.get = function(db, id, callback) {
	var query = {
    	_id: sanitize(id)
    };
    var collection = db.get('schedules');
    collection.find(query,{},function(e, schedules){
    	if (!schedules || schedules.length == 0) schedules = [null];
    	callback(e, schedules[0]);
    });
};

module.exports.add = function(db, title, description, start_time, end_time, owner, callback) {
    if (!v.usernameValid(owner)) return callback("Invalid owner", null);
    if (!v.timesValid(start_time, end_time)) return callback("Invalid times", null);
    var collection = db.get('schedules');
    collection.insert({
        title: sanitize(title),
        description: sanitize(description),
        start_time: parseInt(sanitize(start_time)),
        end_time: parseInt(sanitize(end_time)),
        owner: sanitize(owner)
    }, callback);
};

module.exports.update = function(db, id, title, description, start_time, end_time, callback) {
    if (!v.timesValid(start_time, end_time)) return callback("Invalid times", null);
    var collection = db.get('schedules');
    collection.update({
        _id: sanitize(id)
    }, {
        $set: {
            title: sanitize(title),
            description: sanitize(description),
            start_time: parseInt(sanitize(start_time)),
            end_time: parseInt(sanitize(end_time))
        }
    }, callback);
};

module.exports.delete = function(db, id, callback) {
    var collection = db.get('schedules');
    collection.remove({
        _id: sanitize(id)
    }, {
        justOne: true
    }, callback);
};

module.exports.getByOwner = function(db, owner, callback) {
    var owner = sanitize(owner);
    var query = {
        owner: owner
    };
    var collection = db.get('schedules');
    collection.find(query,{},function(e, schedules){
        if (!schedules || schedules.length == 0) schedules = [];
        callback(e, schedules);
    });
};

module.exports.getByOwnerGroup = function(db, group, callback) {
    groups.members(db, group, function(e, members){
        if (e) callback(e, null);
        else {
            var query = {
                owner: { $in: members.map(function(m){
                    return m.username;
                }) }
            };
            var collection = db.get('schedules');
            collection.find(query,{},function(e, schedules){
                if (!schedules || schedules.length == 0) schedules = [];
                callback(e, schedules);
            });
        }
    })
};  

module.exports.getBetweenTimes = function(db, start_time, end_time, callback) {
    var query = {
        start_time: { $gte: parseInt(sanitize(start_time)) },
        end_time: { $lte: parseInt(sanitize(end_time)) }
    };
    var collection = db.get('schedules');
    collection.find(query,{},callback);
};

module.exports.getOverlapsTimes = function(db, start_time, end_time, callback) {
    var query = {
        $or: [
            { start_time: { $gte: parseInt(sanitize(start_time)) } },
            { end_time: { $lte: parseInt(sanitize(end_time)) } }
        ]
    };
    var collection = db.get('schedules');
    collection.find(query,{},callback);
};
