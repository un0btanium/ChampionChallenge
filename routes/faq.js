var express = require('express');
var router = express.Router();

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var mongodb = require('mongodb');
var db;
var challengeDB;

if (db == null)
  mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
    if (err) { // ERROR DB
      throw err
    } else { // connection established
      db = database;
      challengeDB = db.collection('challenges');
    }
  });
}

// Update summoner (redirects to summoner afterwards)
router.get('/', function(req, res, next) {
  challengeDB.find().toArray( function (err, challengelist) {
    if (err)
      res.render('error', { "message": "Server Down", "error": error, "challenges.ends": new Date().getTime() , "currentDate": new Date().getTime()});
    else {
      res.render('faq', {"title": "FAQ - Champion Challenge", "challenges": challengelist[0], "currentDate": new Date().getTime()});
    }
  });
});

module.exports = router;