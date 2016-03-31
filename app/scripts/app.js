angular.module('scheduler', ['shdGridModule'])

.controller('tmpCtrl', [
    '$scope', '$http',
    function($scope, $http) {
        $scope.zoom = 4;

        $http.get('api/entities2.json').then(function(response) {
            $scope.sampleData = response.data;
        })

        $scope.dates = {
            from: new Date(2016, 2, 31),
            to: new Date(2016, 2, 32)
        };

}]);
