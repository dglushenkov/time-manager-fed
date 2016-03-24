angular.module('gridModule')

.directive('tmGrid', [
    'gridHelper', 'gridConstants',
    function(gridHelper, gridConstants) {

    return {
        restrict: 'AE',
        scope: {
            data: '=gridData',
            dates: '=',
            viewMode: '='
        },
        replace: true,
        templateUrl: 'views/grid/grid.html',
        link: function(scope, iElement) {
            scope.cellHeight = gridConstants.CELL_HEIGHT;

            scope.$watchGroup(['dates', 'viewMode'], function() {
                initRulers();
            }, true);

            scope.$watch('viewMode', function(oldVal, newVal) {
                if (oldVal.isScrollable != newVal.isScrollable) {
                    changeViewMode();
                }
            }, true);

            iElement.find('.tm-grid-body').on('scroll', onGridBodyScroll);

            function changeViewMode() {
                if (scope.viewMode.isScrollable) {
                    var fullWidth = gridConstants.CELL_WIDTH * 
                        (scope.dates.to - scope.dates.from) / 3600000 / 
                        scope.viewMode.hoursPerCell;

                    iElement.find(
                        '.tm-grid-x-axis .time-labels, ' +
                        '.tm-grid-x-axis .day-labels, ' +
                        '.tm-grid-ranges-wrapper'
                        )
                        .width(fullWidth);
                } else {
                    iElement.find(
                        '.tm-grid-x-axis .time-labels, ' +
                        '.tm-grid-x-axis .day-labels, ' +
                        '.tm-grid-ranges-wrapper'
                        )
                        .width('');
                }

                iElement.toggleClass('scrollable', scope.viewMode.isScrollable);
                initRulers();
            }

            function onGridBodyScroll(e) {
                if (scope.viewMode.isScrollable) {
                    iElement.find('.tm-grid-x-axis')
                        .scrollLeft($(this).scrollLeft());
                }

                iElement.find('.tm-grid-y-axis')
                    .scrollTop($(this).scrollTop());
            }

            function initRulers() {
                var rulerContainer = iElement.find('.tm-grid-ruler')
                    .html('');
                var timeLabelsContainer = iElement.find('.tm-grid-x-axis .time-labels')
                    .html('');
                var interval = 3600000 * scope.viewMode.hoursPerCell;
                var datesDiff = scope.dates.to - scope.dates.from;

                var cellWidth = '';
                if (!scope.viewMode.isScrollable) {
                    cellWidth = 100 / datesDiff * interval + '%';
                } else {
                    cellWidth = gridConstants.CELL_WIDTH + 'px';
                }

                var timeLabelsHtml = '';
                var rulerHtml = '';
                var timeCounter = scope.dates.from;

                while (timeCounter < scope.dates.to) {
                    timeLabelsHtml += gridConstants.TIME_LABEL_TPL
                        .replace('%t', gridHelper.timeToHhmm(timeCounter))
                        .replace('%w', cellWidth);
                    rulerHtml += gridConstants.RULER_TPL
                        .replace('%w', cellWidth);
                    timeCounter = new Date(+timeCounter + interval);
                }

                rulerContainer.html(rulerHtml);
                timeLabelsContainer.html(timeLabelsHtml);
            }
        }
    }
}]);