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

        parseRangeDatesExpr: function(rangeExpr, gridDates) {
            // Not a string
            if (!rangeExpr || !(typeof rangeExpr == 'string')) return;

            var regex = /^\s*(\(\s*((20\d{2}-[01]\d-[0-3]\d)|(((y|m|w|wm|d|dw|dy)(((<|>|=|\/)\d{1,4})|(=\d{1,4}(,\d{1,4})+)))(\s+(y|m|w|wm|d|dw|dy)(((<|>|=|\/)\d{1,4})|(=\d{1,4}(,\d{1,4})+))){0,6}))\s*\)\s*)?([0-2]\d:[0-5]\d)\s*-\s*(((20\d{2}-[01]\d-[0-3]\d)\s+([02]\d:[0-5]\d))|((([02]\d:[0-5]\d)|(\d{1,4})(:([0-5]\d))?(h))))(\s*)$/;

            console.log(regex);
        }
    }
}]);