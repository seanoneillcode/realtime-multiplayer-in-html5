/*  Copyright (c) 2012 Sven "FuzzYspo0N" Bergström
    
    written by : http://underscorediscovery.com
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.
*/

    var game_server = module.exports = { games : {}, game_count:0 };
    var UUID        = require('node-uuid');
    var _           = require('lodash');
    var verbose     = true;

    //Since we are sharing code with the browser, we
    //are going to include some values to handle that.
    global.window = global.document = global;

    //Import shared game library code.
    require('./gamePlayer.js');
    require('./game.core.js');

    //A simple wrapper for logging so we can toggle it,
    //and augment it for clarity.
    game_server.log = function() {
        if (verbose) console.log.apply(this,arguments);
    };

    game_server.fake_latency = 0;
    game_server.local_time = 0;
    game_server._dt = new Date().getTime();
    game_server._dte = new Date().getTime();
        //a local queue of messages we delay if faking latency
    game_server.messages = [];
    game_server.defaultNumPlayers = 2;
    game_server.lobbyListeners = [];

    setInterval(function() {
        game_server._dt = new Date().getTime() - game_server._dte;
        game_server._dte = new Date().getTime();
        game_server.local_time += game_server._dt/1000.0;
    }, 4);

    // cover used to fake latency by using a queue and delay
    game_server.onMessage = function(client,message) {

        if (this.fake_latency && message.split('.')[0].substr(0,1) == 'i') {

                //store all input message
            game_server.messages.push({client:client, message:message});

            setTimeout(function() {
                if (game_server.messages.length) {
                    game_server._onMessage( game_server.messages[0].client, game_server.messages[0].message );
                    game_server.messages.splice(0,1);
                }
            }.bind(this), this.fake_latency);

        } else {
            game_server._onMessage(client, message);
        }
    };
    
    game_server._onMessage = function(client, message) {

            //Cut the message up into sub components
        var message_parts = message.split('.');
            //The first is always the type of message
        var message_type = message_parts[0];

        if(message_type == 'i') {
                //Input handler will forward this
            this.onInput(client, message_parts);
        } else if(message_type == 'p') {
            client.send('s.p.' + message_parts[1]);
        } else if(message_type == 'l') {
            this.sendOpenGameList(client);
        } else if(message_type == 'b') {    //Client changed their color!
            this.broadcastPlayerData(client, message_parts[1], message_parts[2]);
        } else if(message_type == 'c') {    //make a new game
            this.makeGameAndJoinIt(client, message_parts[1], message_parts[2]);
        } else if(message_type == 'q') {    //make a new game
            this.removePlayerFromGame(client);
        } else if(message_type == 'j') {    //go into new game
            this.getAndjoinGame(client, message_parts[1]);
        } else if(message_type == 'b') {    //Client changed their color!
            this.broadcastName(client, message_parts[1]);
        } else if(message_type == 'f') {    //A client is asking for lag simulation
            this.fake_latency = parseFloat(message_parts[1]);
        }

    };

    game_server.removePlayerFromGame = function(client) {
        if (client.game) {
            client.game.players = _.filter(client.game.players, function (player) {
                return player.userid != client.userid;
            });
            _.forEach(client.game.players, function (player) {
                player.send('s.r.' + client.userid);
            });
            if (client.game.players.length < 1) {
                this.endGame(client.game);
            }
            client.game = undefined;
        }
        this.lobbyListeners.push(client);
        this.notifyLobbyListeners();
    };

    game_server.removeLobbyListener = function(userid) {
        game_server.lobbyListeners = _.filter(game_server.lobbyListeners, function(client) {
            return client.userid !== userid;
        });
    };

    game_server.getAndjoinGame = function(client, gameid) {
        var game = this.games[gameid];
        if (game && game.players.length < game.maxNumPlayers) {
            console.log("joining game ");
            var player = game.serverGamecore.get_player(game.serverGamecore.players, client.userid);
            if (!player) {
                this.joinGame(client, game);
            }
        } else {
            console.log("game with id not found, id=", gameid);
        }
    };

    game_server.getOpenGameList = function() {
        openGames = [];
        var self = this;
        for(var gameid in this.games) {
                //only care about our own properties.
            if(!this.games.hasOwnProperty(gameid)) continue;
                //get the game we are checking against
            var game_instance = this.games[gameid];
            if (game_instance.players.length < game_instance.maxNumPlayers) {
                openGames.push({
                    id: game_instance.id,
                    name: game_instance.name,
                    currentPlayers: game_instance.players.length,
                    maxNumPlayers: game_instance.maxNumPlayers
                });
            }
        }
        return openGames;
    }

    game_server.sendOpenGameList = function(client) {
        var openGames = this.getOpenGameList();
        console.log("number of open games are ", openGames.length);
        client.emit('ongamelist', openGames);
    };

    game_server.makeGameAndJoinIt = function(client, name, numPlayers) {
        this.createGame(client, name, numPlayers);
    };

    game_server.broadcastPlayerData = function(client, name, color) {
        if (client && client.game && client.game.serverGamecore) {
            var player = client.game.serverGamecore.get_player(client.game.serverGamecore.players, client.userid);
            if (player) {
                player.name = name;
                player.color = color;
            }
            _.forEach(client.game.players, function (player) {
                player.send('s.b.' + client.userid + '.' + name + '.' + color);
            });
        }
    };

    game_server.onInput = function(client, parts) {
            //The input commands come in like u-l,
            //so we split them up into separate commands,
            //and then update the players
        var input_commands = parts[1].split('-');
        var input_time = parts[2].replace('-','.');
        var input_seq = parts[3];

            //the client should be in a game, so
            //we can tell that game to handle the input
        if (client && client.game && client.game.serverGamecore) {
            client.game.serverGamecore.handle_server_input(client, input_commands, input_time, input_seq);
        } else {
            console.log("received input from client but can't handle it ", client.game);
        }

    };

    // http://stackoverflow.com/questions/14636536/how-to-check-if-a-variable-is-an-integer-in-javascript
    game_server.isInt = function (value) {
        return !isNaN(value) && (function(x) { return (x | 0) === x; })(value);
    };

    game_server.createGame = function(client, gameName, numPlayers) {

        var actualNumPlayers = parseFloat(numPlayers);
        if (!this.isInt(actualNumPlayers)) {
            actualNumPlayers = this.defaultNumPlayers;
        }

        var gamePlayers = [];
        var player = new gamePlayer(client);
        gamePlayers.push(player);

        var game = {
                id : UUID(),
                name: gameName,
                players: gamePlayers,
                maxNumPlayers: actualNumPlayers,
                serverGamecore: undefined
            };

        game.serverGamecore = new game_core(undefined, gamePlayers);
        game.serverGamecore.update(new Date().getTime());

        client.game = game;

        this.games[game.id] = game;
        this.game_count++;

        player.send('s.h.'+ String(game.serverGamecore.local_time).replace('.','-'));
        console.log('server host at  ' + game.serverGamecore.local_time);
        this.log('player ' + player.userid + ' created a game with id ' + game.id);
        this.notifyLobbyListeners();
    };

    game_server.notifyLobbyListeners = function() {
        var openGames = this.getOpenGameList();
        var listeners = this.lobbyListeners;
        _.forEach(this.lobbyListeners, function(listener) {
            listener.emit("ongamelist", openGames);
        });
    };

    game_server.startGame = function(game) {
        console.log("start, availgame players length ", game.players.length);
        game.serverGamecore.intializeGame();
        var self = this;
        _.forEach(game.players, function (player) {
            player.send('s.s.' + String(game.serverGamecore.local_time).replace('.','-'));
            self.removeLobbyListener(player.userid);
        });
    };

    game_server.joinGame = function(client, game) {
        var p = new gamePlayer(client);
        game.players.push(p);
        client.game = game;
        _.forEach(game.players, function(player) {
            if (player.userid !== p.userid) {
                player.send('s.a.' + p.userid + '.' + p.name);
                p.send('s.a.' + player.userid + '.' + player.name);
            }
        });
        console.log("join, availgame players length", game.players.length);
        console.log("availableGame.players.length ", game.players.length);
        console.log("this.maxNumPlayers ", game.maxNumPlayers);
        if (game.players.length === game.maxNumPlayers) {
            this.startGame(game);
        }
        this.notifyLobbyListeners();
    };

    game_server.endGame = function(game) {
        if(game) {
            game.serverGamecore.stop_update();
            _.forEach(game.players, function(player) {
                player.send('s.e');
            });
            delete this.games[game.id];
            this.game_count--;
            this.log('game removed. there are now ' + this.game_count + ' games' );
        } else {
            this.log('that game was not found!');
        }
    };

    // used by game instances to update
    var frame_time = 60/1000; // run the local game at 16ms/ 60hz
    if('undefined' != typeof(global)) frame_time = 45; //on server we run at 45ms, 22hz

    ( function () {

        var lastTime = 0;
        var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

        for ( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++ x ) {
            window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
            window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ] || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
        }

        if ( !window.requestAnimationFrame ) {
            window.requestAnimationFrame = function ( callback, element ) {
                var currTime = Date.now(), timeToCall = Math.max( 0, frame_time - ( currTime - lastTime ) );
                var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
                lastTime = currTime + timeToCall;
                return id;
            };
        }

        if ( !window.cancelAnimationFrame ) {
            window.cancelAnimationFrame = function ( id ) { clearTimeout( id ); };
        }

    }() );

