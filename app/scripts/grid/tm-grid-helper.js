angular.module('gridModule')
.factory('gridHelper', [function() {
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
        }
    }
}]);