angular.module('sdGridModule')

.constant('sdGridConstants', {
    CELL_WIDTH: 70,
    ZOOM_SCALE: [0.25, 0.5, 1, 2, 4, 8],

    TIME_LABEL_TPL: '<div class="sd-grid-axis-time-item">%t</div>',
    RULER_TPL: '<div class="sd-ruler-item"></div>',

    MIN_MILISEC: 1000 * 60,
    HOUR_MILISEC: 1000 * 60 * 60,
    DAY_MILISEC: 1000 * 60 * 60 * 24,
    WEEK_MILISEC: 1000 * 60 * 60 * 24 * 7,

    SCROLLBAR_WIDTH: (function() {
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
    })()
});