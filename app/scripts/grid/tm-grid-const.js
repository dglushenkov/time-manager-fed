angular.module('gridModule')

.constant('gridConstants', {
    CELL_WIDTH: 70,
    CELL_HEIGHT: 20,

    TIME_LABEL_TPL: '<div class="tm-grid-time-label" style="width: %w">%t</div>',

    RULER_TPL: '<div class="tm-ruler-item" style="width: %w"></div>'
});