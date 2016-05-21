var challenges;
var champs;
var champCount;

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var apidata = require('./apikey/apikey.json');
var lolapi = require('leagueapi');
lolapi.init(apidata.apikey, apidata.region);
lolapi.setRateLimit(apidata.rateLimitPer10s, apidata.rateLimitPer10min);

var countForLoop = 0;
var countAPICalls = 0;

var callInterval = Math.ceil(10/apidata.rateLimitPer10s)*10;

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
      challengeDB.find().toArray(function (err, result) {
		if (err)
			throw err
		challenges = result[0];
		champs = challenges.champions.current;
		champCount = champs.length;
		main();
	  });
    }
  });
}

function main() {
	summonerDB.find({"challenge.current.start.0": -1}).limit(5000).snapshot().forEach( function (err, summoner) {
		console.log("Loop: " + countForLoop++ + " - " + summoner.id);
		setTimeout(function(){enterSummoner(summoner);}, callInterval*countForLoop);
	});
}

function enterSummoner(summoner) {
	console.log("Call start: " + countAPICalls);
	lolapi.ChampionMastery.getChampions(summoner.id, regions[summoner.region], function (err, championMasteries) {
		console.log("Call end: " + countAPICalls++);
		if (err) {
			console.log("ERROR: " + summoner.id);
			console.log(err);
		} else {
			var currentPoints = [0,0,0,0,0];
			var i = 0;
			championMasteries.forEach(function (championMastery, index, array) {
				if (i >= champCount)
					return;
				var index = champs.indexOf(championMastery.championId);
				if ( index >= 0) {
					currentPoints[index] = championMastery.championPoints;
					i++;
				}
			});
			summonerDB.update({"_id": summoner._id}, { $set: { "challenge.current.start": currentPoints }});
		}
	});
}
