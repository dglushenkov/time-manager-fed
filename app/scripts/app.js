angular.module('scheduler', ['sdGridModule'])

.controller('tmpCtrl', [
    '$scope', '$http',
    function($scope, $http) {
        $scope.zoomScale = [0.25, 0.5, 1, 2, 4, 8];
        $scope.currentZoomInd = 2;

        $scope.$watch('currentZoomInd', function(value) {
            $scope.hoursPerCell = $scope.zoomScale[$scope.currentZoomInd];
        });

        $scope.isSamples1 = true;
        $scope.$watch('isSamples1', function() {
            var samplesFile = ($scope.isSamples1) ? 'api/entities1.json' : 'api/entities2.json';

            $http.get(samplesFile).
                success(function(response) {
                    $scope.sampleData = response;
            });
        });

        $scope.isRangeChanged = false;
        $scope.$watch('isRangeChanged', function() {
            var ranges = ($scope.isRangeChanged) ?
                [
                    "-8:00-5:30",
                    "-15:00-2:30"
                ] :
                [
                    "-11:00-5:30",
                    "-17:00-2:30"
                ];

            if ($scope.sampleData) {
                $scope.sampleData[0].schedules[0].ranges = ranges;
            }
        });

        $scope.increaseZoom = function() {
            $scope.currentZoomInd = Math.min($scope.zoomScale.length - 1, $scope.currentZoomInd + 1);
        };

        $scope.decreaseZoom = function() {
            $scope.currentZoomInd = Math.max(0, $scope.currentZoomInd - 1);
        };

        $scope.dates = {
            from: new Date(2016, 2, 28),
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
