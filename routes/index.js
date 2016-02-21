var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Zen' });
});

/* GET authentication page */
router.get('/auth', function(req, res, next) {
  res.render('authenticate', { title: 'Sign in' });
});

module.exports = router;
