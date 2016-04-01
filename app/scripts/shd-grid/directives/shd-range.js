angular.module('shdGridModule')

.directive('shdRange', [
    'shdGridHelper', 'shdGridConst',
    function(shdGridHelper, shdGridConst) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/range.html',
            scope: {
                rangeExpr: '=',
                gridDates: '=',
            },
            link: function(scope, iElement) {
                scope.rangeItems = shdGridHelper.parseRangeDatesStr(scope.rangeExpr, scope.gridDates, scope.$parent.$parent.entity.timezone) || [];
            }
        }
}]);