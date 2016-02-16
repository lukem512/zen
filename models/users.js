var sanitize = require('mongo-sanitize');
var validator = require('validator');

/*
 * Private methods
*/

var usernameValid = function(name) {
    if (name == "") return false;
    // TODO: is the username unique?
    return true;
}

var emailValid = function(email) {
    return validator.isEmail(email);
}

var groupsValid = function(groups) {
    // TODO: do the groups exist?
    return true;
}

/*
 * Exports
*/

module.exports.list = function(db, callback) {
	var collection = db.get('users');
    collection.find({}, {}, callback);
};

module.exports.get = function(db, username, callback) {
    if (!usernameValid(username)) return callback("Invalid username", null);
	var query = {
    	username: sanitize(username)
    };
    var collection = db.get('users');
    collection.find(query,{},function(e, users){
    	if (!users || users.length == 0) users = [null];
    	callback(e, users[0]);
    });
};

module.exports.add = function(db, username, email, hash, groups, callback) {
    if (!usernameValid(username)) return callback("Invalid username", null);
    if (!emailValid(email)) return callback("Invalid email", null);
    if (!groupsValid(groups)) return callback("Invalid groups", null);
    if (module.exports.get(db, username, function(err, returnedName) {
        if (err) {
            return callback(err, null);
        }
        if (returnedName) {
            return callback("Username is not unique", null);
        }
        var collection = db.get('users');
        collection.insert({
            username: sanitize(username),
            email: sanitize(email),
            password: hash,
            groups: sanitize(groups)
        }, callback);
    }));
};

module.exports.update = function(db, id, username, email, hash, groups, callback) {
    if (!usernameValid(username)) return callback("Invalid username", null);
    if (!emailValid(email)) return callback("Invalid email", null);
    if (!groupsValid(groups)) return callback("Invalid groups", null);
    if (module.exports.get(db, username, function(err, returnedName) {
        if (err) {
            return callback(err, null);
        }
        if (returnedName && returnedName.id != id) {
            return callback("Username is not unique", null);
        }
        var collection = db.get('users');
        collection.update({
            _id: sanitize(id)
        }, {
            $set: {
                username: sanitize(username),
                email: sanitize(email),
                password: hash,
                groups: sanitize(groups)
            }
        }, callback);
    }));
};

module.exports.delete = function(db, username, callback) {
    if (!usernameValid(username)) return callback("Invalid username", null);
    var collection = db.get('users');
    collection.remove({
        username: sanitize(username)
    }, {
        justOne: true
    }, callback);
};

// TODO: DOESN'T WORK.
module.exports.getInGroup = function(db, group, callback) {
    var query = {
        groups: sanitize(group)
    };
    var collection = db.get('users');
    collection.find(query,{},function(e, users){
        if (!users || users.length == 0) users = [];
        callback(e, users);
    });
};
