<?php

namespace FoF\PhotoSwipe;

use s9e\TextFormatter\Configurator;

class MarkNormalPostImages
{
    const array TAGS = [ 'IMG' => 'src', 'UPL-IMAGE-PREVIEW' => 'url'];

    public function __invoke(Configurator $config): void
    {
        foreach (self::TAGS as $tagName => $src) {
            if ($config->tags->offsetExists($tagName)) {
                $tag = $config->tags->get($tagName);
                $tag->template = '<a data-pswp="" href="{@'.$src.'}">'.$tag->template.'</a>';
            }
        }
    }
}
