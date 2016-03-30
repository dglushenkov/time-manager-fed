angular.module('shdGridModule', ['ui.bootstrap', 'ngAnimate'])

// Constants
.constant('shdGridConstants', {
    CELL_WIDTH: 70, // Grid cell min width
    ZOOM_SCALE: [0.25, 0.5, 1, 2], // Hours per cell values for zoom steps

    // X axis time label template
    X_AXIS_TIME_TPL: '<div class="shd_time-item">%t</div>',
    // Ruler item template
    RULER_TPL: '<div class="shd_ruler-item"></div>',

    M_MS: 1000 * 60, // Milliseconds in minute
    H_MS: 1000 * 60 * 60, // Milliseconds in hour
    D_MS: 1000 * 60 * 60 * 24, // Milliseconds in day
    W_MS: 1000 * 60 * 60 * 24 * 7, // Milliseconds in week

    // Browser calculated scrollbar width
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

