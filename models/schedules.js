var sanitize = require('mongo-sanitize');

/*
 * Private methods
*/

var ownerValid = function(owner) {
    // TODO - is the owner real?
    return true;
}

var timesValid = function(start_time, end_time) {
    if (start_time >= end_time) return false;
    return true;
}

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
    if (!ownerValid)                        return callback("Invalid owner", null);
    if (!timesValid(start_time, end_time))  return callback("Invalid times", null);
    var collection = db.get('schedules');
    collection.insert({
        title: sanitize(title),
        description: sanitize(description),
        start_time: sanitize(start_time),
        end_time: sanitize(end_time),
        owner: sanitize(owner)
    }, callback);
};

module.exports.update = function(db, id, title, description, start_time, end_time, callback) {
    if (!timesValid(start_time, end_time))  return callback("Invalid times", null);
    var collection = db.get('schedules');
    collection.update({
        _id: sanitize(id)
    }, {
        $set: {
            title: sanitize(name),
            description: sanitize(description),
            start_time: sanitize(start_time),
            end_time: sanitize(end_time)
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
