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
    //      '[<date>|<expression>]|<time>|<duration>'
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
    //                  '%' - <value_to_compare> mod <compare_with> == 0
    //                  '!%' - <value_to_compare> mod <compare_with> != 0
    //                  '%=' - <value_to_compare> mod <compare_with>[0] == <compare_with>[1] 
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
    function parseRangeDatesStr(rangeStr, gridDates, timezone) {
        if (timezone == undefined) {
            timezone = -180;
        }
        var rangeExprParts = rangeStr.split('/');
        // If invalid format
        if (rangeExprParts.length != 3) return;

        var date = rangeExprParts[0].trim().toLowerCase();
        var time = rangeExprParts[1].trim();
        time = parseTimeStr(time);
        var duration = parseDurationStr(rangeExprParts[2].trim().toLowerCase());
        // Date, time or duration is invalid
        if (!date || isNaN(time.hours) || isNaN(time.minutes) || !duration) return;

        // Timezone difference = local time - user time
        var localDiffUserMinutes = (timezone - shdGridConst.LOCAL_TIMEZONE) * shdGridConst.M_MS;
        var gridDatesUser = {
            from: new Date(gridDates.from.getTime() - localDiffUserMinutes),
            to: new Date(gridDates.to.getTime() - localDiffUserMinutes)
        };

        var ranges = [];
        var gridDatesUserDiff = gridDatesUser.to - gridDatesUser.from;

        // First part is a date
        if (date.charAt(0) != '(') {
            var startDate = new Date(date); // User date in GMT
            // Invalid date
            if (isNaN(startDate.getTime())) return;

            var GMTMs = startDate.getTime();
            var localMs = GMTMs - shdGridConst.LOCAL_TIMEZONE * shdGridConst.M_MS;
            var startDateUser = new Date(localMs);

            startDate.setHours(time.hours, time.minutes, 0, 0);

            var endDate = new Date(startDate.getTime() + duration);
            if (endDate <= gridDatesUser.from || startDate >= gridDatesUser.to) return;

            var range = {
                realFrom: startDate,
                realTo: endDate,
                duration: duration,
                timezone: timezone
            };
            range.from = (range.realFrom < gridDatesUser.from) ? gridDatesUser.from : range.realFrom;
            range.to = (range.realTo > gridDatesUser.to) ? gridDatesUser.to : range.realTo;
            range.view = {
                left: (range.from - gridDatesUser.from) / (gridDatesUserDiff) * 100,
                width: (range.to - range.from) / (gridDatesUserDiff) * 100
            }
            ranges.push(range);


        // First part is an expression
        } else {
            var conditions = parseRangeConditions(date.slice(1, -1).trim());
            // If invalid conditions
            if (!conditions) return;

            var d = new Date(gridDatesUser.from.getTime() - shdGridConst.D_MS);
            outer: while (d < gridDatesUser.to) {
                for (var key in conditionKeys) {
                    if (key in conditions) {
                        var func = compareFuncs[conditions[key].operator];
                        if (!func) return;

                        if (!func(conditionKeys[key].getValue(d), conditions[key].compareWith)) {
                            conditionKeys[key].increment(d);
                            continue outer;
                        }
                    }
                }

                var startDate = new Date(d.getTime());
                startDate.setHours(time.hours, time.minutes, 0, 0);
                var endDate = new Date(startDate.getTime() + duration);
                if (endDate <= gridDatesUser.from || startDate >= gridDatesUser.to || startDate < d) {
                    conditionKeys['d'].increment(d)
                    continue;
                }


                var range = {
                    realFrom: startDate,
                    realTo: endDate,
                    duration: duration,
                    timezone: timezone
                };
                range.from = (range.realFrom < gridDatesUser.from) ? gridDatesUser.from : range.realFrom;
                range.to = (range.realTo > gridDatesUser.to) ? gridDatesUser.to : range.realTo;
                range.view = {
                    left: (range.from - gridDatesUser.from) / (gridDatesUserDiff) * 100,
                    width: (range.to - range.from) / (gridDatesUserDiff) * 100
                }
                ranges.push(range);

                d = new Date(endDate.getTime() + shdGridConst.M_MS);
            }
        }

        return ranges;

    }

    function toTimezoneDate(date, timezoneDiff) {
        var d = new Date(date.getTime());
        d.setMinutes(d.getMinutes() + timezoneDiff);
        return d;
    }

    // Duration multipliers
    var durationMultipliers = [
        { char: 'd', coef: shdGridConst.D_MS }, // Days
        { char: 'h', coef: shdGridConst.H_MS }, // Hours
        { char: 'm', coef: shdGridConst.M_MS }  // Minutes
    ];

    // Parse duration string to milliseconds
    function parseDurationStr(str) {
        var duration = 0; // Duration in milliseconds
        var i = 0; // Current position in str string
        var m = 0; // Current position in durationMultipliers array

        // Try to find each multiplier in string
        while (i < str.length && m < durationMultipliers.length) {
            // Get multiplier position starting from current position
            var mPos = str.indexOf(durationMultipliers[m].char, i);

            // If multiplier is found
            if (mPos != -1) {
                // Get multiplier value string
                mStr = str.slice(i, mPos).trim();
                // If multiplier has no value
                if (!mStr) return;
                // Add multiplier value in milliseconds to duration
                duration += durationMultipliers[m].coef * mStr;
                // If invalid multiplier value
                if (isNaN(duration)) return;
                // Move current postion behind multiplier char
                i = mPos + 1;
            }

            m++;
        }

        // If no multipliers in duration string suggest minutes amount
        if (i == 0) {
            duration = str * shdGridConst.M_MS;
            if (isNaN(duration)) return;
        }

        return duration;
    }

    // Compare functions list
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
        '%': function(value, compare) {
            return value % compare == 0;
        },
        '!%': function(value, compare) {
            return value % compare != 0;
        },
        '%=': function(value, compare) {
            var compareParts = compare.split(',');
            return (compareParts.length == 2) && (value % compareParts[0] == compareParts[1]);
        }
    };

    var conditionKeys = {
        'y': {
                getValue: function(date) { 
                    return date.getFullYear(); 
                },
                increment: function(date) { 
                    date.setHours(0, 0, 0, 0);
                    return date.setFullYear(date.getFullYear() + 1, 0, 1); 
                }
            },
        'm': {
                getValue: function(date) {
                    return date.getMonth(); 
                },
                increment: function(date) {
                    date.setHours(0, 0, 0, 0);
                    return date.setMonth(date.getMonth() + 1, 1); 
                }
            },
        'w': {
                getValue: function(date) {
                    var firstWeek = new Date(date.getFullYear());
                    firstWeek.setDate(-firstWeek.getDay());
                    return Math.floor((date - firstWeek) / shdGridConst.W_MS) + 1;
                },
                increment: function(date) {
                    date.setHours(0, 0, 0, 0);
                    return date.setDate(date.getDate() + 7 - date.getDay()); 
                }
            },
        'wm': {
                getValue: function(date) {
                    var firstWeek = new Date(date.getFullYear(), date.getMonth());
                    firstWeek.setDate(-firstWeek.getDay());
                    return Math.floor((date - firstWeek) / shdGridConst.W_MS) + 1;
                },
                increment: function(date) { 
                    date.setHours(0, 0, 0, 0);
                    return date.setDate(date.getDate() + 7 - date.getDay()); 
                }
            },
        'dw': {
                getValue: function(date) { 
                    return date.getDay(); 
                },
                increment: function(date) { 
                    date.setHours(0, 0, 0, 0);
                    return date.setDate(date.getDate() + 1); 
                }
            },
        'd': {
                getValue: function(date) { 
                    return date.getDate(); 
                },
                increment: function(date) { 
                    date.setHours(0, 0, 0, 0);
                    return date.setDate(date.getDate() + 1); 
                }
            },
        'dy': {
                getValue: function(date) {
                    var yearStart = new Date(date.getFullYear());
                    return Math.floor((date - yearStart) / shdGridConst.D_MS) + 1;
                },
                increment: function(date) { 
                    date.setHours(0, 0, 0, 0);
                    return date.setDate(date.getDate() + 1); 
                }
            }
    };

    var timeRegex = /(\d{1,2})\s*:\s*(\d\d)$/;

    function parseTimeStr(timeStr) {
        var timeParts = timeRegex.exec(timeStr);
        return {
            hours: +timeParts[1],
            minutes: +timeParts[2]
        }
    }

    var conditionRegex = /(\w{1,2})\s*(\D{1,2})\s*(\d.*)$/;

    function parseRangeConditions(str) {
        if (!str) return {};
        var conditionsItems = str.split(';');
        var conditionsObj = {};

        for (var i = 0; i < conditionsItems.length; i++) {
            condition = conditionsItems[i].trim();
            condition = conditionRegex.exec(condition);

            if (!condition || !condition[1] || !condition[2] || !condition[3]) return;

            conditionsObj[condition[1].trim()] = {
                operator: condition[2].trim(),
                compareWith: condition[3].trim()
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