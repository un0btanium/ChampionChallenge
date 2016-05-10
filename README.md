# ChampionChallenge
Entry for the Riot API Challenge 2016

by unobtanium

[Pictures](http://imgur.com/a/NZqgX)

## Installation Guide

Make sure you have npm, [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/download-center?jmp=nav#community) installed locally. npm comes with Node.js automatically.

Open a console/terminal and enter the follow commands.
```
git clone https://github.com/un0btanium/ChampionChallenge.git
cd ChampionChallenge
```

Before we do anything else, lets set our Riot API Key under /apikey/apikey.json
Be sure to set region and rate limits.


Start MongoDB via 
```
mongod -dbpath <YOUR_PATH>/ChampionChallenge/data
```

Open a new console/terminal and execute the following javascript scripts in the given order. These initialize everything MongoDB needs.
```
node createIndexes.js
node updateData.js
node newChallenge.js
```

Start the server with

```
node ./bin/www
```

And open the browser url
```
localhost:3000
```
The website should now load the index page.
Welcome to the Champion Challenge


## On which software does Champion Challenge run?

Champion Challenge is a website running on javascript with MongoDB handling the database. The framework is known the name MEAN stack, because the software MongoDB, ExpressJS, AngularJS and NodeJS are being used to make the website work. Furthermore, Jade was used as a HTML template engine. CSS and Bootstrap for styling the site.

Furthermore, the website utilizes the [Riot API](https://developer.riotgames.com/api/methods#!/1060) and [LeagueJS](https://github.com/claudiowilson/LeagueJS).

So why did i choose this type of setup? Well, a few weeks in the past i had the urge to create a complex website and did some research on how to do such thing. MEAN stack looked promising and easy to get into since i had bsaic experience with javascript already. MongoDB was perfect for large amount of users like League of Legends has, since MongoDB provides fast queries via Indexes while also being able to have different custom records in the database thanks to JSON format.


## What ist Champion Challenge?

Summoners can enter challenges which run for a limited amount of time. (Currently it is required to run the
```
node newChallenge.js
```
for the current challenge to end and a new one to start. As a future feature, this would be cool being automated via a scheduler.) Challenges should run around 2-5 days long.
Each challenge features 5 different champions. Once a player has entered a challenge, he has to play games with one of the featured champions and earn mastery points with them. The summoners with the most points get featured on a leaderboard on the homepage site.
The website offers players to search their (or others) summoner names. Each summoner has a profile created and can be updated via an 'Update' button by the user (which currently has a cooldown of 30 minutes).

Each user has their current and last challenge points and ranks shown as well as achievements in form of items. Achievements are only given out to the top 250 ranked summoners and the top 10 receive a rare golden version of the item. Achievements who cost less gold in-game are usually more rare to show up in challenges. Which means that having a Healthpotion as an achievment is super rare. In addition these achievements keep track of rank, champion and points the summoner had when he unlocked the achievement.

Since every summoner starts each challenge at zero points, it creates a fresh and fair competitive stage for everybody to race. After playing a game, the summoner can return to his profile site and update his mastery points, receiving an estimated rank based on other players in the competition.

Since five champions are featured, you are able to group up as 5 and gain extra champion mastery points through the party bonus. Performing well and winning the game makes the summoner climb the ladder.

The five champions are being selected with the help of the roles of the champions. This allows for viable teams and more fun as a team.



### Conclusion
I would have liked to implement more features, but time was limited and a lot of techniques and software used were new to me. I also would have liked to provide a lot more documentation, but i sadly ran out of time. I will be updating this Read-me file periodically. I also would have liked to provide a running demo on a webserver. (I probably will provide one after the API challenge ended.)

Overall, the RIOT API Challenge made a lot of fun and lead to new experiences. Future hobby projects are already planned :)





