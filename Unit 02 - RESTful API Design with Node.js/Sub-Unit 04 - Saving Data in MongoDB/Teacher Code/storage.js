var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017';
var dbName = 'twitter_notes';
var database;

module.exports = {
    connect: function() {
        MongoClient.connect(url, function(err, client) {
            if (err) {
                return console.log('Error: ' + err);
            }
            database = client.db(dbName);
            console.log('Connected to database: ' + dbName);
        });
    },
    connected: function () {
        return typeof database != 'undefined';
    },
    insertFriends: function(friends) {
        database.collection('friends').insert(friends, function(err) {
            if (err) {
                console.log('Cannot insert friends into database.');
            }
        });
    },
    getFriends: function(userId, callback) {
        var cursor = database.collection('friends').find({ for_user: userId});
        cursor.toArray(callback);
    },
    deleteFriends: function() {
        database.collection('friends').remove(( {} ), function(err) {
             if (err) {
                console.log('Cannot remove friends from database.');
            }
        });
    }
}
