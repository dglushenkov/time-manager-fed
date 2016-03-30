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
            zoom: '=',
            height: '@',
        },
        templateUrl: 'views/sd-grid/grid.html',

        link: function(scope, iElement) {

            // ====================================================================================
            // Grid areas
            // ====================================================================================
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


            // ====================================================================================
            // Init grid elements
            // ====================================================================================

            // Internal grid variables container
            gridOptions = {};
            scope.sortReverse = false;
            scope.datepicker = {
                isOpen: false,
                open: function() {
                    scope.datepicker.isOpen = true;
                    console.log('123');
                }
            }
            scope.date = new Date();

            gridAreas.body.height(scope.height);
            gridAreas.yAxis.height(scope.height);
            gridAreas.scrollPlaceholderHorz.width(sdGridConstants.SCROLLBAR_WIDTH);
            gridAreas.scrollPlaceholderVert.height(sdGridConstants.SCROLLBAR_WIDTH);
            gridAreas.rulers.css('min-height', scope.height - sdGridConstants.SCROLLBAR_WIDTH);
            gridAreas.nowMarker.css('min-height', scope.height - sdGridConstants.SCROLLBAR_WIDTH);
            scope.schedulesCounter = 0;
            gridOptions.nowMarker = initNowMarker();


            // ====================================================================================
            // Watchers
            // ====================================================================================
            scope.$watch('hoursPerCell', function(value) {
                var gridHorzScrollFactor = gridAreas.body.scrollLeft() / gridAreas.body.get(0).scrollWidth;

                gridOptions.cellCount = (scope.dates.to - scope.dates.from) / sdGridConstants.HOUR_MILISEC / value;
                gridOptions.isScrollable = needScroll();

                drawRulers();
                gridAreas.body.scrollLeft(gridHorzScrollFactor * gridAreas.body.get(0).scrollWidth);
            });

            scope.$watch('zoom', function(value) {
                var newZoom = value;
                newZoom = Math.min(sdGridConstants.ZOOM_SCALE.length - 1, newZoom);
                newZoom = Math.max(0, newZoom);
                scope.zoom = newZoom;
                scope.hoursPerCell = sdGridConstants.ZOOM_SCALE[newZoom];
            })


            // ====================================================================================
            // Event bindings
            // ====================================================================================
            // Bind x and y axis scroll to grid scroll
            gridAreas.body.on('scroll', function() {
                gridAreas.xAxis.scrollLeft(gridAreas.body.scrollLeft());
                gridAreas.yAxis.scrollTop(gridAreas.body.scrollTop());
            });

            // drag'n'scroll on grid mousedown event
            gridAreas.body.on('mousedown.dragScroll', sdGridHelper.onGridMouseDown);

            // Check if grid needs horizontal scroll after window resize
            $(window).on('resize', function() {
                var needScrollNow = needScroll();
                if (needScrollNow != gridOptions.isScrollable) {
                    gridOptions.isScrollable = needScrollNow;
                    drawRulers();
                }
            });

            // Expand person shedules
            iElement.on('click', '.sd-grid-y-item-title', function(e) {
                var scope = $(e.target).parents('.sd-grid-y-item').data('scope-link');
                scope.$apply(function() {
                    scope.entity.isExpanded = !scope.entity.isExpanded;
                });
            });

            // Y axis mousewheel scroll
            iElement.on('mousewheel', '.sd-grid-y-axis', function(e) {
                var dy = e.deltaFactor * e.deltaY;
                gridAreas.body.scrollTop(gridAreas.body.scrollTop() - dy);
            });


            // ====================================================================================
            // Scope methods
            // ====================================================================================
            scope.setZoom = function(value) {
                scope.zoom += value;
            }

            scope.toggleSort = function() {
                scope.sortReverse = !scope.sortReverse;
            }


            // ====================================================================================
            // Service funcitons
            // ====================================================================================
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