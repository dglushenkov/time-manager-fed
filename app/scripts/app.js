angular.module('timeManager', ['gridModule'])

.controller('tmpCtrl', [
    '$scope', '$http',
    function($scope, $http) {

        $http.get('api/entities.json').
            success(function(response) {
                var res = response;
                for (var i = 0; i < 500; i++) {
                    response
                }

                $scope.sampleData = response;
        });

        $scope.dates = {
            from: new Date(2016, 2, 23),
            to: new Date(2016, 2, 24)
        };

        $scope.viewMode = {
            hoursPerCell: 1,
            isScrollable: false
        };

        $scope.isSamples1 = true;
        $scope.isDates1 = true;

        $scope.switchZoom = function() {
            $scope.viewMode.isScrollable = !$scope.viewMode.isScrollable;
            $scope.viewMode.hoursPerCell = ($scope.viewMode.hoursPerCell == 1) ? 0.25 : 1;
        }

        $scope.switchSamples = function() {
            $scope.isSamples1 = !$scope.isSamples1;
            var samples = ($scope.isSamples1) ? 'api/entities.json' : 'api/entities1.json';

            $scope.dates = ($scope.isSamples1) ? 
                {
                    from: new Date(2016, 2, 23),
                    to: new Date(2016, 2, 24)
                } :
                {
                    from: new Date(2016, 2, 23, 3),
                    to: new Date(2016, 2, 24, 3)
                }

            $http.get(samples).
                success(function(response) {
                    $scope.sampleData = response;
            });
        }
}]);
