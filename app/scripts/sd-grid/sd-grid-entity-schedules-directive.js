angular.module('sdGridModule')

.directive('sdGridEntitySchedules', [
    'sdGridHelper', 'sdGridConstants',
    function(sdGridHelper, sdGridConstants) {

        return {
            restrict: 'AE',
            templateUrl: 'views/sd-grid/entity-schedules.html',
            replace: true,
            scope: {
                entity: '=',
                dates: '='
            },
            link: function(scope, iElement) {
                $(iElement).data('scope-link', scope);
            }
        }
}]);