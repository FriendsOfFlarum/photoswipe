<?php

namespace FoF\PhotoSwipe;

use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less'),

    (new Extend\Formatter())
        ->configure(MarkNormalPostImages::class),
];
