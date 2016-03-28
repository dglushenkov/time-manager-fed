angular.module('sdGridModule')
.factory('sdGridHelper', ['sdGridConstants', function(gridConstants) {

    // Returns time label from date object
    // E.g. 10:45, 15:00
    function timeToHhmm(time) {
        return ('0' + time.getHours()).slice(-2) + ':' 
            + ('0' + time.getMinutes()).slice(-2);
    }

    function getRangeItemSize(rangeDates, gridDates) {
        return {
            width: 100 * (rangeDates.to - rangeDates.from) / (gridDates.to - gridDates.from) + '%',
            left: 100 * (rangeDates.from - gridDates.from) / (gridDates.to - gridDates.from) + '%'
        };
    }

    // Parse range string to range dates object
    function parseRangeDatesExpr(rangeExpr, gridDates) {
        var rangeExprParts = rangeExpr.split('-');
        var ranges = [];

        // RangeExpr is not periodical
        // E.g. 2016.03.02.13:00-05:30
        // Start at 2 March 2016 13.00, duration 5:30h
        if (rangeExprParts.length == 2) {
            var range = {};
            range.from = new Date(rangeExprParts[0]);
            range.to = new Date(range.from.getTime());
            var durationHhmm = rangeExprParts[1].split(':');
            range.to.setHours(range.from.getHours() + +durationHhmm[0], range.from.getMinutes() + +durationHhmm[1]);

            // Check if end time fits grid date span
            if (range.to > gridDates.to) {
                range.to = new Date(gridDates.to.getTime());
            }

            if (range.from >= gridDates.from) {
                ranges.push(getRangeItemSize(range, gridDates));
            }


        // Periodical expression
        // E.g. 'y = 2016&dw in 1,2,3,4,5-11:00-05:30'
        // Every Mn Ts Wd Th Fr in 2016 from 11:00 and duration 05:30
        } else {
            var conditions = {};
            var startHhmm = rangeExprParts[1].split(':');
            var durationHhmm = rangeExprParts[2].split(':');

            // If there are conditions
            if (rangeExprParts[0]) {

                // Split conditions by '&' symbol
                var conditionsParts = rangeExprParts[0].split('&');

                // For each condition get condition parts:
                // - identifier
                // - operator
                // - value
                for (var i = 0; i < conditionsParts.length; i++) {
                    conditionItemParts = conditionsParts[i].split(' ');
                    conditions[conditionItemParts[0]] = {
                        operator: conditionItemParts[1],
                        value: conditionItemParts[2]
                    }
                }
            }

            // Get all ranges fitting conditions and grid datetime interval 
            var rangeStart = getNextStart(conditions, gridDates.from, gridDates.to);
            while (rangeStart) {

                var range = {};
                range.from = new Date(rangeStart.getTime())
                range.from.setHours(+startHhmm[0], +startHhmm[1]);

                if (range.from >= gridDates.from) {
                    range.to = new Date(range.from.getTime());
                    range.to.setHours(range.to.getHours() + +durationHhmm[0], range.to.getMinutes() + +durationHhmm[1]);

                    if (range.to > gridDates.to) {
                        range.to = new Date(gridDates.to.getTime());
                    }

                    ranges.push(getRangeItemSize(range, gridDates));
                    var newStart = new Date(range.to);

                    if (range.from.getDate() == range.to.getDate()) {
                        newStart.setDate(newStart.getDate() + 1);
                    }

                    newStart.setMinutes(newStart.getMinutes() + 1);
                }

                rangeStart = getNextStart(conditions, newStart, gridDates.to);
            }
        }

        return ranges;

        function getNextStart(conditions, from, to) {
            var date = new Date(from.getTime());

            while(date < to) {
                // Check year
                if (conditions.y) {
                    if (!checkCondition(date.getFullYear(), conditions.y.operator, conditions.y.value)) {
                        date.setFullYear(date.getFullYear() + 1, 0);
                        continue;
                    }
                }

                // Check month
                if (conditions.m) {
                    if (!checkCondition(date.getMonth(), conditions.m.operator, conditions.m.value)) {
                        date.setMonth(date.getMonth() + 1, 1);
                        continue;
                    }
                }

                // Check week number in year
                if (conditions.w) {
                    if (!checkCondition(getWeek(date), conditions.w.operator, conditions.w.value)) {
                        date.setDate(date.getDate() + 7 - date.getDay());
                        continue;
                    }
                }

                // Check week number in month
                if (conditions.wm) {
                    if (!checkCondition(getWeek(date, true), conditions.wm.operator, conditions.wm.value)) {
                        date.setDate(date.getDate() + 7 - date.getDay());
                        continue;
                    }
                }

                // Check day in year
                if (conditions.dy){
                    if (!checkCondition(getDateInYear(date), conditions.dy.operator, conditions.dy.value)) {
                        date.setDate(date.getDate() + 1);
                        continue;
                    }
                }

                // Check day in week
                if (conditions.dw){
                    if (!checkCondition(date.getDay(), conditions.dw.operator, conditions.dw.value)) {
                        date.setDate(date.getDate() + 1);
                        continue;
                    }
                }

                // Check date
                if (conditions.d){
                    if (!checkCondition(date.getDate(), conditions.d.operator, conditions.d.value)) {
                        date.setDate(date.getDate() + 1);
                        continue;
                    }
                }

                return date;
            }
        }

        function getWeek(date, inMonth) {
            var firstWeek = new Date(date.getFullYear(), 0, 1);
            if (inMonth) {
                firstWeek.setMonth(date.getMonth());
            }
            firstWeek.setDate(-firstWeek.getDay());
            return Math.ceil((date - firstWeek) / sdGridConstants.WEEK_MILISEC) + 1;
        }

        function getDateInYear(date) {
            var yearStart = new Date(date.getFullYear(), 0, 1);
            return Math.ceil((date - yearStart) / sdGridConstants.DAY_MILISEC) + 1;
        }

        function checkCondition(value, operator, compareWith) {
            var result;

            switch(operator) {
                case '=':
                    result = value == +compareWith;
                    break;
                case '<':
                    result = value < +compareWith;
                    break;
                case '>':
                    result = value > +compareWith;
                    break;
                case '<=':
                    result = value <= +compareWith;
                    break;
                case '>=':
                    result = value >= +compareWith;
                    break;
                case '!=':
                    result = value != +compareWith;
                    break;
                case '/':
                    result = (value % compareWith) == 0;
                    break;
                case 'in':
                    var compareList = compareWith.split(',');
                    result = compareList.indexOf(value + '') != -1;
                    break;
                case '!in':
                    var compareList = compareWith.split(',');
                    result = compareList.indexOf(value + '') == -1;
                    break;
            }

            return result;
        }
    }

    function onGridMouseDown(e) {
        // var target = e.target
        // while (target != this) {
        //     if ($(target).hasClass('sd-grid-range')) return;
        //     target = target.parentNode;
        // }

        grid = $(this);
        gridDragScroll = {
            x: e.pageX,
            y: e.pageY,
            scrollLeft: grid.scrollLeft(),
            scrollTop: grid.scrollTop(),
            isBeginDrag: true
        };

        $(document).on('mousemove.dragScroll', function(e) {
            if (gridDragScroll.isBeginDrag) {
                var dx = Math.abs(e.pageX - gridDragScroll.x);
                var dy = Math.abs(e.pageY - gridDragScroll.y);
                if (dx + dy < 25) return;

                gridDragScroll.isBeginDrag = false;
                gridDragScroll.isHorz = dx > dy;
            } 


            if (gridDragScroll.isHorz) {
                grid.scrollLeft(gridDragScroll.scrollLeft - e.pageX + gridDragScroll.x);
            } else {
                grid.scrollTop(gridDragScroll.scrollTop - e.pageY + gridDragScroll.y);
            }
        });

        $(document).on('mouseup.dragScroll', function() {
            $(document).off('mousemove.dragScroll')
                .off('mouseup.dragScroll');
        });

        e.preventDefault();
    }

    var gridDragScroll = {};

    return {
        timeToHhmm: timeToHhmm,
        getRangeItemSize: getRangeItemSize,
        parseRangeDatesExpr: parseRangeDatesExpr,
        onGridMouseDown: onGridMouseDown
    }
}]);