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
            hoursPerCell: '=',
            height: '@',
        },
        replace: true,
        templateUrl: 'views/sd-grid/grid.html',

        link: function(scope, iElement) {

            // Grid areas
            gridAreas = {
                body: iElement.find('.sd-grid-body'),
                rulers: iElement.find('.sd-grid-ruler'),
                yAxis: iElement.find('.sd-grid-y-axis'),
                xAxis: iElement.find('.sd-grid-x-axis'),
                xAxisTime: iElement.find('.sd-grid-x-axis .axis-time'),
                xAxisDay: iElement.find('.sd-grid-x-axis .axis-day'),
                rangesWrapper: iElement.find('.sd-grid-ranges-wrapper'),
                scrollPlaceholderHorz: iElement.find('.sd-grid-scroll-placeholder-horz'),
                scrollPlaceholderVert: iElement.find('.sd-grid-scroll-placeholder-vert'),
                nowMarker: iElement.find('.sd-grid-now-marker')
            };

            // Internal grid variables container
            gridOptions = {};

            gridAreas.body.height(scope.height);
            gridAreas.yAxis.height(scope.height);
            gridAreas.scrollPlaceholderHorz.width(sdGridConstants.SCROLLBAR_WIDTH);
            gridAreas.scrollPlaceholderVert.height(sdGridConstants.SCROLLBAR_WIDTH);
            gridAreas.rulers.css('min-height', scope.height - sdGridConstants.SCROLLBAR_WIDTH);
            scope.schedulesCounter = 0;
            gridOptions.nowMarker = initNowMarker();

            // Watchers
            scope.$watch('hoursPerCell', function(newValue, oldValue) {
                if (oldValue != undefined && newValue > oldValue && !gridOptions.isScrollable) {
                    scope.hoursPerCell = oldValue;
                    return;
                }

                var gridHorzScrollFactor = gridAreas.body.scrollLeft() / gridAreas.body.get(0).scrollWidth;

                gridOptions.cellCount = (scope.dates.to - scope.dates.from) / sdGridConstants.HOUR_MILISEC / newValue;
                gridOptions.isScrollable = needScroll();

                drawRulers();
                gridAreas.body.scrollLeft(gridHorzScrollFactor * gridAreas.body.get(0).scrollWidth);
            });

            // Bind x and y axis scroll to grid scroll
            iElement.find('.sd-grid-body').on('scroll', function() {
                gridAreas.xAxis.scrollLeft(gridAreas.body.scrollLeft());
                gridAreas.yAxis.scrollTop(gridAreas.body.scrollTop());
            });

            // Check if grid needs horizontal scroll after window resize
            $(window).on('resize', function() {
                var needScrollNow = needScroll();
                if (needScrollNow != gridOptions.isScrollable) {
                    gridOptions.isScrollable = needScrollNow;
                    drawRulers();
                }
            });

            // Draw grid rulers
            function drawRulers() {
                var xAxisTimeHtml = '';
                var rulerHtml = '';
                var timeInterval = (scope.dates.to - scope.dates.from) / gridOptions.cellCount;

                var timeCounter = new Date(scope.dates.from.getTime());
                for (var i = 0; i < gridOptions.cellCount; i++) {
                    xAxisTimeHtml += sdGridConstants.TIME_LABEL_TPL
                        .replace('%t', sdGridHelper.timeToHhmm(timeCounter))
                    rulerHtml += sdGridConstants.RULER_TPL;

                    timeCounter = new Date(timeCounter.getTime() + timeInterval);
                }

                gridAreas.rulers.html(rulerHtml);
                gridAreas.xAxisTime.html(xAxisTimeHtml);

                var cellWidth = (gridOptions.isScrollable) ? '' : 100 / gridOptions.cellCount + '%';
                var totalWidth = (gridOptions.isScrollable) ? sdGridConstants.CELL_WIDTH * gridOptions.cellCount : '';

                gridAreas.rulers
                    .add(gridAreas.xAxisTime)
                    .add(gridAreas.xAxisDay)
                    .add(gridAreas.rangesWrapper)
                    .width(totalWidth);
                $(gridAreas.xAxisTime).find('.sd-grid-axis-time-item').css('width', cellWidth);
                $(gridAreas.rulers).find('.sd-ruler-item').css('width', cellWidth);
            }

            // Checks if grid needs horizontal scroll
            function needScroll() {
                return gridOptions.cellCount * sdGridConstants.CELL_WIDTH > gridAreas.body.width() - sdGridConstants.SCROLLBAR_WIDTH;
            }


            // Initialize now marker timer
            function initNowMarker() {
                updateNowMarker();
                return setInterval(updateNowMarker, sdGridConstants.MIN_MILISEC);

                function updateNowMarker() {
                    var now = new Date();
                    var markerPos = (now - scope.dates.from) / (scope.dates.to - scope.dates.from) * 100; 
                    if (markerPos < 100 && markerPos > 0) {
                        gridAreas.nowMarker.css({
                            'left': markerPos + '%',
                            'display': 'block'
                        });
                    } else {
                        gridAreas.nowMarker.css('display', 'none');
                    }
                }
            }
        }
    }
}]);