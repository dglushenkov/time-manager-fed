angular.module('shdGridModule')
.factory('shdGridHelper', ['shdDatetimeConst', function(shdDatetimeConst) {

    // Get time label from Date Object
    // E.g. Date to '10:45'
    function dateToHhmm(date) {
        return ('0' + date.getHours()).slice(-2) + ':' 
            + ('0' + date.getMinutes()).slice(-2);
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
        onGridMouseDown: onGridMouseDown
    }
}]);