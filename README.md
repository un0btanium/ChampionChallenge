# ChampionChallenge
Entry for the Riot API Challenge 2016
by unobtanium

[Website](http://championchallenge.net)

[Pictures](http://imgur.com/a/NZqgX)


## Installation Guide

Make sure you have npm, [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) installed locally. npm comes with Node.js automatically.

Open a console/terminal and enter the follow commands.
```
git clone https://github.com/un0btanium/ChampionChallenge.git
cd ChampionChallenge
```

Before we do anything else, lets set our Riot API Key in the json file under '/apikey/apikey.json'.
Don't forget to set region and rate limits depending on your type of key.

Back in the terminal, install packages via
```
npm install
```

Start MongoDB via 
```
mongod -dbpath <YOUR_PATH>/ChampionChallenge/data
```

Open a new console/terminal and execute the following javascript scripts in the given order. THEY initialize basic database structures inside MongoDB to get the website up and running. (Detailed explanation of each script can be found further below in this documentation.)
```
node createIndexes.js
node updateData.js
node newChallenge.js
```

Start the server with
```
node ./bin/www
```

Open a browser of your choice and enter the following url in your address field.
```
localhost:3000
```
The website should now load the index page.
Welcome toChampion Challenge!


## On which software does Champion Challenge run?

Champion Challenge is a website running on javascript with MongoDB handling the database. The framework is known under the name 'MEAN stack framework', because the software MongoDB, ExpressJS, AngularJS and NodeJS are being used to make the website work. Furthermore, Jade was used as an HTML template engine. CSS and Bootstrap for styling the site.

Furthermore, the website utilizes the [Riot API](https://developer.riotgames.com/api/methods#!/1060) and [LeagueJS](https://github.com/claudiowilson/LeagueJS). League of Legends pictures like item and champion icons are being used from [Data Dragon](http://ddragon.leagueoflegends.com/tool/).

So why did i choose this type of setup? Well, a few weeks in the past i had the urge to create a complex website and did some research on how to do such thing. MEAN stack looked promising and easy to get into since i already had basic experience with javascript and the json format. MongoDB is perfect for storing a large amount of users like League of Legends has, since MongoDB provides fast queries via Indexes while also being able to have different custom records in the database thanks to JSON format.


## What does Champion Challenge offer?

The website provides a competetive experience by running short contests (2-5 days), featuring five different champions each time. Summoners who entered the contest are able to play games with the featured champions and earn champion mastery points. Once a summoner played a game, he/she can update his summoner profile page on the website via the 'Update' button (30 minute cooldown). The summoner's performance of the current and last contest in form of points earned and rank archieved for each champion is shown and updated.

Starting each contest with zero points - independent on how many champion mastery points the summoner already gather before the contest started - offers a new and fair competetive environment for every summoner to race. Points are being granted based on the players in-game performance and outcome of the game. Since five champions are being featured (one for each role), summoners are able to queue up as a group and receive party bonus points.

Once a challenge ends, the top 10 ranked summoners are being featured on a leaderboard at the website main page. Summoners with the same amount of points share the same rank. The top 250 ranks unlock achievements for their profile (on the website) in form of ingame items. These items are shown in the summoner profile page and track the summoner's performance for the champion he earned the achievement with. In addition to being featured on the leaderboards, the top 10 ranks of each contest receive a golden version of the item as a reward. Each contest has five new items as a reward choosen based on the in-game gold costs of the item. Something expensive like Trinity Force has a common rarity while the Healthpotion is super rare. A summoner can have the same item only once, but is able to update it's stats when managing to get a better rank in future contests. This allows everybody to hunt for the golden version even if they do not manage to get top 10 the first time.

## Documentation

As mentioned above, when starting this project i had no clue on how the MEAN stack worked. Therefore, i ran into problems a lot, had to do hours of research and had to decide on how to solve them. This documentation provides an overview on how different parts of the website work and some of my thought process behind it. After all this project is far from perfect and can be optimized and improved on as well as new features added.

### The database

Probably one of the main challenges for me while developing was setting up the database for summoners, items, champions and challenges. Since the Riot API has a limitation on how many calls can be made in a given timeframe (to help reduce server load), it was necessary to retrieve and cache the information in my own database. MongoDB in this case.

MongoDB saves information as documents in collections. For example information about an item (document) is saved in the collection 'items'. Information about summoners in the collection 'summoners'. MongoDB uses the JSON format for their documents and therefore a NoSQL database. These type of database are non-relational and do not use tabular relations in common relational databases and instead use other methods of storing and retrieving data. NoSQL databases are usually more flexible since the data structure of the documents can be adjusted freely and individually (in our case the JSON format). NoSQL databases usually offer horizontal scaleability, however i didnt not take advantage of this feature.

I choose to save all data into the database rather than have frequently requested information about champion, items and challenges in seperate JSON files, which load once on server start and would be avaiable anytime. The reason was that updating these information would require to reload these files which in return would require the server to restart. I liked the idea of having the server running without downtime while also being able to quickly update data when a new patch is released or a new challenge starts. Since the data of champions, items and challenges do not consist of a large amount of data, the time to query to retrieve data is very low (<0.1ms). This is important since for each summoner loading the page, this information has been load out of database. In addition to the low amount of data, MongoDB provides internal RAM caching, which means that frequently requested data stays in RAM rather on the hard drive. I dont search for individual items or champions and instead retrieve the data as a whole which speeds up the query as well.

However, since League of Legends has grown in user count rapidly over the past years, we can simply retrieve all summoners when we just want information about the single summoner name the user entered on the website. Therefore, we query the database by summoner id and server region or by summoner name and server region. These values together are unique and can be saved into the same collection of data (we do not have to seperate summoners from different regions into different collections). MongoDB offers to set Indexes on one or multiple values such as id and region. These indexes create MongoDB internal datastructures to speed up queries. For example, imagine we have 10.000 summoners in our database. Without an index set on id and region, the request for 'unobtanium' and 'euw' would require to look through all summoners until the entry/document is found. This is super bad and can take multiple milliseconds, while also being unpredicatable on how long the query requires. Maybe the summoner is found instantly or MongoDB has to look through all 10.000 summoners. With an index set, these type of querys are instant (<0.1ms), espacially if we apply that the index is unique. Only one entry/document has to be looked at and retruned. 

So i am talking about data for a while now. How does the data look like? Lets us take a look at an item entry inside the 'items' collection:
```
{
  "_id" : ObjectId("572e0c047eb3a9141df06255"),
  "id" : 1026,
  "uid" : 0,
  "name" : "Blasting Wand",
  "version" : "6.9.1",
  "gold" : 850
}
```

'_id' is a unique value created by MongoDB and can be used to quickly find the information. But since we retrieve the whole list of items, we do not accually use this value.
'id' is the League of Legends internal identifier. We need this number to display the item icon from the Data Dragon server.
'uid' is the unique identifier i gave the item. This starts at 0 and counts onward. The League of Legends ids have gaps in their counting. Reason being that items do get removed from the game or change and reintroduced as a new id. The 'uid' value allows me to sort the list by this value and retrieve an array object to get the item i need to display on the website.
'name' is the in-game shop name of the item.
'version' is the version in which the item can be found on the Data Dragon server. We use this [address](http://ddragon.leagueoflegends.com/cdn/6.9.1/img/item/1026.png) to display item icons, which require the version and item id. If an item gets removed from League of Legends the version number does not increase anymore, but this allows me to keep the item on my server.
'gold' is the current in-game shop cost for the item. It is being used to determine if the item gets used in the next challenge as a ward. Low gold cost means more rarity.

Let us take a look at a champion entry.
```
{
  "id": 432,
  "key": "Bard",
  "name": Bard,
  "title": "the Wandering Caretaker",
  "tags": [
    "Support",
     "Mage"
  ]
}
```

You may have spotted that we are missig the '_id' value this time. The reason behind this is that in the 'champions' collection i only store a single object with an array with these champion information as it's elements. I should have given the champions a 'uid' as well, because Champions have gaps in their ids as well (hence Bard having an id of 432) but i implemented champions way before items. Therefore i accually have two arrays storing the champions. One array just contains all champions and a second array contains 'null' as element when there exists no champion with the index as id.
'key' is the name used by Riot internally. Usually these keys do not have white spaces and some champions have different keys (e.g. Wukong having MonkeyKing). This key is being used to display the champion icons from Data Dragon. 
'name' is the champion name displayed in-game and also shown on my website.
'title' is the champion specific title. It is being show underneath the summoner names on the profile page based on which champion the summoner earned the most points with in the last challenge. Just some neat little personalisation.
'tags' are the roles being shown in the Game Client. All champions have a primary and a secondary role. Only the primary role is being used to select champions for each new challenge. Therefore somewhat viable teams with a top-, midlaner, jungler and marksman with support are being featured every time, allowing for five man groups.

Next up is the 'challenges' collection:
```
{
  "_id": ObjectId("5730ee052cc0897404ea38b3"),
  "ends": 0,
  "limit": 250,
  "champions" : {
    "last": [ 59, 37, 105, 121, 42],
    "current": [222, 60, 34, 58, 80],
    "next": [254, 134, 18, 133, 59]
  },
  "items": {
    "last": [107, 24, 133, 32, 57],
    "current": [146, 139, 126, 25, 72],
    "next": [53, 73, 57, 48, 92]
  },
  "winners": [
    [...],
    [...],
    [...],
    [...],
    [...]
  ]
}
```

'_id' is the unique value every document has.
'ends' is currrently an unused variable. In future updates this would be used to store the date and time on which the current challenge ends. This could also be used to display a countdown on the website. However, currently new challenges have to be created manually with the 'newChallenge.js' script.
'limit' is the max rank for granting achievements. Default value is 250, but could be changed depending on how many summoners are accually participating.
'champions' and 'items' store the ids of the champions and uids of items for the current, last and upcomming challenge. These values are being looked up in the arrays returned by the champions and items collection.
'winners' is an array containing five arrays with summoners in it. These summoners are the top 10 ranks of the last challenge for each champion. Since summoners with the same amount of points share the same rank, there accually can be more than 10 summoners inside the arrays.

Last but not least: The summoner data structure:
```
{
  "_id": ObjectId("572a6b31cd9c86a418c3a53a"),
  "namel": "misterimagined",
  "name": "Mister Imagined",
  "id": "1337900142",
  "region": 0,
  "icon": 1129,
  "updated": 1462670182028,
  "challenge": {
    "current": {
      "points": [
        0,
        0,
        1200,
        0,
        0
      ],
      "start": [
        0,
        0,
        2500,
        0,
        270
      ],
      "rank": [
        0,
        0,
        42,
        0,
        0
      ]
    },
    "last": {
      "points": [
        1318,
        0,
        0,
        140,
        0
      ],
      "rank": [
        123,
        0,
        0,
        745,
        0
      ]
    }
  },
  "achievements": [
    {
      "i": 107,
      "c": 59,
      "r": 123,
      "p": 1318
    }
  ]
}
```

'_id' is the unique identifier.
'namel' is the summoner name without white spaces and all lowercase.
'name' is the summoner name with white spaces and capitalization.
'id' is Riot's internal summoner identifier. This id is unique within each server.
'region' is the server region id.  0 would be the EUW Server: ['euw', 'na', 'eune', 'br', 'jp', 'kr', 'tr', 'ru', 'lan', 'las', 'oce']
'icon' is the ingame icon id. We do not require a database for icons, because we can simple retrieve the icon image from Data Dragon with the icon id.
'updated' is the date and time the last time someone updated the summoner. The value are the milliseconds since January 1st 1970. This is used to check if the summoner has updated his profile recently and prevents multiple update requests in a short amount of time. The server checks if the default wait time of 30 minutes have past to allow or forbid the update.
'challenge' contains the current and last challenge stats of the summoner. Both keep track of points and rank. Since we let every summoner start at zero points, we have to store his champion mastery points once the summoner entered the challenge (stored in 'start'). If the summoner plays games we receive an equal or higher amount of points (depends if the summoner played with the champion or not), and we can subtract the start value from the current value retrieved from the Riot server. This value is then saved in 'current.points'. In our example above the played had 2500 points and after playing a game he had 3700. 3700 minus 2500 equals 1200. Based on this value we now can look through the 'summoners' database for summoners with more points. Counting those numbers and adding 1 to it and we have the current rank of the summoner. Therefore, this estimated rank does not check if multiple summoners have the same rank and share the rank, which would lead to a better rank (for example 41 instead of 42). Only the final rank calculations at the end of a challenge take this into consideration. The current rank array elements all have indexes set on them, which allows us to pretty much instantly retrieve the estimated rank (<0.1ms). 







### Conclusion
I would have liked to implement more features, but time was limited and a lot of techniques and software used were new to me. I also would have liked to provide a lot more documentation, but i sadly ran out of time. I will be updating this Read-me file periodically. I also would have liked to provide a running demo on a webserver. (I probably will provide one after the API challenge ended.)

Overall, the RIOT API Challenge made a lot of fun and lead to new experiences. Future hobby projects are already planned :)





