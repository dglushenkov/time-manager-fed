angular.module('shdGridModule')

.directive('shdGridEntityPerson', [
    'shdGridHelper', 'shdGridConst',
    function(shdGridHelper, shdGridConst) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/entity-person.html',
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