var lolapi = require('leagueapi');
var apidata = require('./apikey/apikey.json');
lolapi.init(apidata.apikey, apidata.region);
lolapi.setRateLimit(apidata.rateLimitPer10s, apidata.rateLimitPer10min);

var challenges;
var champs;
var champCount;

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var countForLoop = 0;
var countAPICalls = 0;

var callInterval = Math.ceil(10/apidata.rateLimitPer10s)*10;

var mongodb = require('mongodb');
var db;
var summonerDB, challengeDB;
if (db == null) {
	mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
		if (err) { // ERROR DB
			throw err
		} else { // connection established
			db = database;
			summonerDB = db.collection('summoners');
			challengeDB = db.collection('challenges');
			console.log(summonerDB.count());
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
	summonerDB.find({},{"_id": 1, "id": 1, "region": 1, "challenge.current.start": 1}).snapshot().forEach( function (summoner) {
		console.log("Loop: " + countForLoop++ + " - " + summoner.id);
		setTimeout(function(){updateSummonerData(summoner);}, callInterval*countForLoop);
	});
}





function updateSummonerData(summoner) {
	console.log("Call start: " + countAPICalls);
	if (summoner.challenge.current.start[0] != -1) {
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
						currentPoints[index] = championMastery.championPoints - summoner.challenge.current.start[index];
						i++;
					}
				});
				summonerDB.update({"_id": summoner._id}, { $set: { "challenge.current.points": currentPoints }});
			}
		});
	} else {
		console.log("Call: " + countAPICalls++ + " (skipped)");
	}
}
