'use strict';

angular.module('gameApp.lobby', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/lobby', {
    templateUrl: 'lobby/lobby.html',
    controller: 'LobbyController'
  });
}])

.controller('LobbyController', ['$scope', 'CurrentGame', '$location', function LobbyController($scope, currentGame, $location) {

    $scope.socket = window.socket;
    $scope.userid = currentGame.getUserId();
    $scope.gameName = "my game";
    $scope.gameNumPlayers = 2;
    $scope.gameNumAsteroids = 2;

    $scope.socket.on('ongamelist', function (message) {
        $scope.$apply(function() {
            $scope.games = message ? message : [];
        });
    });

    $scope.socket.on('onconnected', function(data) {
        $scope.playerColor = localStorage.getItem('playerColor') || '#ffffff';
        $scope.playerName = localStorage.getItem('playerName') || 'Anon';
        $scope.$apply(function() {
            $scope.userid = data.userid;
        });
        currentGame.setUserId(data.userid);
        $scope.socket.send('d.' + $scope.playerName + "." + $scope.playerColor);
    });

    $scope.createGame = function() {
        $scope.socket.send('c.' + $scope.gameName + "." + $scope.gameNumPlayers + "." + $scope.gameNumAsteroids);
        $location.path('/gameplay');
    };
    
    $scope.getGamesList = function() {
        $scope.socket.send('l');
    };

    $scope.joinGame = function(game) {
        currentGame.setGameId(game.id);
        $location.path('/gameplay');
    };

}]);

