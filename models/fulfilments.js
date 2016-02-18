var sanitize = require('mongo-sanitize');

var pledges = require('./pledges');
var schedules = require('./schedules');
var v = require('./validation');

/*
 * Exports
*/

var FULL = module.exports.FULL = "full";
var PARTIAL = module.exports.PARTIAL = "partial";

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
        start_time: parseInt(sanitize(start_time)),
        end_time: parseInt(sanitize(end_time))
    }, callback);
};

module.exports.update = function(db, id, start_time, end_time, callback) {
    if (!v.timesValid(start_time, end_time)) return callback("Invalid times", null);
    var collection = db.get('fulfilments');
    collection.update({
        _id: sanitize(id)
    }, {
        $set: {
            start_time: parseInt(sanitize(start_time)),
            end_time: parseInt(sanitize(end_time))
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

module.exports.completes = function(db, id, callback) {
    module.exports.get(db, id, function(e, fulfilment){
        if (e || !fulfilment) return callback(e, null);
        schedules.getOverlapsTimes(db, fulfilment.start_time, fulfilment.end_time, function(e, ss){
            if (e || !ss) return callback(e, null);
            ss.forEach(function(s){
                if (s.start_time < fulfilment.start_time || s.end_time > fulfilment.end_time) {
                    s["completion"] = FULL;
                }
                else {
                    s["completion"] = PARTIAL;
                }
            });
            pledges.getByScheduleArray(db, ss.map(function(m){
                return m._id;
            }), function(e, ps){
                if (e || !ps) return callback(e, null); 
                ps.forEach(function(p){
                    // Ick!
                    p["completion"] = "incomplete";
                    ss.forEach(function(s){
                        if(s._id == p.schedule) {
                            p.completion = s.completion;
                        }
                    })
                })
                callback(e, ps);
            });
        })
    });
};
