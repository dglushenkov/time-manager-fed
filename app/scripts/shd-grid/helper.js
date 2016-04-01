angular.module('shdGridModule')
.factory('shdGridHelper', ['shdGridConst', function(shdGridConst) {

    // Get time label from Date Object
    // E.g. Date to '10:45'
    function dateToHhmm(date) {
        return ('0' + date.getHours()).slice(-2) + ':' 
            + ('0' + date.getMinutes()).slice(-2);
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
    function parseRangeDatesStr(str, interval, timezone) {
        // Default timezone is Ukraine
        if (timezone == undefined) {
            timezone = shdGridConst.UA_TIMEZONE;
        }

        var strParts = str.split('/');
        // If invalid format
        if (strParts.length != 3) return;

        // Date expression
        var dateExpr = strParts[0].trim().toLowerCase();
        // If date expression is empty string
        if (!dateExpr) return;
        // Time string
        var time = strParts[1].trim();
        // If time is empty string
        if (!time) return;
        time = parseTimeStr(time);
        // If time parse errors
        if (isNaN(time.hours) || isNaN(time.minutes)) return;
        // Duration string
        var duration = strParts[2].trim().toLowerCase();
        // If duration is empty string
        if (!duration) return
        var duration = parseDurationStr(duration);
        // if parse duration errors
        if (!duration) return;

        // Timezone difference = local date - timezone date
        var localDiffTimezone = (timezone - shdGridConst.LOCAL_TIMEZONE) * shdGridConst.M_MS;
        var intervalTimezone = {
            from: new Date(interval.from.getTime() - localDiffTimezone),
            to: new Date(interval.to.getTime() - localDiffTimezone)
        };

        var ranges = [];
        

        // First part is a date
        if (dateExpr.charAt(0) != '(') {
            var startRange = new Date(dateExpr); // User date in GMT
            // Invalid date
            if (isNaN(startRange.getTime())) return;

            var GMTMS = startRange.getTime();
            var localMS = GMTMS - shdGridConst.LOCAL_TIMEZONE * shdGridConst.M_MS;
            var startRangeUser = new Date(localMS);

            startRange.setHours(time.hours, time.minutes, 0, 0);

            var endRange = new Date(startRange.getTime() + duration);
            if (endRange <= intervalTimezone.from || startRange >= intervalTimezone.to) return;

            var range = initRangeObj(startRange, endRange, duration, timezone, intervalTimezone);
            ranges.push(range);


        // First part is an expression
        } else {
            var conditions = parseRangeConditions(dateExpr.slice(1, -1).trim());
            // If invalid conditions
            if (!conditions) return;

            var d = new Date(intervalTimezone.from.getTime() - shdGridConst.D_MS);
            outer: while (d < intervalTimezone.to) {
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

                var startRange = new Date(d.getTime());
                startRange.setHours(time.hours, time.minutes, 0, 0);
                var endRange = new Date(startRange.getTime() + duration);
                if (endRange <= intervalTimezone.from || startRange >= intervalTimezone.to || startRange < d) {
                    conditionKeys['d'].increment(d)
                    continue;
                }


                var range = initRangeObj(startRange, endRange, duration, timezone, intervalTimezone);
                ranges.push(range);

                d = new Date(endRange.getTime() + shdGridConst.M_MS);
            }
        }

        return ranges;
    }

    function initRangeObj(start, end, duration, timezone, intervalTimezone) {
        var range = {
            realFrom: start,
            realTo: end,
            duration: duration,
            timezone: timezone
        };
        var intervalTimezoneMS = intervalTimezone.to - intervalTimezone.from;
        range.from = (range.realFrom < intervalTimezone.from) ? intervalTimezone.from : range.realFrom;
        range.to = (range.realTo > intervalTimezone.to) ? intervalTimezone.to : range.realTo;
        range.view = {
            left: (range.from - intervalTimezone.from) / (intervalTimezoneMS) * 100,
            width: (range.to - range.from) / (intervalTimezoneMS) * 100
        }
        return range;
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
        parseRangeDatesStr: parseRangeDatesStr,
        onGridMouseDown: onGridMouseDown
    }
}]);