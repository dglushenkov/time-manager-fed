angular.module('sdGridModule')

.directive('sdGridEntityPerson', [
    'sdGridHelper', 'sdGridConstants',
    function(sdGridHelper, sdGridConstants) {

        return {
            restrict: 'AE',
            templateUrl: 'views/sd-grid/entity-person.html',
            replace: true,
            scope: {
                entity: '='
            },
            link: function(scope, iElement) {
                $(iElement).data('scope-link', scope);
                scope.entity.isExpanded = false;
            }
        }
}]);