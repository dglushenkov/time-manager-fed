angular.module('gridModule')

.constant('gridConstants', {
    CELL_WIDTH: 70,
    CELL_HEIGHT: 20,

    TIME_LABEL_TPL: '<div class="tm-grid-time-label" style="width: %w">%t</div>',

    RULER_TPL: '<div class="tm-ruler-item" style="width: %w"></div>',

    RANGE_REG: /^\s*(\(\s*((20\d{2}-[01]\d-[0-3]\d)|(((y|m|w|wm|d|dw|dy)(((<|>|=|\/)\d{1,4})|(=\d{1,4}(,\d{1,4})+)))(\s+(y|m|w|wm|d|dw|dy)(((<|>|=|\/)\d{1,4})|(=\d{1,4}(,\d{1,4})+))){0,6}))\s*\)\s*)?([0-2]\d:[0-5]\d)\s*-\s*(((20\d{2}-[01]\d-[0-3]\d)\s+([02]\d:[0-5]\d))|((([02]\d:[0-5]\d)|(\d{1,4})(:([0-5]\d))?(h))))(\s*)$/
});