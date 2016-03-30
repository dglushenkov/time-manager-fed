angular.module('shdGridModule')
.factory('shdGridHelper', ['shdGridConst', function(shdGridConst) {

    // Get time label from Date Object
    // E.g. Date to '10:45'
    function dateToHhmm(date) {
        return ('0' + date.getHours()).slice(-2) + ':' 
            + ('0' + date.getMinutes()).slice(-2);
    }

    // Get range DOM element sizes from range and grid date intervals
    function getRangeItemSize(rangeDates, gridDates) {
        return {
            width: 100 * (rangeDates.to - rangeDates.from) / (gridDates.to - gridDates.from) + '%',
            left: 100 * (rangeDates.from - gridDates.from) / (gridDates.to - gridDates.from) + '%'
        };
    }

    //=============================================================================================================
    // Parse range dates string to range dates objects
    // 
    // Range dates string must be in format '[<date>|<expression>]/<time>/<duration>'
    //      <date> - date string in format ISO 8601 'YYYY-MM-DD'
    //
    //      <expression> - expression to check in format '(<condition>[;<condition>])'
    //          <condition> - condition string in format '<value_to_compare><operator><compare_with>'
    //              conditions are applied with logical AND operation
    //              
    //              <value_to_compare> - can be one of the following:
    //                  'y' - year
    //                  'm' - month
    //                  'w' - week number in year
    //                  'wm' - week number in month
    //                  'd' - day in month
    //                  'dw' - day in week
    //                  'dy' - day in year
    //              <operator> - one of the following:
    //                  '=' - equal or one of <compare_with> items if <compare_with> is a comma separated list e.g. 1,2,4,6
    //                  '!=' - not equal or not one of <compare_with> items if <compare_with> is a comma separated list e.g. 1,2,4,6
    //                  '>' - greater than
    //                  '<' - less than
    //                  '>=' - greater than or equal
    //                  '<=' - less than or equal
    //                  '/' - <value_to_compare> mod <compare_with> == 0
    //                  '!/' - <value_to_compare> mod <compare_with> != 0
    //                  '/=' - <value_to_compare> mod <compare_with>[0] == <compare_with>[1] 
    //                      <compare_with> must be a comma separated list with two values e.g. 1,2
    //                      
    //              <compare_with> - number or comma separated list of numbers
    //      
    //      <time> - time string in format ISO 8601 'HH:MM[<timezone>]'
    //          <timezone> - timezone in ISO 8601 format e.g. 'Z+02:00'
    //      
    //      <duration> - duration string in format '<duration_expr>|<minutes_amount>'
    //          <minutes_amount> - number of minutes
    //          <duration_expr> - duration expression string in format '<days_amount>d||<hours_amount>h||<minutes_amount>m'
    //=============================================================================================================
    function parseRangeDatesStr(rangeStr, gridDates) {
        // Not a string
        if (typeof(rangeStr) != 'string') return;

        var rangeExprParts = rangeStr.split('/');
        // Invalid format
        if (rangeExprParts.length != 3) return;

        var date = rangeExprParts[0].trim();
        var time = rangeExprParts[1].trim();
        var duration = parseDurationStr(rangeExprParts[2].trim());
        // Date, time or duration is empty
        if (!date || !time || !duration) return;
        var ranges = [];


        // First part is not expression
        if (date.charAt(0) != '(') {
            var startDate = new Date(date + time);
            // Invalid date or time
            if (isNaN(startDate.getTime())) return;

            var endDate = new Date(startDate.getTime() + duration);
            var range = {
                from: startDate,
                actualTo: endDate,
                duration: duration,
            };
            range.to = (range.actualTo > gridDates.to) ? new Date(gridDates.to.getTime()) : range.actualTo;
            ranges.push(range);


        // First part is an expression
        } else {
            var conditions = parseRangeConditions(date);
            // Invalid conditions
            if (!condition) return;
        }


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

        // Returns next period start time fitting conditions and interval
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

        // Get week number in month or in year
        function getWeek(date, inMonth) {
            var firstWeek = new Date(date.getFullYear(), 0, 1);
            if (inMonth) {
                firstWeek.setMonth(date.getMonth());
            }
            firstWeek.setDate(-firstWeek.getDay());
            return Math.floor((date - firstWeek) / shdGridConst.WEEK_MILISEC) + 1;
        }

        // Get day number in year
        function getDateInYear(date) {
            var yearStart = new Date(date.getFullYear(), 0, 1);
            return Math.floor((date - yearStart) / shdGridConst.DAY_MILISEC) + 1;
        }

        // Check condition
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
                case '!/':
                    result = (value % compareWith) != 0;
                    break;
                case '=/':
                    var compareParts = compareWith.split(',');
                    result = (value % compareParts[0]) == compareParts[1];
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

    // Duration string multipliers
    var durationMultipliers = [
        { 
            char: 'd',
            value: shdGridConst.D_MS 
        },
        { 
            char: 'h',
            value: shdGridConst.H_MS 
        },
        { 
            char: 'm',
            value: shdGridConst.M_MS 
        }
    ];

    // Parse duration string to number of millisecond
    function parseDurationStr(durationStr) {
        var durationMs = 0;
        var pos = 0;
        var mltCounter = 0;

        while (pos < durationStr.length && mltCounter < durationMultipliers.length) {
            var multiplierPos = durationStr.indexOf(durationMultipliers[mltCounter].char, pos);

            // If multiplier is found
            if (~multiplierPos) {
                mltStr = durationStr.slice(pos, multiplierPos);
                // Multiplier has no value before
                if (!mltStr) return;
                durationMs += durationMultipliers[mltCounter].value * mltStr;
                // Invalid multiplier string value
                if (isNaN(durationMs)) return;
                pos = multiplierPos + 1;
            }

            mltCounter++;
        }

        // If no multipliers in duration string suggest minutes amount
        if (pos == 0) {
            durationMs = durationStr * shdGridConst.M_MS;
            if (isNaN(durationMs)) return;
        }

        return durationMs;
    }

    var compareFuncs = {
        '=': function(value, compare) {

        },
        '!=': function(value, compare) {

        },
        '>': function(value, compare) {

        },
        '<': function(value, compare) {

        },
        '>=': function(value, compare) {

        },
        '<=': function(value, compare) {

        },
        '/': function(value, compare) {

        },
        '!/': function(value, compare) {

        },
        '/=': function(value, compare) {

        }
    };

    var conditionOptions = {
        'y': {
                getValue: function(date) {
                    return date.getFullYear();
                },
                add: function(date) {

                }
            },
        'm': {
                getValue: function(date) {
                    return date.getMonth();
                },
                add: function(date) {

                }
            },
        'w': {
                getValue: function(date) {
                    var firstWeek = new Date(date.getFullYear());
                    firstWeek.setDate(-firstWeek.getDay());
                    return Math.floor((date - firstWeek) / shdGridConst.W_MS) + 1;
                },
                add: function(date) {

                }
            },
        'wm': {
                getValue: function(date) {
                    var firstWeek = new Date(date.getFullYear(), date.getMonth());
                    firstWeek.setDate(-firstWeek.getDay());
                    return Math.floor((date - firstWeek) / shdGridConst.W_MS) + 1;
                },
                add: function(date) {

                }
            },
        'dw': {
                getValue: function(date) {
                    return date.getDay();
                },
                add: function(date) {

                }
            },
        'dm': {
                getValue: function(date) {
                    return date.getDate();
                },
                add: function(date) {

                }
            },
        'd': {
                getValue: function(date) {
                    var yearStart = new Date(date.getFullYear());
                    return Math.floor((date - yearStart) / shdGridConst.D_MS) + 1;
                },
                add: function(date) {

                }
            }
    };

    function parseRangeConditions(str) {

    }

    // Grid drag'n'scroll
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

    // Grid drag'n'scroll object
    var gridDragScroll = {};

    return {
        timeToHhmm: timeToHhmm,
        getRangeItemSize: getRangeItemSize,
        parseRangeDatesExpr: parseRangeDatesExpr,
        onGridMouseDown: onGridMouseDown
    }
}]);