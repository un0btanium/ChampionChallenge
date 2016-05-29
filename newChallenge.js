var async = require('async');

var challenges;
var ACHIEVEMENT_LIMIT;

var apidata = require('./apikey/apikey.json');
var lolapi = require('leagueapi');
lolapi.init(apidata.apikey, apidata.region);
lolapi.setRateLimit(apidata.rateLimitPer10s, apidata.rateLimitPer10min);

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var mongodb = require('mongodb');
var db;
var summonerDB, championDB, versionDB, challengeDB, itemDB;
var max;
var time = new Date().getTime();
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

			challengeDB.find().toArray(function (err, result) {
				if (result.length) { // CHALLENGES EXIST
					challenges = result[0];
					ACHIEVEMENT_LIMIT = challenges.limit;
					summonerDB.count({"challenge.current.start.0": {$gt: -1}}, function(err, result2) {
						max = result2;
						if (max > 9) { // if at least ten summoners entered the challenge
							createLeaderboard();
						} else {
							console.log("Not enough summoners entered!");
							db.close();
						}
					});
				} else { // NO CHALLENGES EXIST YET
					console.log("SETTING UP CHALLENGES");
					initChallenges();
				}
			})
		}
	});
}

function createLeaderboard() {
	// STEP 1 - COPY POINTS FROM 'CURRENT' OVER TO 'LAST' CHALLENGE (+ reset last.rank to default)
	// STEP 2 - GET RANKINGS (ONE BY ONE)
	// STEP 3 - SET TITLE
	// STEP 4 - RESET 'CURRENT' VALUES TO DEFAULT
	async.series([
		function (callback) { // STEP 1
			var i = 0;
			var bulk = summonerDB.initializeUnorderedBulkOp();
			console.log("\nSTEP 1! Copy points from 'current' to 'last' and reset rank!");
			summonerDB.find({},{timeout: false}).snapshot(true).forEach( function (summoner) {
				
				bulk.find({"id": summoner.id, "region": summoner.region}).updateOne({ $set: {"challenge.last.points": summoner.challenge.current.points, "challenge.last.rank": [0,0,0,0,0]}});
				i++;
				if (i == max) {
					console.log("STEP 1! Executing bulk (" + i + ")");
					bulk.execute();
					console.log("FINISHED STEP 1!\n");
					callback(null, '');
				} else if(i % 1000 == 0) {
					console.log("STEP 1! Executing bulk (" + i + ")");
					bulk.execute();
					bulk = summonerDB.initializeUnorderedBulkOp();
				}
			});
		},
		function(callback) { // STEP 2.1
			getRankings(0, callback);
		},
		function(callback) { // STEP 2.2
			getRankings(1, callback);
		},
		function(callback) { // STEP 2.3
			getRankings(2, callback);
		},
		function(callback) { // STEP 2.4
			getRankings(3, callback);
		},
		function(callback) { // STEP 2.5
			getRankings(4, callback);
		},
		function(callback) { // STEP 3
			var all = 0;
			var bulkCount = 1; // have to differentiate between how many summoners have been iterated through and how many are in bulk (since some summoners have 0 points on all champions and do not receive a new title)
			var isEmpty = true;
			var bulk = summonerDB.initializeUnorderedBulkOp();
			console.log("STEP 3: SET TITLES!");
			summonerDB.find({"challenge.current.start.0": {$gt: -1}},{timeout: false}).snapshot(true).forEach( function (summoner) {
				
				var highest = Math.max.apply(Math, summoner.challenge.last.points);
				if (highest != 0) { // if summoner has at least gathered points with one champion
					var index = summoner.challenge.last.points.indexOf(highest);
					if (index != -1) {
						bulk.find({"id": summoner.id, "region": summoner.region}).updateOne({ $set: {"title": challenges.champions.current[index]}}); // SET TITLE
						bulkCount++;
						isEmpty = false;
					};
				}

				all++;
				if (all == max) {
					if (!isEmpty) { // Check if summoners are still left in bulk and need to be updated (This would return false if there would be exactly 1000,2000,3000,ect summoners)
						console.log("STEP 3! Executing bulk (" + bulkCount + ")");
						bulk.execute();
					}
					console.log("FINISHED STEP 3!\n");
					callback(null, '');
				} else if(!isEmpty && bulkCount % 1000 == 0) {
					console.log("STEP 3! Executing bulk (" + bulkCount + ")");
					bulk.execute();
					bulk = summonerDB.initializeUnorderedBulkOp();
					isEmpty = true;
				}
			});
		},
		function(callback) { // STEP 4
			var i = 1;
			var bulk = summonerDB.initializeUnorderedBulkOp();
			console.log("STEP 4: RESET 'CURRENT' TO DEFAULT VALUES!");
			summonerDB.find({"challenge.current.start.0": {$gt: -1}},{timeout: false}).snapshot(true).forEach( function (summoner) {
				bulk.find({"id": summoner.id, "region": summoner.region}).updateOne({ $set: {"challenge.current.start": [-1,0,0,0,0], "challenge.current.points": [0,0,0,0,0], "challenge.current.rank": [0,0,0,0,0]}});
				
				if (i == max) {
					console.log("STEP 4! Executing bulk (" + i + ")");
					bulk.execute();
					console.log("FINISHED STEP 4!\n");
					callback(null, '');
				} else if(i % 999 == 0) { // setting this to 1000 ignores a single document (dunno why, didnt found fix in time, this works)
					console.log("STEP 4! Executing bulk (" + i + ")");
					bulk.execute();
					bulk = summonerDB.initializeUnorderedBulkOp();
				}
				i++;
			});
		},
		function(callback) { // STEP 5
			console.log("STEP 5: UPDATE CHALLENGE CHAMPIONS AND ITEM REWARDS! GENERATE FINAL LEADERBOARD!")
			updateChallenge(callback);
		}
		],
		function (err, results) {
		if (err)
			console.log(err);
		else
			console.log("Procedure took " + ((new Date().getTime()) - time) +"ms for " + max + " summoners to finish!");
		db.close();
	});
}


function getRankings(index, callback) {
	var all = 0;
	var bulkCount = 1; // have to differentiate between how many summoners have been iterated through and how many are in bulk (since some summoners have 0 points and do not receive a rank)
	var isEmpty = true;
	var rank = 0;
	var previousPoints = -1;
	var sortOrder = {};
	sortOrder['challenge.last.points.' + index] = -1;
	var bulk = summonerDB.initializeUnorderedBulkOp();
	console.log("STEP 2." + (index+1) + ": Calculate rankings!");
	summonerDB.find({"challenge.current.start.0": { $gt: -1 }}, {timeout: false}).sort(sortOrder).snapshot().forEach( function (summoner) {
		
		if (summoner.challenge.last.points[index] > 0) { // player need to play at least one game with the champion to get a ranking
			
			if (previousPoints != summoner.challenge.last.points[index]) { // Check if the summoners have the same amount of points and share a rank 
				previousPoints = summoner.challenge.last.points[index];
				rank++;
			}
			var set = {};
			set['challenge.last.rank.' + index] = rank; // SET RANK

			var push = {};
			var hasAchievementAlready = false;
			if (rank <= ACHIEVEMENT_LIMIT) { // ADD ACHIEVEMENT
				var i = 0;
				for (i = 0; i < summoner.achievements.length; i++) {
					var achievement = summoner.achievements[i];
					if (challenges.items.current[index] == achievement.i && rank <= achievement.r) { // REPLACE/UPDATE ACHIEVEMENT
						set['achievements.' + i] = {'i': challenges.items.current[index], 'c':challenges.champions.current[index], 'r': rank, 'p': previousPoints};
						break;
					}
				}
				if (i == summoner.achievements.length) { // ADD NEW ACHIEVEMENT
					push['achievements'] = {'i': challenges.items.current[index], 'c':challenges.champions.current[index], 'r': rank, 'p': previousPoints};
					hasAchievementAlready = true;
				}
			}



			bulkCount++;
			isEmpty = false;
			if (hasAchievementAlready)
				bulk.find({"id": summoner.id, "region": summoner.region}).updateOne({$set: set, $push: push});
			else
				bulk.find({"id": summoner.id, "region": summoner.region}).updateOne({$set: set});
				
		}

		all++;
		if (all == max) {
			if (!isEmpty) { // Check if summoners are still left in bulk and need to be updated (This would return false if there would be exactly 1000,2000,3000,ect summoners)
				console.log("STEP 2." + (index+1) + "! Executing last bulk (" + bulkCount + ")");
				bulk.execute();
			}
			console.log("\nFINISHED STEP 2." + (index+1) + "! " + bulkCount + " summoners received a rank!\n");
			callback(null, '');
		} else if(!isEmpty && bulkCount % 1000 == 0) {
			console.log("STEP 2." + (index+1) + "! Executing bulk (" + bulkCount + ")");
			bulk.execute();
			bulk = summonerDB.initializeUnorderedBulkOp();
			isEmpty = true;
		}
	});
}

// New champions: use tags for roles
function initChallenges() {
	itemDB.find().toArray(function (err, items) {
		championDB.find().toArray(function (err, championlist) {
			if (items.length && championlist.length) {
				var champions = championlist[0].array;
				var entry = {
					"ends": 0,
					"limit": 50,
					"champions": {
						"last": getRandomChampions(champions),
						"current": getRandomChampions(champions),
						"next": getRandomChampions(champions)
					},
					"items": {
						"last": getRandomItems(items),
						"current": getRandomItems(items),
						"next": getRandomItems(items)
					},
					"winners": [
						[],[],[],[],[]
					]
				};
				challengeDB.insert(entry);
				console.log("Challenges (Items and Champions) created! Archievement rank limit set to " + entry.limit);
				db.close();
			} else {
				console.log("ERROR! No champion or item data found. Initialize database first with the updateData.js script!");
				db.close();
			}
		});
	});
}

function updateChallenge(callback) {
	itemDB.find().toArray(function (err, items) {
		championDB.find().toArray(function (err, championlist) {
			if (items.length && championlist.length) {
				var champions = championlist[0].array;
				var nextChampions = getRandomChampions(championlist[0].array);
				var nextItems = getRandomItems(items);
				console.log("STEP 5: Next champions: " + nextChampions);
				console.log("STEP 5: Next items: " + nextItems);
				summonerDB.find({"challenge.last.rank.0": {$lt:11, $ne: 0}}).sort({"challenge.last.rank.0": 1}).toArray(function (err, winners1) {
					summonerDB.find({"challenge.last.rank.1": {$lt:11, $ne: 0}}).sort({"challenge.last.rank.1": 1}).toArray(function (err2, winners2) {
						summonerDB.find({"challenge.last.rank.2": {$lt:11, $ne: 0}}).sort({"challenge.last.rank.2": 1}).toArray(function (err3, winners3) {
							summonerDB.find({"challenge.last.rank.3": {$lt:11, $ne: 0}}).sort({"challenge.last.rank.3": 1}).toArray(function (err4, winners4) {
								summonerDB.find({"challenge.last.rank.4": {$lt:11, $ne: 0}}).sort({"challenge.last.rank.4": 1}).toArray(function (err5, winners5) {
									if (err || err2 || err3 || err4 || err5) {
										console.log(err + "\n" + err2 + "\n" + err3 + "\n" + err4 + "\n" + err5);
										callback(null,'');
									} else {
										var winners = [winners1, winners2, winners3, winners4, winners5];
										challengeDB.update(challenges, {$set: {"ends": challenges.ends + 604800000, "champions": {"last": challenges.champions.current, "current": challenges.champions.next, "next": nextChampions}, "items": {"last": challenges.items.current, "current": challenges.items.next, "next": nextItems}, "winners":winners}});
										console.log("STEP 5 FINISHED!");
										callback(null, '');
									}
								});
							});
						});
					});
				});
				
			} else {
				console.log("ERROR! No champion or item data found. Initialize database first with the updateData.js script!");
				callback(null, '');
				db.close();
			}
		});
	});
}


function getRandomItems(items) {
	var array = [0,0,0,0,0];
	var gold = 5000;
	for (var i = 0; i < 5; i++) {
		var notFound = true;
		while (notFound) {
			var randItem = Math.floor(Math.random()*items.length);
			var randGold = Math.floor(Math.random()*gold);
			if (randGold <= items[randItem].gold) {
				array[i] = randItem;
				notFound = false;
			}
		}
	}
	return array;
}

function getRandomChampions(champions) {
	// ROLES: ADC SUPPORT MID JUNGLE TOP
	var roles = [
		['Marksman'],
		['Support'],
		['Mage', 'Assassin'],
		['Fighter', 'Tank'],
		['Tank', 'Fighter', 'Assassin']
	];
	var array = [0,0,0,0,0];
	for (var i = 0; i < 5; i++) {
		var notFound = true;
		while (notFound) {
			var rand = Math.floor(Math.random()*champions.length);
			if (array.indexOf(champions[rand].id) == -1) {
				if (champions[rand].tags.length > 0 && roles[i].indexOf(champions[rand].tags[0]) > -1) {
					array[i] = champions[rand].id;
					notFound = false;
					break;
				}
			}
		}
	}
	return shuffleArray(array);
}


function shuffleArray(a) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
}