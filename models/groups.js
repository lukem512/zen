var sanitize = require('mongo-sanitize');

var users = require('./users');

/*
 * Private methods
*/

var nameValid = function(name) {
    if (name == "") return false;
    return true;
}

/*
 * Exports
*/

module.exports.list = function(db, callback) {
	var collection = db.get('groups');
    collection.find({}, {}, callback);
};

module.exports.get = function(db, name, callback) {
    if (!nameValid(name)) {
        return callback("Invalid name", null);
    } else {
    	var query = {
        	name: sanitize(name)
        };
        var collection = db.get('groups');
        collection.find(query,{},function(e, groups){
        	if (!groups || groups.length == 0) groups = [null];
        	callback(e, groups[0]);
        });
    }
};

module.exports.add = function(db, name, description, callback) {
    module.exports.get(db, name, function(err, returnedName) {
        if (err) {
            return callback(err, null);
        }
        if (returnedName) {
            return callback("Name is not unique", null);
        }
        var collection = db.get('groups');
        collection.insert({
            name: sanitize(name),
            description: sanitize(description)
        }, callback);
    });
};

module.exports.update = function(db, id, name, description, callback) {
    if (!nameValid(name)) {
        return callback("Invalid name", null);
    } else {
        var collection = db.get('groups');
        collection.update({
            _id: sanitize(id)
        }, {
            $set: {
                name: sanitize(name),
                description: sanitize(description)
            }
        }, callback);
    }
};

module.exports.delete = function(db, name, callback) {
    if (!nameValid(name)) {
        return callback("Invalid name", null);
    } else {
        var collection = db.get('groups');
        collection.remove({
            name: sanitize(name)
        }, {
            justOne: true
        }, callback);
    }
};

module.exports.members = function(db, name, callback) {
    users.getInGroup(db, name, callback);
};
