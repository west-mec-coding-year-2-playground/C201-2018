var url = require('url');
var express = require('express');
var bodyParser = require('body-parser');
var querystring = require('querystring');
var async = require('async');
var MongoClient = require('mongodb').MongoClient;
var authenticator = require('./authenticator.js');
var storage = require('./storage.js');
var config = require('./config.json');
var app = express();

storage.connect();

app.set('view engine', 'ejs');

setInterval(function() {
    if (storage.connected()) {
        console.log('Clearing MongoDB cache');
        storage.deleteFriends();
    }
}, 1000 * 60 * 5);

app.use(require('cookie-parser')());

app.use(bodyParser.json());

app.get("/auth/twitter", authenticator.redirectToTwitterLoginPage);

app.get(url.parse(config.oauth_callback).path, function (req, res) {
    authenticator.authenticate(req, res, function (err) {
        if (err) {
            res.redirect('/login');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/tweet', function (req, res) {
//    var credentials = authenticator.getCredentials();
//    if (!credentials.access_token || !credentials.access_token_secret) {
//        return res.sendStatus(401);
//    }
    if (!req.cookies.access_token || !req.cookies.access_token_secret) {
        return res.sendStatus(401);
    }
    var url = 'https://api.twitter.com/1.1/statuses/update.json';
    authenticator.post(url, req.cookies.access_token, req.cookies.access_token_secret, 
        {
            status: "Testing cookies on Twitter"
        },
        function (error, data) {
            if (error) {
                return res.status(400).send(error);
            }
            res.send('Tweet successful!');
        });
});

app.get('/search', function (req, res) {
//    var credentials = authenticator.getCredentials();
//    if (!credentials.access_token || !credentials.access_token_secret) {
//        return res.sendStatus(401);
//    }
    if (!req.cookies.access_token || !req.cookies.access_token_secret) {
        return res.sendStatus(401);
    }
    var url = 'https://api.twitter.com/1.1/search/tweets.json';
    var query = querystring.stringify({ q: 'BMW' });
    url += "?" + query;
    authenticator.get(url, req.cookies.access_token, req.cookies.access_token_secret, 
         function (error, data) {
            if (error) {
                return res.status(400).send(error);
            }
            res.send(data);
        });
});

app.get('/friends', function (req, res) {
//    var credentials = authenticator.getCredentials();
//    if (!credentials.access_token || !credentials.access_token_secret) {
//        return res.sendStatus(401);
//    }
    if (!req.cookies.access_token || !req.cookies.access_token_secret) {
        return res.sendStatus(401);
    }
    var url = 'https://api.twitter.com/1.1/friends/list.json';
    if (req.query.cursor) {
        url += "?" + querystring.stringify({ cursor: req.query.cursor });
    }
    authenticator.get(url, req.cookies.access_token, req.cookies.access_token_secret, 
         function (error, data) {
            if (error) {
                return res.status(400).send(error);
            }
            res.send(data);
        });
});

app.get('/', function(req, res) {
//    var credentials = authenticator.getCredentials();
//    if (!credentials.access_token || !credentials.access_token_secret) {
//        return res.redirect('/login');
//    }
    if (!req.cookies.access_token || !req.cookies.access_token_secret) {
        return res.redirect('/login');
    }
    if (!storage.connected()) {
        console.log('Loading friends from Twitter');
        renderMainPageFromTwitter(req, res);
    }
    console.log('Loading friends from MongoDB');
    storage.getFriends(req.cookies.twitter_id, function(err, friends) {
        if (err) {
            return res.status(500).send(error);
        }
        if (friends.length > 0) {
            console.log('Friends successfully loaded from MongoDB');
            friends.sort(function(a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            res.render('index', { friends: friends});
        }
        else {
            console.log('Loading friends from Twitter');
            renderMainPageFromTwitter(req, res);
        }
    });
});

function renderMainPageFromTwitter(req, res) {
    var credentials = authenticator.getCredentials();
    async.waterfall([
        // get friends ids
        function(callback) {
            var cursor = -1;
            var ids = [];
            async.whilst(function() {
                return cursor != 0;
            }, function(callback) {
                var url = 'https://api.twitter.com/1.1/friends/ids.json';
                url += "?" + querystring.stringify({ user_id: req.cookies.twitter_id, cursor: cursor});
                authenticator.get(url, req.cookies.access_token, req.cookies.access_token_secret, 
                function(error, data) {
                    if (error) {
                        return res.status(400).send(error);
                    }
                    data = JSON.parse(data);
                    cursor = data.next_cursor_str;
                    ids = ids.concat(data.ids);
                    callback();
                });
            }, function(error) {
                if (error) {
                    return res.status(500).send(error);
                }
                callback(null, ids);
            });
        },
        // lookup friends data
        function(ids, callback) {
            var getHundredIds = function(i) {
                return ids.slice(100*i, Math.min(ids.length, 100*(i+1)));
            }
            var requestsNeeded = Math.ceil(ids.length/100);
            async.times(requestsNeeded, function(n, next) {
                var url = 'https://api.twitter.com/1.1/users/lookup.json';
                url += "?" + querystring.stringify({ user_id: getHundredIds(n).join(',')});
                authenticator.get(url, req.cookies.access_token, req.cookies.access_token_secret, 
                function(error, data) {
                    if (error) {
                        return res.status(400).send(error);
                    }
                    var friends = JSON.parse(data);
                    next(null, friends);
                });
            },
            function(err, friends) {
                friends = friends.reduce(function(previousValue, currentValue, currentIndex, array) {
                    return previousValue.concat(currentValue);
                }, []);
                friends.sort(function(a, b) {
                    return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
                });
                friends = friends.map(function(friend) {
                    return {
                        twitter_id: friend.id_str,
                        for_user: credentials.twitter_id,
                        name: friend.name,
                        screen_name: friend.screen_name,
                        location: friend.location,
                        profile_image_url: friend.profile_image_url
                    };
                });
                res.render('index', { friends: friends });
                if (storage.connected) {
                    storage.insertFriends(friends);
                }
             });
        }
    ]);
}

app.get('/login', function(req, res) {
    authenticator.clearCredentials();
    if (storage.connected()) {
        console.log('Deleting friends collection on login');
        storage.deleteFriends();
    }
    res.render('login'); 
});

app.get('/logout', function(req, res) {
    authenticator.clearCredentials();
    res.clearCookie('access_token');
    res.clearCookie('access_token_secret');
    res.clearCookie('twitter_id');
    if (storage.connected()) {
        console.log('Deleting friends collection on logout');
        storage.deleteFriends();
    }
    res.redirect('/login'); 
});

function ensureLoggedIn(req, res, next) {
//    var credentials = authenticator.getCredentials();
    if (!req.cookies.access_token || !req.cookies.access_token_secret || !req.cookies.twitter_id) {
        return res.sendStatus(401);
    }
    next();
}

app.get('/friends/:uid/notes', ensureLoggedIn, function(req, res, next){
//    var credentials = authenticator.getCredentials();
    storage.getNotes(req.cookies.twitter_id, req.params.uid, function(err, notes) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(notes);
    });
});

app.post('/friends/:uid/notes', ensureLoggedIn, function(req, res, next){
    storage.insertNote(req.cookies.twitter_id, req.params.uid, req.body.content, 
    function(err, note) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(note);
    });
});

app.put('/friends/:uid/notes/:noteid', ensureLoggedIn, function(req, res){
    var noteId = req.params.noteid;
    storage.updateNote(req.params.noteid, req.cookies.twitter_id, req.body.content, 
    function(err, note) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send({
            _id: note._id,
            content: note.content
        });
    });
});

app.delete('/friends/:uid/notes/:noteid', ensureLoggedIn, function(req, res){
    var noteId = req.params.noteid;
    storage.deleteNote(req.params.noteid, req.cookies.twitter_id,  
    function(err, note) {
        if (err) {
            return res.status(500).send(err);
        }
        res.sendStatus(200);
    });
});

app.use(express.static(__dirname + '/public'));

app.listen(config.port, function () {
    console.log("Server listening on localhost:%s", config.port);
    console.log("OAuth callback: " + url.parse(config.oauth_callback).hostname + url.parse(config.oauth_callback).path);
});
