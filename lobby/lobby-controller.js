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

    $scope.socket.on('ongamelist', function (message) {
        $scope.$apply(function() {
            $scope.games = message ? message : [];
        });
    });

    $scope.createGame = function() {
        $scope.socket.send('c');
        $location.path('/gameplay');
    };
    
    $scope.getGamesList = function() {
        if (currentGame.getUserId() === '') {
            $scope.socket.on('onconnected', function(data) {
                $scope.$apply(function() {
                    $scope.userid = data.userid;
                    currentGame.setUserId(data.userid);
                });
            });
        }
        $scope.socket.send('l');
    };

    $scope.joinGame = function(game) {
        currentGame.setGameId(game.id);
        $location.path('/gameplay');
    };
}]);

