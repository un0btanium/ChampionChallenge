var express = require('express');
var router = express.Router();

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var mongodb = require('mongodb');
var db;
var challengeDB, championDB;

if (db == null) {
  mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
    if (err) { // ERROR DB
      throw err
    } else { // connection established
      db = database;
      challengeDB = db.collection('challenges');
      championDB = db.collection('champions');
    }
  });
}

// Update summoner (redirects to summoner afterwards)
router.get('/', function(req, res, next) {
  championDB.find().toArray( function (err, championlist) {
    if (err) {
        res.render('error', { "message": "Server Down", "error": error, "challenges": { "ends": 0} , "currentDate": 0});
    } else {
      challengeDB.find().toArray( function (err, challengelist) {
        if (err)
          res.render('error', { "message": "Server Down", "error": error, "challenges": { "ends": 0} , "currentDate": 0});
        else {
          res.render('faq', {"title": "FAQ - Champion Challenge", "challenges": challengelist[0], "currentDate": new Date().getTime(), "champions": championlist[0].champions});
        }
      });
    }
  });
});

module.exports = router;