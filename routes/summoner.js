var express = require('express');
var router = express.Router();

var apidata = require('../apikey/apikey.json');
var lolapi = require('leagueapi');
lolapi.init(apidata.apikey, apidata.region);
lolapi.setRateLimit(apidata.rateLimitPer10s, apidata.rateLimitPer10min);

var mongodb = require('mongodb');
var db;
var summonerDB, championDB, versionDB, challengeDB, itemDB;
if (db == null) {
	mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
		if (err) { // ERROR DB
			throw err
		} else { // connection established
			db = database;
			summonerDB = db.collection('summoners');
			championDB = db.collection('champions');
			versionDB = db.collection('versions');
			challengeDB = db.collection('challenges');
			itemDB = db.collection('items');
		}
	});
}

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var cooldown = 1800000; /* half an hour cooldown for summoner profile updates */
var cooldownError = Math.floor(cooldown/4); // if an error occured set the cooldown to only one quarter of the normal cooldown





// ROUTER

// Update summoner (redirects to summoner afterwards)
router.get('/:region/:name/update', function(req, res, next) {
	var region = req.params.region.toLowerCase();
	var name = req.params.name.toLowerCase();

	var regionNum = regions.indexOf(region);

	if (regionNum == -1)
		renderError(res, "Server does not exist!", {"status": 404, "stack": ""});
	else 
		connectToSummonerDB(res, name, regionNum, updateSummonerData);
});

// Show summoner
router.get('/:region/:name', function(req, res, next) {
	var region = req.params.region.toLowerCase();
	var name = req.params.name.toLowerCase();

	var regionNum = regions.indexOf(region);

	if (regionNum == -1)
		renderError(res, "Server does not exist!", {"status": 404, "stack": ""});
	else
		connectToSummonerDB(res, name, regionNum, renderSummonerData);
});






// CHECKS

// Check if summoner exists in DB, if not create/update the summoner.
function connectToSummonerDB(res, name, regionNum, callback) {
	summonerDB.find({"namel": name, "region": regionNum}).toArray(function (err2, summoners) {
		if (err2) { // ERROR DB
			renderError(res, "Server down", err2);
		} else if (summoners.length) { // summoner exists in DB
			callback(res, summoners[0]); //
		} else { // summoner NAME does not exists in DB - maybe ID exists because of namechange
			checkSummoner(res, name, regionNum, callback);
		}
	});
}

// check if summoner exists on Riot Server and by ID in DB, add/update summoner into DB  (in addition: handles namechanges)
function checkSummoner(res, name, regionNum, callback) {
		lolapi.Summoner.getByName(name, regions[regionNum], function (err, summoners) {
		if (err) { // ERROR summoner not found
			renderError(res, "Summoner not found", err);
		} else if (summoners == {}) { // ERROR summoner not found
			renderError(res, "Summoner not found", {"status": 404, "stack":""});
		} else { // summoner name exists on Riot server
			var summoner = summoners[name];

			// QUERY check if summoner id exists already (namechange?)
			summonerDB.find({"id": summoner.id, "region": regionNum}).toArray(function (err2, summoners2) {
				if (err2) { // ERROR db
					renderError(res, "Server Error", err2);
				} else if (summoners2.length) { // summoner id exists in db (summoner made a namechange)
					updateSummonerDB(res, summoners2[0], { $set: { "name": summoner.name, "namel": summoner.name.toLowerCase().replace(/ /g, ''), "icon": summoner.profileIconId } }, callback);
				} else { // name and summoner id does not exist in db (new user)
					createSummonerDB(res, summoner.name, summoner.id, regionNum, summoner.profileIconId, callback);
				}
			});
		}
	});
}






// CALLBACKS

// Render summoner profile
function renderSummonerData(res, summoner) {
	challengeDB.find().toArray( function (err, challengelist) {
		if (err) {
			renderError(res, "Server Error", err);
		} else {
			versionDB.find().toArray( function(err, versions) {
				if (err) {
					renderError(res, "Server Error", err);
				} else {
					var version = versions[summoner.region];
					var iconurl = version.url + version.version + "/img/profileicon/" + summoner.icon + ".png";
					var championurl = version.url + version.version + "/img/champion/";
					var itemurl = version.url;
					championDB.find().toArray(function (err2, championlist) {
						if (err2) {
							renderError(res, "Server Error", err);
						} else {
							itemDB.find().toArray(function (err3, itemlist) {
								if (err3) {
									renderError(res, "Server Error", err3);
								} else {
									res.render('summoner', {
										"title": summoner.name + ' - Champion Challenge',
										"summoner": summoner,
										"regions": regions,
										"iconurl": iconurl,
										"championurl": championurl,
										"itemurl": itemurl,
										"updateAvailable":(summoner.updated+cooldown < new Date().getTime()),
										"challenges": challengelist[0],
										"champions": championlist[0].champions,
										"items": itemlist,
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
}

// Redirect to summoner profile (called after summoner gets updated)
function redirectSummonerData(res, summoner) {
	res.redirect('/summoner/' + regions[summoner.region] + "/" + summoner.namel);
}

// Retrieves summoner data and champion mastery points
function updateSummonerData(res, summoner) { // Gather information from Riot Server and update summoner information in DB (summoner data and mastery data)
	var currentDate = new Date().getTime();
	if (summoner.updated+cooldown < currentDate) {
		lolapi.Summoner.getByID(summoner.id, regions[summoner.region], function (err, summoners) {
			if (err) {
				summonerDB.update(summoner, { $set: { "updated": currentDate-(cooldown-cooldownError) } });
				renderError(res, "Summoner not found", err);
			} else {
				var updatedSummoner = summoners[summoner.id];
				lolapi.ChampionMastery.getChampions(summoner.id, regions[summoner.region], function (err2, championMasteries) {
					if (err2) {
						summonerDB.update(summoner, { $set: { "updated": currentDate-(cooldown-cooldownError) } });
						renderError(res, "Champion Mastery not available", err2);
					} else {
						challengeDB.find().toArray( function (err3, challengelist) {
							if (err3) {
								renderError(res, "Server Error", err);
							} else {
								var currentPoints = [0,0,0,0,0];
								var champs = challengelist[0].champions.current;
								var champCount = champs.length;
								var i = 0;
								if (summoner.challenge.current.start[0] >= 0) {	// UPDATE CURRENT POINTS
									championMasteries.forEach(function (championMastery, index, array) {
										if (i >= champCount)
											return;
										var index = champs.indexOf(championMastery.championId);
										if (index >= 0) {
											currentPoints[index] = championMastery.championPoints - summoner.challenge.current.start[index];
											i++;
										}
									});
									getSummonerRank(res, summoner, updatedSummoner, 0, currentPoints, [0,0,0,0,0]);
								} else {										// ENTER CONTEST (SET START POINTS)
									championMasteries.forEach(function (championMastery, index, array) {
										if (i >= champCount)
											return;
										var index = champs.indexOf(championMastery.championId);
										if (index >= 0) {
											currentPoints[index] = championMastery.championPoints;
											i++;
										}
									});
									updateSummonerDB(res, summoner, { $set: { "name": updatedSummoner.name, "namel": updatedSummoner.name.toLowerCase().replace(/ /g, ''), "icon": updatedSummoner.profileIconId, "updated": new Date().getTime()-(cooldown-cooldownError), "challenge.current.start": currentPoints } }, redirectSummonerData);
								}
							}
						});
					}
				});
			}
		});
	} else {
		redirectSummonerData(res, summoner);
	}
}






// MASTERY POINT CALCULATION

// Updates current challenge mastery points and determines the current rank
function getSummonerRank(res, summoner, updatedSummoner, pos, currentPoints, rank) {
	if (pos >= currentPoints.length) {
		updateSummonerDB(res, summoner, { $set: { "icon": updatedSummoner.profileIconId, "updated": new Date().getTime(), "challenge.current.points": currentPoints, "challenge.current.rank": rank } }, redirectSummonerData);
	} else if (currentPoints[pos] > 0) {
		var entry = {};
		entry["challenge.current.points."+pos] = { $gt: currentPoints[pos]};
		summonerDB.count(entry, function (err, result) { // count the number of summoners with more points
			if (err) {
				getSummonerRank(res, summoner, updatedSummoner, pos+1, currentPoints, rank);
			} else {
				rank[pos] = result+1;
				getSummonerRank(res, summoner, updatedSummoner, pos+1, currentPoints, rank);
			}
		});
	} else {
		getSummonerRank(res, summoner, updatedSummoner, pos+1, currentPoints, rank);
	}
}






// DB

// Retrieves champion mastery points and inserts summoner into DB
function createSummonerDB(res, name, id, regionNum, icon, callback) {
	lolapi.ChampionMastery.getChampions(id, regions[regionNum], function (err, championMasteries) {
		if (err) {
			renderError(res, "Champion Mastery not available", err);
		} else {
			challengeDB.find().toArray(function (err2, challengelist) {
				if (err2) {
					renderError(res, "Server Error", err2);
				} else {
					var currentPoints = [0,0,0,0,0];
					var i = 0;
					var champs = challengelist[0].champions.current;
					var champCount = champs.length;
					championMasteries.forEach(function (championMastery, index, array) {
						if (i < champCount) {
							var index = champs.indexOf(championMastery.championId);
							if ( index >= 0) {
								currentPoints[index] = championMastery.championPoints;
								i++;
							}
						}
					});
					var entry = { 	
						"namel": name.toLowerCase().replace(/ /g, ''),
		 				"name": name,
		 				"id": id,
		 				"region": regionNum,
		 				"icon":icon,
		 				"title": 0,
		 				"updated": new Date().getTime()-(cooldown-cooldownError),
		 				"challenge": {
		 					"current": {
		 						"points": [0,0,0,0,0],
		 						 "start": currentPoints,
		 						 "rank": [0,0,0,0,0]
		 					},
							"last": {
								"points": [0,0,0,0,0],
								"rank": [0,0,0,0,0]
							}
						},
		 				"achievements": []
					};
					summonerDB.insert(entry, function (err, result) {
						if (err) {
							renderError(res, "Server Error", err);
						} else {
							callback(res, result.ops[0]);
						}
					});
				}
			});
		}
	});
}

// Updates the summoner with the changes
function updateSummonerDB(res, old, change, callback) {
	summonerDB.findAndModify(old, {"id": 1}, change, {'new':true}, function (err, summoner) {
		if (err) {
			renderError(res, "Server Error", err);
		} else
			callback(res, summoner.value); // summoner.value is the updated summoner in the DB
	} );
}





// RENDER

function renderError(res, message, error) {
	res.render('error', { "message": message, "error": error, "challenges.ends": new Date().getTime() , "currentDate": new Date().getTime()});
}

module.exports = router;