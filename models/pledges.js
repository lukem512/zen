var sanitize = require('mongo-sanitize');

/*
 * Private methods
*/

var usernameValid = function(owner) {
    // TODO - is the owner real?
    return true;
}

var scheduleValid = function(schedule) {
    // TODO - is the schedule real?
    return true;
}

/*
 * Exports
*/

module.exports.list = function(db, callback) {
	var collection = db.get('pledges');
    collection.find({}, {}, callback);
};

module.exports.get = function(db, id, callback) {
	var query = {
    	_id: sanitize(id)
    };
    var collection = db.get('pledges');
    collection.find(query,{},function(e, pledges){
    	if (!pledges || pledges.length == 0) pledges = [null];
    	callback(e, pledges[0]);
    });
};

module.exports.add = function(db, username, schedule, callback) {
    if (!usernameValid(username)) return callback("Invalid username", null);
    if (!scheduleValid(schedule)) return callback("Invalid schedule", null);
    var collection = db.get('pledges');
    collection.insert({
        username: sanitize(username),
        schedule: sanitize(schedule)
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
