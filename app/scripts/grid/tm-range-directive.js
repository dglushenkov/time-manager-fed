angular.module('gridModule')

.directive('tmRange', [
    'gridHelper', 'gridConstants',
    function(gridHelper, gridConstants) {

    return {
        restrict: 'AE',
        templateUrl: 'views/grid/range.html',
        replace: true,
        link: function(scope, iElement) {
            var elementSize = gridHelper.getRangeItemSize(
                scope.dates, 
                gridHelper.parseTimeRange(scope.range)
            );

            iElement.css({
                width: elementSize.width + '%',
                left: elementSize.left + '%'
            });
        }
    }
}]);