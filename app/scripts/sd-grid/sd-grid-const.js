angular.module('sdGridModule')

.constant('sdGridConstants', {
    CELL_WIDTH: 70,
    CELL_HEIGHT: 20,

    TIME_LABEL_TPL: '<div class="sd-grid-time-label">%t</div>',
    RULER_TPL: '<div class="sd-ruler-item"></div>',

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