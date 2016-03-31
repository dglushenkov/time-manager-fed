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
    // Range dates string must be in format 
    //      '[<date>|<expression>]/<time>/<duration>'
    //      
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
    //                  '=' - equal or one of <compare_with> items 
    //                      if <compare_with> is a comma separated list e.g. 1,2,4,6
    //                  '!=' - not equal or not one of <compare_with> items 
    //                      if <compare_with> is a comma separated list e.g. 1,2,4,6
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
    //          <duration_expr> - duration expression string 
    //              in format '<days_amount>d||<hours_amount>h||<minutes_amount>m'
    //=============================================================================================================
    function parseRangeDatesStr(rangeStr, gridDates) {
        console.log('123');
        var rangeExprParts = rangeStr.split('/');
        // Invalid format
        if (rangeExprParts.length != 3) return;

        var date = rangeExprParts[0].trim().toLowerCase();
        var time = rangeExprParts[1].trim();
        var duration = parseDurationStr(rangeExprParts[2].trim().toLowerCase());
        // Date, time or duration is empty
        if (!date || !time || !duration) return;
        var ranges = [];


        // First part is not expression
        if (date.charAt(0) != '(') {
            var startDate = new Date(date + 'T' + time);
            // Invalid date or time
            if (isNaN(startDate.getTime())) return;

            var endDate = new Date(startDate.getTime() + duration);
            var range = {
                from: startDate,
                actualTo: endDate,
                duration: duration,
            };
            range.to = (range.actualTo > gridDates.to) ? new Date(gridDates.to.getTime()) : range.actualTo;
            console.log(range);
            ranges.push(range);


        // First part is an expression
        } else {
            var conditions = parseRangeConditions(date.slice(1, -1));
            // Invalid conditions
            if (!conditions) return;

            var d = new Date(gridDates.from.getTime());
            outer: while (d <= gridDates.to) {
                for (var key in conditionKeys) {
                    if (key in conditions) {
                        var func = compareFuncs[conditions[key].operator];
                        if (!func) return;

                        checkCondition = func(conditionKeys[key].getValue(d), conditions[key].compareWith);
                        if (!checkCondition) {
                            conditionKeys[key].increment(d);
                            continue outer;
                        }
                    }
                }

                var startDate = new Date(d.toISOString().slice(0, 11) + time);
                if (isNaN(startDate.getTime())) return;

                var endDate = new Date(startDate.getTime() + duration);
                var range = {
                    from: startDate,
                    actualTo: endDate,
                    duration: duration,
                };
                range.to = (range.actualTo > gridDates.to) ? new Date(gridDates.to.getTime()) : range.actualTo;
                ranges.push(range);

                d = new Date(range.actualTo.getTime());
                d.setMinutes(d.getMinutes() + 1);
                if (range.from.getDate() == range.actualTo.getDate()) {
                    d.setDate(d.getDate() + 1);
                }
            }
        }

        return ranges;
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
            if (multiplierPos != -1) {
                mltStr = durationStr.slice(pos, multiplierPos).trim();
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
            var compareList = compare.split(',');
            return compareList.indexOf(value + '') != -1;
        },
        '!=': function(value, compare) {
            var compareList = compare.split(',');
            return compareList.indexOf(value + '') == -1;
        },
        '>': function(value, compare) {
            return value > compare;
        },
        '<': function(value, compare) {
            return value < compare;
        },
        '>=': function(value, compare) {
            return value >= compare;
        },
        '<=': function(value, compare) {
            return value <= compare;
        },
        '/': function(value, compare) {
            return value % compare == 0;
        },
        '!/': function(value, compare) {
            return value % compare != 0;
        },
        '/=': function(value, compare) {
            var compareParts = compare.split(',');
            return (compareParts == 2) && (value % compareParts[0] == compareParts[1]);
        }
    };

    var conditionKeys = {
        'y': {
                getValue: function(date) { return date.getFullYear(); },
                increment: function(date) { return date.setFullYear(date.getFullYear() + 1, 0, 1); }
            },
        'm': {
                getValue: function(date) { return date.getMonth(); },
                increment: function(date) { return date.setMonth(date.getMonth() + 1, 1); }
            },
        'w': {
                getValue: function(date) {
                    var firstWeek = new Date(date.getFullYear());
                    firstWeek.setDate(-firstWeek.getDay());
                    return Math.floor((date - firstWeek) / shdGridConst.W_MS) + 1;
                },
                increment: function(date) { return date.setDate(date.getDate() + 7 - date.getDay()); }
            },
        'wm': {
                getValue: function(date) {
                    var firstWeek = new Date(date.getFullYear(), date.getMonth());
                    firstWeek.setDate(-firstWeek.getDay());
                    return Math.floor((date - firstWeek) / shdGridConst.W_MS) + 1;
                },
                increment: function(date) { return date.setDate(date.getDate() + 7 - date.getDay()); }
            },
        'dw': {
                getValue: function(date) { return date.getDay(); },
                increment: function(date) { return date.setDate(date.getDate() + 1); }
            },
        'dm': {
                getValue: function(date) { return date.getDate(); },
                increment: function(date) { return date.setDate(date.getDate() + 1); }
            },
        'd': {
                getValue: function(date) {
                    var yearStart = new Date(date.getFullYear());
                    return Math.floor((date - yearStart) / shdGridConst.D_MS) + 1;
                },
                increment: function(date) { return date.setDate(date.getDate() + 1); }
            }
    };

    var conditionRegex = /(\w{1,2})(\D{1,2})(\d.*)$/;

    function parseRangeConditions(str) {
        var conditionsItems = str.split(';');
        var conditionsObj = {};

        for (var i = 0; i < conditionsItems.length; i++) {
            condition = conditionsItems[i].trim();
            condition = conditionRegex.exec(condition);

            if (!condition[1] || !condition[2] || !condition[3]) return;

            conditionsObj[condition[1]] = {
                operator: condition[2],
                compareWith: condition[3]
            };
        }

        return conditionsObj;
    }


    //=============================================================================================================
    // Grid drag'n'scroll object
    //=============================================================================================================
    var gridDragScroll = {};

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

    return {
        dateToHhmm: dateToHhmm,
        getRangeItemSize: getRangeItemSize,
        parseRangeDatesStr: parseRangeDatesStr,
        onGridMouseDown: onGridMouseDown
    }
}]);