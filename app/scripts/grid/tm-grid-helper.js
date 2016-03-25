angular.module('gridModule')
.factory('gridHelper', ['gridConstants', function(gridConstants) {
    return {
        timeToHhmm: function(time) {
            return ('0' + time.getHours()).slice(-2) + ':' 
                + ('0' + time.getMinutes()).slice(-2);
        },

        parseTimeRange: function(timeRange) {
            var timeRangeArr = timeRange.split('-');
            return {
                from: new Date(timeRangeArr[0]),
                to: new Date(timeRangeArr[1])
            };
        },

        getRangeItemSize: function(gridDates, rangeDates) {
            return {
                width: 100 * (rangeDates.to - rangeDates.from) / (gridDates.to - gridDates.from),
                left: 100 * (rangeDates.from - gridDates.from) / (gridDates.to - gridDates.from)
            };
        },

        getScrollbarWidth: function() {
            var outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.width = "100px";
            outer.style.msOverflowStyle = "scrollbar"; 

            document.body.appendChild(outer);

            var widthNoScroll = outer.offsetWidth;
            outer.style.overflow = "scroll";

            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);

            var widthWithScroll = inner.offsetWidth;

            outer.parentNode.removeChild(outer);

            return widthNoScroll - widthWithScroll;
        },

        // Parse range string to range dates object
        parseRangeDatesExpr: function(rangeExpr, gridDates) {
            var rangeExprParts = rangeExpr.split('-');
            var ranges = [];

            // RangeExpr is not periodical
            // E.g. 2016.03.02.13:00-05:30
            // 2 March 2016 from 13.00 and duration 5:30h
            if (rangeExprParts.length == 2) {
                var range = {};
                range.from = new Date(rangeExprParts[0]);
                range.to = new Date(range.from.getTime());
                var hhmm = rangeExprParts[1].split(':');
                range.to.setHours(+hhmm[0], +hhmm[1]);

                // Check if end time fits grid date span
                if (range.to > gridDates.to) {
                    range.to = new Date(gridDates.to.getTime());
                }

                ranges.push(range);


            // Periodical expression
            // E.g. 'y = 2016&dw in 1,2,3,4,5-11:00-05:30'
            // Every Mn Ts Wd Th Fr in 2016 from 11:00 and duration 05:30
            } else {
                var conditions = {};

                // If there are period conditions
                if (rangeExprParts[0]) {

                    // Split conditions by '&'
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

                // Get all ranges that fits conditions and grid datetime interval 
                var range = getNextRange(conditions, gridDates.from, gridDates.to);
                while (range) {
                    ranges.push(range);
                    range = getNextRange(conditions, range.to, gridDates.to);
                }
            }

            return ranges;

            function getNextRange(conditions, from, to) {
                var date = new Date(from.getTime());

                while(date < to) {

                    // Check year
                    if (conditions.y) {
                        if (!checkCondition(date.getFullYear(), condition.y.operator, condition.y.value)) {
                            date.setFullYear(date.getFullYear() + 1, 0);
                            date.setHours(0, 0);
                            continue;
                        }
                    }

                    // Check month
                    if (conditions.m) {
                        if (!checkCondition(date.getMonth(), condition.m.operator, condition.m.value)) {
                            date.setMonth(date.getMonth() + 1, 1);
                            date.setHours(0, 0);
                            continue;
                        }
                    }

                    // Check week number from year start
                    if (conditions.w) {
                        if (!checkCondition(getWeekInYear(date), condition.w.operator, condition.w.value)) {
                            date.setDate(date.getDate() + 7 - date.getDay());
                            date.setHours(0, 0);
                            continue;
                        }
                    }

                    // Check week number from year start
                    if (conditions.wm) {
                        if (!checkCondition(getWeekInYear(date), condition.w.operator, condition.w.value)) {
                            date.setDate(date.getDate() + 7 - date.getDay());
                            date.setHours(0, 0);
                            continue;
                        }
                    }




                    return;
                }
            }

            function getWeekInYear(date) {
                var firstWeek = new Date(date.getFullYear(), 0, 1);
                firstWeek.setDate(-firstWeek.getDay());
                return Math.ceil((date - firstWeek) / 604800000) + 1;
            }

            function checkCondition(value, operator, compareWith) {
                switch(operator) {
                    case '=':
                        return value == +compareWith;
                    case '<':
                        return value < +compareWith;
                    case '>':
                        return value > +compareWith;
                    case '<=':
                        return value <= +compareWith;
                    case '>=':
                        return value >= +compareWith;
                    case '!=':
                        return value != +compareWith;
                    case 'in':
                        var compareList = compareWith.split(',');
                        return compareList.indexOf(value + '') != -1;
                }
            }
        }
    }
}]);