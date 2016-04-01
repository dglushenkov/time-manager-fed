angular.module('shdGridModule')

.directive('shdNavEntity', [
    'shdGridHelper', 'shdGridConst',
    function(shdGridHelper, shdGridConst) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/nav-entity.html',
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