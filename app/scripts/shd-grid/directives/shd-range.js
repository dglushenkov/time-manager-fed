angular.module('shdGridModule')

.directive('shdRange', [
    'shdGridHelper', 'shdGridConst',
    function(shdGridHelper, shdGridConst) {

        return {
            restrict: 'AE',
            templateUrl: 'views/shd-grid/range.html',
            scope: {
                rangeExpr: '=',
                gridDates: '='
            },
            link: function(scope, iElement) {
                var items = shdGridHelper.parseRangeDatesStr(scope.rangeExpr, scope.gridDates);

                for (var i = 0; i < items.length; i++) {
                    var sizes = shdGridHelper.getRangeItemSize(items[i], scope.gridDates);
                    items[i].width = sizes.width;
                    items[i].left = sizes.left;
                }

                scope.rangeItems = items;
                console.log(items);
            }
        }
}]);