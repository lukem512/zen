
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
          user: req.user
        });
    },
    notfound: function(req, res) {
        return res.status(404).render('404', {
          title: 'Error 404',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          dictionary: config.dictionary,
          user: req.user
        });
    },
    server: function(req, res, err) {
        console.error(err);
        return res.status(404).render('500', {
          title: 'Error 500',
          name: config.name,
          organisation: config.organisation,
          nav: config.nav(),
          dictionary: config.dictionary,
          user: req.user
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
    notfound: function(res) {
        res.status(404).json({error: 'Resource not found'});
    },
    server: function(res, err) {
        console.error(err);
        res.status(500).json({error: 'Server error'});
    }
};
