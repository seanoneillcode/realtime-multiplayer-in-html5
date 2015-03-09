
'use strict';

angular.module('gameApp').controller('NameController', ['$scope', function NameController($scope) {
    $scope.clientName = 'Anon';
    $scope.playerColor = localStorage.getItem('playerColor') || '#ffffff';
    $scope.playerName = localStorage.getItem('playerName') || 'Anon';
    $scope.socket = window.socket;

    $scope.changeName = function() {
        localStorage.setItem("playerColor", $scope.playerColor);
        localStorage.setItem("playerName", $scope.playerName);
        $scope.socket.send('d.' + $scope.playerName + "." + $scope.playerColor);
    };

    // $scope.socket.on('onconnected', function(data) {
    //     $scope.$apply(function() {
    //         $scope.socket.send('s.b.' + $scope.playerName + "." + $scope.playerColor);
    //     });
    // });
}]);

