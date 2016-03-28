angular.module('sdGridModule')

// sd-grid directive
.directive('sdGrid', [
    'sdGridHelper', 'sdGridConstants',
    function(sdGridHelper, sdGridConstants) {

    return {
        restrict: 'AE',
        scope: {
            data: '=gridData',
            dates: '=',
            hoursPerCell: '='
        },
        replace: true,
        templateUrl: 'views/sd-grid/grid.html',

        link: function(scope, iElement) {

            // Grid areas
            gridAreas = {
                gridBody: iElement.find('.sd-grid-body'),
                gridRuler: iElement.find('.sd-grid-ruler'),
                yAxis: iElement.find('.sd-grid-y-axis'),
                xAxis: iElement.find('.sd-grid-x-axis'),
                xAxisTime: iElement.find('.sd-grid-x-axis .time-labels'),
                xAxisDay: iElement.find('.sd-grid-x-axis .day-labels'),
                rangesWrapper: iElement.find('.sd-grid-ranges-wrapper'),
                scrollPlaceholder: iElement.find('.sd-grid-scroll-placeholder'),
                rulerContainer: iElement.find('.sd-grid-ruler'),
            };

            gridOptions = {};

            // Watchers
            scope.$watch('hoursPerCell', function(hoursPerCell) {
                gridOptions.cellCount = (scope.dates.to - scope.dates.from) / 3600000 / 
                    hoursPerCell;
                gridOptions.isScrollable = needScroll();

                drawRulers();
            });

            scope.cellHeight = sdGridConstants.CELL_HEIGHT;
            scope.gridHeight = 700;

            iElement.find('.sd-grid-body').on('scroll', onGridBodyScroll);

            gridAreas.scrollPlaceholder.width(sdGridConstants.SCROLLBAR_WIDTH);
            gridAreas.yAxis.height(700 - sdGridConstants.SCROLLBAR_WIDTH);


            function needScroll() {
                return gridOptions.cellCount * sdGridConstants.CELL_WIDTH > gridAreas.gridBody.width() - sdGridConstants.SCROLLBAR_WIDTH;
            }

            function onGridBodyScroll(e) {
                gridAreas.xAxis.scrollLeft(gridAreas.gridBody.scrollLeft());
                gridAreas.yAxis.scrollTop(gridAreas.gridBody.scrollTop());
            }

            // Draw grid rulers
            function drawRulers() {
                var timeLabelsHtml = '';
                var rulerHtml = '';
                var interval = (scope.dates.to - scope.dates.from) / gridOptions.cellCount;

                var timeCounter = new Date(scope.dates.from.getTime());
                for (var i = 0; i < gridOptions.cellCount; i++) {
                    timeLabelsHtml += sdGridConstants.TIME_LABEL_TPL
                        .replace('%t', sdGridHelper.timeToHhmm(timeCounter))
                    rulerHtml += sdGridConstants.RULER_TPL;

                    timeCounter = new Date(timeCounter.getTime() + interval);
                }

                gridAreas.rulerContainer.html(rulerHtml);
                gridAreas.xAxisTime.html(timeLabelsHtml);

                var cellWidth = (gridOptions.isScrollable) ? '' : 100 / gridOptions.cellCount + '%';
                var fullWidth = (gridOptions.isScrollable) ? sdGridConstants.CELL_WIDTH * gridOptions.cellCount : '';

                gridAreas.rulerContainer
                    .add(gridAreas.xAxisTime)
                    .add(gridAreas.xAxisDay)
                    .add(gridAreas.rangesWrapper)
                    .width(fullWidth);
                $(gridAreas.xAxisTime).find('.sd-grid-time-label').css('width', cellWidth);
                $(gridAreas.rulerContainer).find('.sd-ruler-item').css('width', cellWidth);
            }
        }
    }
}]);