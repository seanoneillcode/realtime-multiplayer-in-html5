'use strict';

angular.module('gameApp').factory('Gamecore', function () {

    var keyboard;

    var createGame = function() {
        
        keyboard = new THREEx.KeyboardState();
        var game = new game_core(window.socket, undefined, keyboard);

        //Fetch the viewport
        game.viewport = document.getElementById('viewport');
            
        //Adjust their size
        game.viewport.width = game.world.width;
        game.viewport.height = game.world.height;

        //Fetch the rendering contexts
        game.ctx = game.viewport.getContext('2d');

        //Set the draw style for the font
        game.ctx.font = '11px "Helvetica"';

        //Finally, start the loop
        game.update( new Date().getTime() );

        var playerColor = localStorage.getItem('playerColor') || '#ffffff';
        var playerName = localStorage.getItem('playerName') || 'Anon';
        game.changeName(playerName, playerColor);
        
        return game;
    }

    var game = createGame();

    return {
        getPlayerSelf: function () {
            return game.playerself;
        },
        resetGame: function () {
            if (keyboard) {
                keyboard.destroy();
            }
            game = createGame();
        }
    };
});