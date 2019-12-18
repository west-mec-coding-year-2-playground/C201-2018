var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
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
    },
    getNotes: function(ownerid, friendid, callback) {
        var cursor = database.collection('notes').find({ 
            owner_id: ownerid,
            friend_id: friendid
        });
        cursor.toArray(function(err, notes) {
            if (err) {
                return callback(err);
            }
            callback(null, notes.map(function(note) {
                return {
                    _id: note._id,
                    content: note.content
                }
            }));
        });
    },
    insertNote: function(ownerid, friendid, content, callback) {
        database.collection('notes').insert({ 
            owner_id: ownerid,
            friend_id: friendid,
            content: content
        },
        function(err, result) {
            if (err) {
                return callback(err, result);
            }
            callback(null, {
                _id: result.ops[0]._id,
                content: result.ops[0].content
            });
        });
    },
    updateNote: function(noteId, ownerId, content, callback) {
        database.collection('notes').updateOne({ 
            _id: new ObjectID(noteId),
            owner_id: ownerId
        },
        {
           $set: { content: content } 
        },
        function(err, result) {
            if (err) {
                return callback(err);
            }
            database.collection('notes').findOne({
                _id: new ObjectID(noteId)
            }, callback);
        });
    },
    deleteNote: function(noteId, ownerId, callback) {
        database.collection('notes').deleteOne({ 
            _id: new ObjectID(noteId),
            owner_id: ownerId
        }, callback);
    }
}
