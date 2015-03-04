'use strict';

angular.module('gameApp.gameplay', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/gameplay', {
    templateUrl: 'gameplay/gameplay.html',
    controller: 'GameplayController'
  });
}])

.controller('GameplayController', ['$scope', 'CurrentGame', 'Gamecore', '$location', function GameplayController($scope, currentGame, gamecore, $location) {

    $scope.socket = window.socket;

    $scope.$on('$locationChangeStart', function( event ) {
        $scope.socket.send('q');
    });

    $scope.createGameCore = function() {
        gamecore.createGame();
        // var playerself = gamecore.getPlayerSelf(); // todo remove this stuff

        var newUserId = currentGame.getUserId();
        gamecore.setPlayerSelfUserId(newUserId);
        // playerself.userid = newUserId;
        // playerself.info_color = '#cc0000';
        // playerself.state = 'connected';
        // playerself.online = true;

        var gameId = currentGame.getGameId();
        if (gameId) {
            $scope.socket.send('j.' + gameId);
        }
    };

    $scope.quitToLobby = function() {
        $location.path('/lobby');
    };
}]);

