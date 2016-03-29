angular.module('scheduler', ['sdGridModule'])

.controller('tmpCtrl', [
    '$scope', '$http',
    function($scope, $http) {
        $scope.zoom = 4;

        $http.get('api/entities2.json').then(function(response) {
            $scope.sampleData = response.data;
        })

        $scope.increaseZoom = function() {
            $scope.hoursPerCell = zoomScale[Math.min(zoomScale.length - 1, zoomScale.indexOf($scope.hoursPerCell) + 1)];
        };

        $scope.decreaseZoom = function() {
            $scope.hoursPerCell = zoomScale[Math.max(0, zoomScale.indexOf($scope.hoursPerCell) - 1)];
        };

        $scope.dates = {
            from: new Date(2016, 2, 30),
            to: new Date(2016, 2, 31)
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
