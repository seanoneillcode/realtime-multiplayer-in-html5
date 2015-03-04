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

    $scope.socket.on('ongamelist', function (message) {
        $scope.$apply(function() {
            $scope.games = message ? message : [];
        });
    });

    $scope.socket.on('onconnected', function(data) {
        $scope.$apply(function() {
            $scope.userid = data.userid;
        });
        currentGame.setUserId(data.userid);
    });

    $scope.createGame = function() {
        $scope.socket.send('c.' + $scope.gameName + "." + $scope.gameNumPlayers);
        $location.path('/gameplay');
    };
    
    $scope.getGamesList = function() {
        // if (currentGame.getUserId() === '') {
            
        // }

        $scope.socket.send('l');
    };

    $scope.joinGame = function(game) {
        currentGame.setGameId(game.id);
        $location.path('/gameplay');
    };

}]);

