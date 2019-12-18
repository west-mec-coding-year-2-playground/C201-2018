var url = require('url');
var express = require('express');
var querystring = require('querystring');
var async = require('async');
var authenticator = require('./authenticator.js');
var config = require('./config.json');
var app = express();

app.set('view engine', 'ejs');

app.use(require('cookie-parser')());

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
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.sendStatus(401);
    }
    var url = 'https://api.twitter.com/1.1/statuses/update.json';
    authenticator.post(url, credentials.access_token, credentials.access_token_secret, 
        {
            status: "Hello there Twitter RESTful API"
        },
        function (error, data) {
            if (error) {
                return res.status(400).send(error);
            }
            res.send('Tweet successful!');
        });
});

app.get('/search', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.sendStatus(401);
    }
    var url = 'https://api.twitter.com/1.1/search/tweets.json';
    var query = querystring.stringify({ q: 'BMW' });
    url += "?" + query;
    authenticator.get(url, credentials.access_token, credentials.access_token_secret, 
         function (error, data) {
            if (error) {
                return res.status(400).send(error);
            }
            res.send(data);
        });
});

app.get('/friends', function (req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.sendStatus(401);
    }
    var url = 'https://api.twitter.com/1.1/friends/list.json';
    if (req.query.cursor) {
        url += "?" + querystring.stringify({ cursor: req.query.cursor });
    }
    authenticator.get(url, credentials.access_token, credentials.access_token_secret, 
         function (error, data) {
            if (error) {
                return res.status(400).send(error);
            }
            res.send(data);
        });
});

app.get('/', function(req, res) {
    var credentials = authenticator.getCredentials();
    if (!credentials.access_token || !credentials.access_token_secret) {
        return res.redirect('/login');
    }
    console.log('Loading friends from Twitter');
    renderMainPageFromTwitter(req, res);
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
                url += "?" + querystring.stringify({ user_id: credentials.twitter_id, cursor: cursor});
                authenticator.get(url, credentials.access_token, credentials.access_token_secret, 
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
                authenticator.get(url, credentials.access_token, credentials.access_token_secret, 
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
             });
        }
    ]);
}

app.get('/login', function(req, res) {
    authenticator.clearCredentials();
    res.render('login'); 
});

app.get('/logout', function(req, res) {
    authenticator.clearCredentials();
    res.redirect('/login'); 
});

app.use(express.static(__dirname + '/public'));

app.listen(config.port, function () {
    console.log("Server listening on localhost:%s", config.port);
    console.log("OAuth callback: " + url.parse(config.oauth_callback).hostname + url.parse(config.oauth_callback).path);
});
