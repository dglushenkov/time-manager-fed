angular.module('shdGridModule')

.directive('shdGridEntity', [
    'shdGridHelper', 'shdGridConst',
    function(shdGridHelper, shdGridConst) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/grid-entity.html',
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