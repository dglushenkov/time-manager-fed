angular.module('shdGridModule')
.factory('shdDatetimeHelper', ['shdDatetimeConst', function(shdDatetimeConst) {

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
            timezone = shdDatetimeConst.UA_TIMEZONE;
        }

        var strParts = str.trim().split('/');
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
        var localDiffTimezone = (timezone - shdDatetimeConst.LOCAL_TIMEZONE) * shdDatetimeConst.M_MS;
        var intervalTimezone = {
            from: new Date(interval.from.getTime() - localDiffTimezone),
            to: new Date(interval.to.getTime() - localDiffTimezone)
        };

        var ranges = [];
        

        // First part is a date
        if (dateExpr.charAt(0) != '(') {
            var startRangeGMTMs = Date.parse(dateExpr); // date in GMT milliseconds
            // If invalid date
            if (isNaN(startRangeGMTMs)) return;

            var startRangeMS = startRangeGMTMs + shdDatetimeConst.LOCAL_TIMEZONE * shdDatetimeConst.M_MS;
            var startRange = new Date(startRangeMS);

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

            var d = new Date(intervalTimezone.from.getTime() - shdDatetimeConst.D_MS);
            outer: while (d < intervalTimezone.to) {
                for (var key in conditionsKeys) {
                    if (key in conditions) {
                        var func = operators[conditions[key].operator];
                        if (!func) return;

                        if (!func(conditionsKeys[key].getValue(d), conditions[key].compareWith)) {
                            conditionsKeys[key].increment(d);
                            continue outer;
                        }
                    }
                }

                var startRange = new Date(d.getTime());
                startRange.setHours(time.hours, time.minutes, 0, 0);
                var endRange = new Date(startRange.getTime() + duration);
                if (endRange <= intervalTimezone.from || startRange >= intervalTimezone.to || startRange < d) {
                    conditionsKeys['d'].increment(d)
                    continue;
                }


                var range = initRangeObj(startRange, endRange, duration, timezone, intervalTimezone);
                ranges.push(range);

                d = new Date(endRange.getTime() + shdDatetimeConst.M_MS);
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
        { char: 'd', coef: shdDatetimeConst.D_MS }, // Days
        { char: 'h', coef: shdDatetimeConst.H_MS }, // Hours
        { char: 'm', coef: shdDatetimeConst.M_MS }  // Minutes
    ];

    var durationRegex = /^[\ddhm]+$/;

    // Parse duration string to milliseconds
    function parseDuration(str) {
        // Error if validation regexp returns null
        if (!durationRegex.exec(str)) throw('Invalid duration');
        var duration = 0; // Duration in milliseconds
        var i = 0; // Current position in str
        var m = 0; // Current position in durationMultipliers

        // Try to find each multiplier in string
        while (i < str.length) {
            // Error if we've got all possible multipliers but the string hasn't ended
            // E.g. 2d15m2
            if (m >= durationMultipliers.length) throw('Invalid duration');

            // Get multiplier position starting from current position
            var mPos = str.indexOf(durationMultipliers[m].char, i);

            // If multiplier is found
            if (mPos != -1) {
                // Get multiplier value string
                mStr = str.slice(i, mPos);
                // If multiplier value has letters (e.g. 3md2h35m)
                if (isNaN(mStr)) throw('Invalid duration');
                // Add multiplier value in milliseconds to duration
                duration += durationMultipliers[m].coef * mStr;
                // Move current postion behind multiplier char
                i = mPos + 1;
            }

            m++;
        }

        // If no multipliers in duration string suggest minutes amount
        if (i == 0) {
            duration = str * shdDatetimeConst.M_MS;
            if (isNaN(duration)) throw('Invalid duration');
        }

        if (duration == 0) throw('Duration can\'t be 0');

        return duration;
    }

    console.log(parseDuration('2h30m'));

    var timeRegex = /^(\d\d):(\d\d)$/;

    function parseTimeStr(timeStr) {
        var match = timeRegex.exec(timeStr);
        if (!match) throw('Parse time error');

        var hours = match[1];
        var minutes = match[2];
        if (hours > 23 || minutes > 59) throw('Time is invalid');
        return {
            hours: hours,
            minutes: minutes
        }
    }


    function ConditionalRange(str) {
        this.conditions = ConditionalRange.parse(str);
    }

    ConditionalRange.keys = {
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
                    return Math.floor((date - firstWeek) / shdDatetimeConst.W_MS) + 1;
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
                    return Math.floor((date - firstWeek) / shdDatetimeConst.W_MS) + 1;
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
                    return Math.floor((date - yearStart) / shdDatetimeConst.D_MS) + 1;
                },
                increment: function(date) { 
                    date.setHours(0, 0, 0, 0);
                    return date.setDate(date.getDate() + 1); 
                }
            }
    };

    ConditionalRange.operators = {
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

    ConditionalRange.regex = new RegExp('^(' + Object.keys(ConditionalRange.keys).join('|') + ')(' + 
        Object.keys(ConditionalRange.operators).join('|') + ')(\\d{1,4}(?:,\\d{1,4})*)$');

    ConditionalRange.parse = function(str) {
        var conditionsObj = {};
        if (str == '') return conditionsObj;

        // Split by semicolon
        var conditionsItems = str.split(';');
        // For each condition string
        for (var i = 0; i < conditionsItems.length; i++) {
            // Use regular expression to get condition key, operator and compare value
            var match = conditionRegex.exec(conditionsItems[i]);

            // Error if the regular expression hasn't found a match or if any of key, operator and value is undefined
            if (!match) throw('Parse condition error');

            var key = match[1];
            var operator = match[2];

            // Convert value to array of numbers
            // Split by comma
            var values = match[3].split(',');
            for (var j = 0; j < values.length; j++) {
                values[j] = +values[j];
            }

            conditionsObj[key] = {
                operator: operator,
                values: values
            };
        }

        return conditionsObj;
    }

    ConditionalRange.prototype.getNext = function(start, end) {

    }

    ConditionalRange.prototype.getPrev = function(start, end) {

    }



    return {
        ConditionalRange: ConditionalRange
    }
}]);