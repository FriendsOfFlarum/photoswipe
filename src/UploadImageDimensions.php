<?php

namespace FoF\PhotoSwipe;

use s9e\TextFormatter\Configurator;

class UploadImageDimensions
{
    public function __invoke(Configurator $config): void
    {
        if (!$config->tags->offsetExists('UPL-IMAGE-PREVIEW')) {
            return;
        }

        $dom = $config->tags['UPL-IMAGE-PREVIEW']->template->asDOM();

        foreach ($dom->query('//a[contains(concat(" ", normalize-space(@class), " "), " FoFUpload--Upl-Image-Preview-Link ")]') as $link) {
            $dimensions = $link->prependXslIf('@image_width > 0 and @image_height > 0');
            $dimensions->appendXslAttribute('data-pswp-width')->appendXslValueOf('@image_width');
            $dimensions->appendXslAttribute('data-pswp-height')->appendXslValueOf('@image_height');
        }

        $dom->saveChanges();
    }
}
