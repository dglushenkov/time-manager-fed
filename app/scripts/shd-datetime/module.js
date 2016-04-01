angular.module('shdDatetime', [])

.constant('shdDatetimeConst', {
    M_MS: 1000 * 60, // Milliseconds in minute
    H_MS: 1000 * 60 * 60, // Milliseconds in hour
    D_MS: 1000 * 60 * 60 * 24, // Milliseconds in day
    W_MS: 1000 * 60 * 60 * 24 * 7, // Milliseconds in week

    // GMT - local minutes
    LOCAL_TIMEZONE: (function() { 
        var now = new Date();
        return now.getTimezoneOffset();
    })(),
    UA_TIMEZONE: -180, // Ukraine timezone
});