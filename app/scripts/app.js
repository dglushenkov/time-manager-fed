angular.module('scheduler', ['sdGridModule'])

.controller('tmpCtrl', [
    '$scope', '$http',
    function($scope, $http) {
        var zoomScale = [0.25, 0.5, 1, 2, 4, 8];

        $http.get('api/entities1.json').then(function(response) {
            $scope.sampleData = response.data;
        })

        $scope.increaseZoom = function() {
            $scope.hoursPerCell = zoomScale[Math.min(zoomScale.length - 1, zoomScale.indexOf($scope.hoursPerCell) + 1)];
        };

        $scope.decreaseZoom = function() {
            $scope.hoursPerCell = zoomScale[Math.max(0, zoomScale.indexOf($scope.hoursPerCell) - 1)];
        };

        $scope.dates = {
            from: new Date(2016, 2, 29),
            to: new Date(2016, 2, 30)
        };

        $scope.hoursPerCell = 1;
        $scope.switchZoom = function() {
            $scope.hoursPerCell = ($scope.hoursPerCell == 1) ? 0.5 : 1;
        }

        $scope.switchSamples = function() {
            $scope.isSamples1 = !$scope.isSamples1;
        }

        $scope.edit = function() {
            $scope.isRangeChanged = !$scope.isRangeChanged;
        }

}]);
