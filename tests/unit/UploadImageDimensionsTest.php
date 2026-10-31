<?php

namespace FoF\PhotoSwipe\Tests\unit;

use FoF\PhotoSwipe\UploadImageDimensions;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use s9e\TextFormatter\Configurator;

class UploadImageDimensionsTest extends TestCase
{
    #[Test]
    #[DataProvider('dimensions')]
    public function maps_only_complete_positive_dimensions(string $attributes, bool $expected): void
    {
        $config = new Configurator();
        $config->tags->add('UPL-IMAGE-PREVIEW')->template = '<a class="FoFUpload--Upl-Image-Preview-Link" href="{@url}"><img src="{@thumbnail_url}" width="{@width}" height="{@height}"/></a>';
        (new UploadImageDimensions())($config);
        $renderer = $config->finalize()['renderer'];
        $html = $renderer->render('<r><UPL-IMAGE-PREVIEW '.$attributes.'/></r>');

        $this->assertSame($expected, str_contains($html, 'data-pswp-width="2400"'));
        $this->assertSame($expected, str_contains($html, 'data-pswp-height="800"'));
        if (!$expected) {
            $this->assertStringNotContainsString('data-pswp-', $html);
        }
    }

    public static function dimensions(): array
    {
        return [
            ['image_width="2400" image_height="800"', true],
            ['', false],
            ['image_width="2400"', false],
            ['image_height="800"', false],
            ['image_width="0" image_height="800"', false],
            ['image_width="2400" image_height="-1"', false],
        ];
    }

    #[Test]
    public function configuration_without_upload_is_unchanged(): void
    {
        $config = new Configurator();
        (new UploadImageDimensions())($config);

        $this->assertFalse($config->tags->offsetExists('UPL-IMAGE-PREVIEW'));
    }
}
