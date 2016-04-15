
var config = require('../config');

/*
 * Response functions.
*/

module.exports.error = {
    prohibited: function(req, res) {
        return res.status(404).render('403', {
          title: 'Error 403',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          dictionary: config.dictionary,
          user: req.user,
          locale: config.locale
        });
    },
    deleted: function(req, res) {
        return res.status(404).render('deleted', {
          title: 'Resource Deleted',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          dictionary: config.dictionary,
          user: req.user,
          locale: config.locale
        });
    },
    notfound: function(req, res) {
        return res.status(404).render('404', {
          title: 'Error 404',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          dictionary: config.dictionary,
          user: req.user,
          locale: config.locale
        });
    },
    server: function(req, res, err) {
        console.error('Internal server error',err);
        return res.status(404).render('500', {
          title: 'Error 500',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          dictionary: config.dictionary,
          user: req.user,
          locale: config.locale
      });
    }
};

module.exports.JSON = {
    ok: function(res) {
        res.json({message: 'OK'});
    },
    invalid: function(res) {
        res.json({message: 'Invalid'});
    }
};

module.exports.JSON.error = {
    prohibited: function(res) {
        res.status(403).json({error: 'Not authorised'});
    },
    notfound: function(res) {
        res.status(404).json({error: 'Resource not found'});
    },
    server: function(res, err) {
        console.error('Internal server error',err);
        res.status(500).json({error: 'Server error'});
    }
};

/*
 * Response strings.
*/

module.exports.strings = {
    pastScheduleError: 'Cannot delete past schedules',
    notAuthorisedError: 'Not authorised',
    notFoundError: 'Not found'
};
