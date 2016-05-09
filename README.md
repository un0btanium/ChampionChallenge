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

Summoners can enter challenges which run for a limited amount of time. Currently it is required to run the
```
node newChallenge.js
```
for a new challenge to start. As a future feature, this should be automated via a scheduler and challenges should run 3-4 days.
Each challenge features 5 different champions. Once a player has entered a challenge, he has to play games with one of the featured champions and earn mastery points with them. The summoners at the of the challenge with the most points are the winners and featured on a leaderboard in.

The website offers players to search their (or others) summoner names. Each summoner has a profile created in the database and can be updated via an 'Update' button by the user (which currently has a cooldown of 30 minutes). Each user has their current and last challenge points and ranks shown as well as achievements in form of items.







