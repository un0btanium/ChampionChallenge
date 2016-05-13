var express = require('express');
var router = express.Router();

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var mongodb = require('mongodb');
var db;
var championDB, versionDB, challengeDB, itemDB;
if (db == null) {
  mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
    if (err) { // ERROR DB
      throw err
    } else { // connection established
      db = database;
      championDB = db.collection('champions');
      versionDB = db.collection('versions');
      challengeDB = db.collection('challenges');
      itemDB = db.collection('items');
    }
  });
}

// INDEX
router.get('/', function(req, res, next) {
  versionDB.find().toArray( function (err, versions) {
    if (err) {
      renderError(res, "Server Error", err);
    } else {
      championDB.find().toArray(function (err, championlist) {
        if (err) {
          renderError(res, "Server Error", err);
        } else {
          itemDB.find().toArray(function (err, itemlist) {
            if (err) {
              renderError(res, "Server Error", err);
            } else {
              challengeDB.find().toArray(function (err, challengelist) {
              if (err) {
                renderError(res, "Server Error", err);
              } else {
                  var version = versions[1];
                  var championurl = version.url + version.version + "/img/champion/";
                  var itemurl = version.url + version.version + "/img/item/";
                  res.render('index', {
                    "title": 'Champion Challenge',
                    "versions": versions,
                    "champions": championlist[0].champions,
                    "challenges": challengelist[0],
                    "items": itemlist,
                    "regions": regions,
                    "championurl": championurl,
                    "itemurl": itemurl,
                    "currentDate": new Date().getTime()
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});


// POST REQUEST (SUMMONER SEARCH)
router.post('/', function(req, res){
  if(req.body != {} && req.body.summonername != null && req.body.summonername.length >= 4 && req.body.summonername.length <= 24 && req.body.region != null) {
    var name = req.body.summonername.toLowerCase().replace(/ /g, '');
    var regionNum = parseInt(req.body.region);

    res.redirect('/summoner/' + regions[regionNum] + "/" + name);
  } else {
    res.render('error', {"message": "Name required!", "error": {status: 0, stack: ""}, "challenges.ends": new Date().getTime(), "currentDate": new Date().getTime()}); // ERROR name not possible/available
  }
});

module.exports = router;
