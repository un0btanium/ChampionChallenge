var lolapi = require('leagueapi');
var apidata = require('./apikey/apikey.json');

lolapi.init(apidata.apikey, apidata.region);
lolapi.setRateLimit(apidata.rateLimitPer10s, apidata.rateLimitPer10min);

var regions = ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce'];

var versions = new Array();
var count = 0;
var itemCount;

var mongodb = require('mongodb');
var db;
var championDB, versionDB, itemDB;
if (db == null) {
	mongodb.MongoClient.connect('mongodb://localhost:27017/championchallenge', function (err, database) {
		if (err) { // ERROR DB
			throw err
		} else { // connection established
			db = database;
			championDB = db.collection('champions');
			versionDB = db.collection('versions');
			itemDB = db.collection('items');
			getChampions();
			getRealmData();
			getItems();
		}
	});
}

function getChampions() {
	lolapi.Static.getChampionList({'champData': 'tags', 'dataById':true}, apidata.region, function (err, list) {
		if (err) {
			console.log("RIOT API ERROR! While retrieving champions: \n" + err);
		} else if (list.data) {
			championDB.drop( function (err2, response) {
				if (err2) {
					console.log("Dropping champion table failed. Was already empty?");
				}
				var champions = list.data;
				var array = Object.keys(champions).map(function(k) { return champions[k] });
				var length = array.length;
				var finalArray = [];
				for (var i = 0; i < array.length; i++) {
					finalArray[array[i].id] = array[i];
				}
				championDB.insert({"champions": finalArray, "array": array}, function (err3, result) {
					if (err3)
						console.log("ERROR! Updating champions failed!\n" + err3)
					else
						console.log("=== Champions updated! ===\n");
				});
			});
		} else {
			console.log("ERROR! No champions have been returned!");
		}
	});
}

function getItems() {
	itemDB.count(function(err, count) {
		itemCount = count;
		if (err) {
			console.log(err);
		} else {
			lolapi.Static.getItemList({itemListData: ['maps','inStore','gold']}, function(err2, result) {
				if(err2) {
					console.log("RIOT API ERROR! While retrieving items: " + err2);
				} else {
					var items = result.data;
					var version = result.version;
					for (var key in items) {
						setItem(items[key], version);
					}
				}
			});
		}
	});
}

function setItem(item, version) {
	if (item.maps != null && item.maps[11] == true && (item.inStore == null || item.inStore == true) && item.name.indexOf("Enchantment:") == -1 && item.name.indexOf("(Trinket)") == -1 && item.gold.total != null && item.gold.total > 0) {
		var a = itemDB.find({"id": item.id}).toArray( function (err3, item2) {
			if (err3) {
				console.log(err3);
			} else if (item2.length) { // ITEM ID EXISTS
				itemDB.update(item2[0], { $set: { "name": item.name, "version": version, "gold": item.gold.total } });
				console.log("Updated item by id: " + item.id + " -> " + item.name + " (" + item.gold.total + ")");
			} else { // ITEM ID DOES NOT EXISTS
				var b = itemDB.find({"name": item.name}).toArray( function (err4, item3) {
					if (err4) {
						console.log(err4);
					} else if (item3.length) { // ITEM NAME EXISTS
						itemDB.update(item3[0], { $set: { "id": item.id, "version": version, "gold": item.gold.total } });
						console.log("Updated item by name: " + item.id + " -> " + item.name + " (" + item.gold.total + ")");
					} else { // NEW ITEM
						console.log("Added new item: " + item.id + " -> " + item.name + " (" + item.gold.total + ")");
						var entry = {
							"id": item.id,
							"uid": itemCount++,
							"name": item.name,
							"version": version,
							"gold": item.gold.total,
						};
						itemDB.insert(entry);
					}
				});
			}
		})
	} else {
		console.log("	Ignored: " + item.id + " -> " + item.name);
	}
}


function getRealmData() {
	lolapi.Static.getRealm(regions[count], function (err, version) {
		if (err) {
			console.log("RIOT API ERRROR! While retrieving Realm Data: " + err);
		} else if (version) {
			console.log("=== Data Dragon Version for server '" + regions[count] + "' retrieved! ===");
			versions.push({ "server": regions[count], "version": version.dd,  "url": version.cdn+"/" });
			count++;
			if (count < regions.length){
				getRealmData();
			} else {
				saveVersion();
			}
		} else {
			console.log("ERROR! No version for server '" + regions[count] + "' has been returned!");
		}
	});
}


function saveVersion() {
	versionDB.drop( function (err, response) {
		versionDB.insert(versions, function (err2, result) {
			if (err2)
				console.log("ERROR! Updating versions failed!\n" + err2)
			else {
				console.log("=== Data Dragon Versions updated! ===\nFINISHED\n");
				db.close();
			}
		});
	});
}
