angular.module('sdGridModule')

.directive('sdRange', [
    'sdGridHelper', 'sdGridConstants',
    function(sdGridHelper, sdGridConstants) {

    return {
        restrict: 'AE',
        templateUrl: 'views/sd-grid/range.html',
        scope: {
            rangeExpr: '=',
            gridDates: '='
        },
        link: function(scope, iElement) {
            scope.rangeItems = sdGridHelper.parseRangeDatesExpr(scope.rangeExpr, scope.gridDates);
        }
    }
}]);