var lolapi = require('leagueapi');
var apidata = require('./apikey/apikey.json');

var champs;
var champCount;

lolapi.init(apidata.apikey, apidata.region);
lolapi.setRateLimit(apidata.rateLimitPer10s, apidata.rateLimitPer10min);

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var startSummonerID = 20875607;
var allIDs = new Array();
var count = 0;

var mongodb = require('mongodb');
var db;
var summonerDB, challengeDB;
if (db == null) {
	mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
		if (err) { // ERROR DB
			throw err
		} else { // connection established
			db = database;
			challengeDB = db.collection('challenges');
			summonerDB = db.collection('summoners');
			challengeDB.find().toArray(function (err, list) {
				if (err) {
					db.close();
					throw err
				} else {
					var challenges = list[0];
					champs = challenges.champions.current;
					champCount = champs.length;
					getSummoners(startSummonerID, 'euw');
				}
			});
		}
	});
}





function getSummoners(id, region) {
	console.log(id);
	lolapi.getRecentGames(id, region, function(err, result) {
		if (err) {
			console.log(err);
		} else if (result.length) {
			var summonerIDs = new Array();
			for (var i = 0; i < result.length; i++) {
				if (result[i].fellowPlayers != null) {
					for (var j = 0; j < result[i].fellowPlayers.length; j++) {
						var summonerID = result[i].fellowPlayers[j].summonerId;
						if (allIDs.indexOf(summonerID) == -1 && summonerID != id) {
							summonerIDs.push(summonerID);
							allIDs.push(summonerID);
							console.log(summonerID);
							if (summonerIDs.length >= 40) {
								retrieveSummonerData(summonerIDs, region);
								summonerIDs = new Array();
							}
						}
					}
				}
			}
			if (summonerIDs.length > 0)
				retrieveSummonerData(summonerIDs, region);
			if (count <= 20) {
				var newID = allIDs[Math.floor(Math.random() * allIDs.length)];
				console.log("NEW SUMMONER SELECTED. PLEASE WAIT: "+(count++) + " - " + newID);
				setTimeout(function() { getSummoners(newID, region) }, 5000);
			} else {
				setTimeout(function() {
					console.log("FINISHED");
					db.close();
				}, 5000);
			}
		}
	});
}

function retrieveSummonerData(summonerIDs, region) {
	lolapi.Summoner.getByID(summonerIDs.join(','), region, function (err, result) {
		if(err)
			console.log(err);
		else {
			var regionNum = regions.indexOf(region);
			summonerIDs.forEach(function (summonerID, index, array) {
				var summoner = result[summonerID];
				summonerDB.find({"id": summoner.id, "region": regionNum}).toArray( function (err, summonerEntry) {
					if (err)
 						console.log(err);
 					else if (summonerEntry.length) {
 						console.log(summoner.id + "skipped");
 						// SUMMONER EXISTS already (no updates)
 					} else {
 						lolapi.ChampionMastery.getChampions(summoner.id, region, function (err2, championMasteries) {
 							if (err2)
 								console.log(err2);
 							else {
 								var currentPoints = [0,0,0,0,0];
								var i = 0;
								championMasteries.forEach(function (championMastery, index, array) {
									if (i < champCount) {
										var indexChampion = champs.indexOf(championMastery.championId);
										if ( indexChampion >= 0) {
											currentPoints[indexChampion] = championMastery.championPoints;
											i++;
										}
									}
								});
		 						var entry = {
		 							"namel": summoner.name.toLowerCase().replace(/ /g, ''),
					 				"name": summoner.name,
					 				"id": summoner.id,
					 				"region": regionNum,
					 				"icon": summoner.profileIconId,
					 				"title": 0,
					 				"updated": 0,
					 				"challenge": {
					 					"current": {
					 						"points": [0,0,0,0,0],
					 						 "start": currentPoints,
					 						 "rank": [0,0,0,0,0] },
				 						"last": {
				 						 	"points": [0,0,0,0,0],
				 						 	"rank": [0,0,0,0,0] }
				 					},
					 				"achievements": []
				 				};
		 						summonerDB.insert(entry, function(err, result) {
				 					if (err)
				 						console.log(err);
				 				});
 							}
 						});
 					}
				});
			});
		}
	});
}