var mongodb = require('mongodb');
var db;
var summonerDB;
if (db == null) {
	mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
		if (err) { // ERROR DB
			throw err
		} else { // connection established
			db = database;
			summonerDB = db.collection('summoners');

			createIndexes();
		}
	});
}

function createIndexes() {	
	summonerDB.createIndex({"namel": 1, "region": 1}, {unique: true});
	summonerDB.createIndex({"id": 1, "region": 1}, {unique: true});

	summonerDB.createIndex({"challenge.current.points.0": -1});
	summonerDB.createIndex({"challenge.current.points.1": -1});
	summonerDB.createIndex({"challenge.current.points.2": -1});
	summonerDB.createIndex({"challenge.current.points.3": -1});
	summonerDB.createIndex({"challenge.current.points.4": -1});

	summonerDB.createIndex({"challenge.current.start.0": 1});

	summonerDB.createIndex({"challenge.last.rank.0": -1});
	summonerDB.createIndex({"challenge.last.rank.1": -1});
	summonerDB.createIndex({"challenge.last.rank.2": -1});
	summonerDB.createIndex({"challenge.last.rank.3": -1});
	summonerDB.createIndex({"challenge.last.rank.4": -1});

	setTimeout(function() {
		console.log("Indexes set!");
		db.close();
	}, 5000);
}