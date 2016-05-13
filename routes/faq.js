var express = require('express');
var router = express.Router();

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var mongodb = require('mongodb');
var challenges;

mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
if (err) { // ERROR DB
  throw err
} else { // connection established
  var db = database;
  var challengeDB = db.collection('challenges');
  challengeDB.find().toArray( function (err, challengelist) {
  	if (err)
  		throw err
  	else {
  		challenges = challengelist[0];
  		db.close();
  	}
  });
}
});

// Update summoner (redirects to summoner afterwards)
router.get('/', function(req, res, next) {
	res.render('faq', {"title": "FAQ - Champion Challenge", "challenges": challenges, "currentDate": new Date().getTime()});
});

module.exports = router;