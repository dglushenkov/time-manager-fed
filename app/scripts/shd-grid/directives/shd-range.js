angular.module('shdGridModule')

.directive('shdRange', [
    'shdDatetimeHelper',
    function(shdDatetimeHelper) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/range.html',
            scope: {
                rangeExpr: '=',
                gridDates: '=',
            },
            link: function(scope, iElement) {
                scope.rangeItems = shdDatetimeHelper.parseRangeDatesStr(scope.rangeExpr, scope.gridDates, scope.$parent.$parent.entity.timezone) || [];
            }
        }
}]);