var config = require('../../config');

var moment = require('moment');
moment.locale(config.locale);

module.exports.recentFulfilment = function(fulfilment) {

    // Is the end in the future?
    if (moment().diff(fulfilment.end_time) < 0 || fulfilment.ongoing)
        return true;

    // Was it created recently?
    if (moment().diff(fulfilment.createdAt, 'minutes') < 15)
        return true;

    return false;
};