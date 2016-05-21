var express = require('express');
var router = express.Router();

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var leaderboardUpdated = 0;
var leaderboard = [[],[],[],[],[]];

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
      summonerDB = db.collection('summoners');
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
                  var currentDate = new Date().getTime()
                  var version = versions[1];
                  var championurl = version.url + version.version + "/img/champion/";
                  var itemurl = version.url + version.version + "/img/item/";
                  if (currentDate > leaderboardUpdated) {
                    leaderboardUpdated = currentDate + 900000; /* update every 15 minutes */
                    summonerDB.find({"challenge.current.points.0": {$ne: 0}}).sort({"challenge.current.points.0": -1}).limit(10).toArray(function (err, leader1) {
                      summonerDB.find({"challenge.current.points.1": {$ne: 0}}).sort({"challenge.current.points.1": -1}).limit(10).toArray(function (err2, leader2) {
                        summonerDB.find({"challenge.current.points.2": {$ne: 0}}).sort({"challenge.current.points.2": -1}).limit(10).toArray(function (err3, leader3) {
                          summonerDB.find({"challenge.current.points.3": {$ne: 0}}).sort({"challenge.current.points.3": -1}).limit(10).toArray(function (err4, leader4) {
                            summonerDB.find({"challenge.current.points.4": {$ne: 0}}).sort({"challenge.current.points.4": -1}).limit(10).toArray(function (err5, leader5) {
                              if (err || err2 || err3 || err4 || err5) {
                                console.log(err + "\n" + err2 + "\n" + err3 + "\n" + err4 + "\n" + err5);
                              } else {
                                leaderboard = [leader1, leader2, leader3, leader4, leader5];
                              }
                              res.render('index', {
                                "title": 'Champion Challenge',
                                "versions": versions,
                                "champions": championlist[0].champions,
                                "challenges": challengelist[0],
                                "items": itemlist,
                                "regions": regions,
                                "championurl": championurl,
                                "itemurl": itemurl,
                                "currentDate": currentDate,
                                "leaderboard": leaderboard
                              });
                            });
                          });
                        });
                      });
                    });
                  } else {
                    res.render('index', {
                    "title": 'Champion Challenge',
                    "versions": versions,
                    "champions": championlist[0].champions,
                    "challenges": challengelist[0],
                    "items": itemlist,
                    "regions": regions,
                    "championurl": championurl,
                    "itemurl": itemurl,
                    "currentDate": currentDate,
                    "leaderboard": leaderboard
                  });
                  }
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
    res.render('error', {"message": "Name required!", "error": {status: 0, stack: ""}, "challenges": { "ends":0}, "currentDate": 0}); // ERROR name not possible/available
  }
});

module.exports = router;
