var express = require('express');
var router = express.Router();

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];


// ROUTER

// Update summoner (redirects to summoner afterwards)
router.get('/', function(req, res, next) {
	res.render('faq', {"title": "FAQ - Champion Challenge"});
});

module.exports = router;