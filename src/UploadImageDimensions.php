<?php

namespace FoF\PhotoSwipe;

use Flarum\Post\Post;
use FoF\Upload\Relations\EmbeddedFiles;
use FoF\Upload\Repositories\FileRepository;
use s9e\TextFormatter\Configurator;
use s9e\TextFormatter\Renderer;
use s9e\TextFormatter\Utils;

class UploadImageDimensions
{
    public function __construct(private FileRepository $files)
    {
    }

    public static function configure(Configurator $config): void
    {
        if (!$config->tags->offsetExists('UPL-IMAGE-PREVIEW')) {
            return;
        }

        $dom = $config->tags['UPL-IMAGE-PREVIEW']->template->asDOM();

        foreach ($dom->query('//a[contains(concat(" ", normalize-space(@class), " "), " FoFUpload--Upl-Image-Preview-Link ")]') as $link) {
            $link->prependXslCopyOf('@data-pswp-width');
            $link->prependXslCopyOf('@data-pswp-height');
        }

        $dom->saveChanges();
    }

    public function __invoke(Renderer $renderer, mixed $context, string $xml): string
    {
        if (!str_contains($xml, '<UPL-IMAGE-PREVIEW') || !$context instanceof Post || !$context->relationLoaded(EmbeddedFiles::NAME)) {
            return $xml;
        }

        $byUuid = [];
        $byUrl = [];

        foreach ($context->getRelation(EmbeddedFiles::NAME) as $file) {
            if ($file->image_width > 0 && $file->image_height > 0) {
                $byUuid[$file->uuid] = $file;
                $byUrl[$file->url] = $file;

                // Upload may already have replaced a legacy embed's URL with its current URL.
                if ($url = $this->files->getUrlForFile($file)) {
                    $byUrl[$url] = $file;
                }
            }
        }

        return Utils::replaceAttributes($xml, 'UPL-IMAGE-PREVIEW', function ($attributes) use ($byUuid, $byUrl) {
            $file = !empty($attributes['uuid'])
                ? ($byUuid[$attributes['uuid']] ?? null)
                : ($byUrl[$attributes['url'] ?? ''] ?? null);

            if ($file) {
                $attributes['data-pswp-width'] = $file->image_width;
                $attributes['data-pswp-height'] = $file->image_height;
            }

            return $attributes;
        });
    }
}
