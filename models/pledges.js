var sanitize = require('mongo-sanitize');

var v = require('./validation');

/*
 * Exports
*/

module.exports.list = function(db, callback) {
	var collection = db.get('pledges');
    collection.find({}, {}, callback);
};

module.exports.getAll = function(db, id, callback) {
	var query = {
    	_id: sanitize(id)
    };
    var collection = db.get('pledges');
    collection.find(query,{},function(e, pledges){
    	if (!pledges || pledges.length == 0) pledges = [null];
    	callback(e, pledges);
    });
};

module.exports.get = function(db, id, callback) {
    module.exports.getAll(db, id, function(e, pledges){
        callback(e, pledges[0]);
    })
};

module.exports.add = function(db, username, schedule, callback) {
    if (!v.usernameValid(username)) return callback("Invalid username", null);
    if (!v.scheduleValid(schedule)) return callback("Invalid schedule", null);
    var collection = db.get('pledges');
    collection.insert({
        username: sanitize(username).toString(),
        schedule: sanitize(schedule).toString()
    }, callback);
};

module.exports.delete = function(db, id, callback) {
    var collection = db.get('pledges');
    collection.remove({
        _id: sanitize(id)
    }, {
        justOne: true
    }, callback);
};

module.exports.getBySchedule = function(db, schedule, callback) {
    var query = {
        schedule: sanitize(schedule).toString()
    };
    var collection = db.get('pledges');
    collection.find(query,{},function(e, pledges){
        if (!pledges || pledges.length == 0) pledges = [];
        callback(e, pledges);
    });
};

module.exports.getByScheduleArray = function(db, schedules, callback) {
    var query = {
        schedule: { $in: sanitize(schedules.map(function(s){
            return s.toString();
        })) }
    };
    var collection = db.get('pledges');
    collection.find(query,{},function(e, pledges){
        if (!pledges || pledges.length == 0) pledges = [];
        callback(e, pledges);
    });
};

// TODO: test
module.exports.getByUsername = function(db, username, callback) {
    var query = {
        username: sanitize(username).toString()
    };
    var collection = db.get('pledges');
    collection.find(query,{},function(e, pledges){
        if (!pledges || pledges.length == 0) pledges = [];
        callback(e, pledges);
    });
};
