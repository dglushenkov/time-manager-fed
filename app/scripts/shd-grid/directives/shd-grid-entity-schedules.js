angular.module('shdGridModule')

.directive('shdGridEntitySchedules', [
    'shdGridHelper', 'shdGridConst',
    function(shdGridHelper, shdGridConst) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/entity-schedules.html',
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