var sanitize = require('mongo-sanitize');

var v = require('./validation');

/*
 * Exports
*/

module.exports.list = function(db, callback) {
	var collection = db.get('fulfilments');
    collection.find({}, {}, callback);
};

module.exports.get = function(db, id, callback) {
	var query = {
    	_id: sanitize(id)
    };
    var collection = db.get('fulfilments');
    collection.find(query,{},function(e, fulfilments){
    	if (!fulfilments || fulfilments.length == 0) fulfilments = [null];
    	callback(e, fulfilments[0]);
    });
};

module.exports.add = function(db, username, start_time, end_time, callback) {
    if (!v.usernameValid(username)) return callback("Invalid username", null);
    if (!v.timesValid(start_time, end_time)) return callback("Invalid times", null);
    var collection = db.get('fulfilments');
    collection.insert({
        username: sanitize(username),
        start_time: sanitize(start_time),
        end_time: sanitize(end_time)
    }, callback);
};

module.exports.update = function(db, id, start_time, end_time, callback) {
    if (!v.timesValid(start_time, end_time)) return callback("Invalid times", null);
    var collection = db.get('fulfilments');
    collection.update({
        _id: sanitize(id)
    }, {
        $set: {
            start_time: sanitize(start_time),
            end_time: sanitize(end_time)
        }
    }, callback);
};

module.exports.delete = function(db, id, callback) {
    var collection = db.get('fulfilments');
    collection.remove({
        _id: sanitize(id)
    }, {
        justOne: true
    }, callback);
};
