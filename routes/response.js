
var config = require('../config');

/*
 * Response functions.
*/

module.exports.error = {
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
