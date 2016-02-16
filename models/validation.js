var validator = require('validator');

module.exports.usernameValid = function(name) {
    if (name == "") return false;
    // TODO: does the user exist?
    return true;
};

module.exports.groupsValid = function(groups) {
    // TODO: do the groups exist?
    return true;
};

module.exports.scheduleValid = function(schedule) {
    // TODO - is the schedule real?
    return true;
};

module.exports.timesValid = function(start_time, end_time) {
    if (parseInt(start_time) >= parseInt(end_time)) return false;
    return true;
};

module.exports.emailValid = function(email) {
    return validator.isEmail(email);
};
