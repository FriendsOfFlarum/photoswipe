<?php

namespace FoF\PhotoSwipe\Tests\unit;

use Flarum\Post\CommentPost;
use FoF\PhotoSwipe\UploadImageDimensions;
use FoF\Upload\File;
use FoF\Upload\Relations\EmbeddedFiles;
use FoF\Upload\Repositories\FileRepository;
use Illuminate\Database\Eloquent\Collection;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use s9e\TextFormatter\Configurator;
use s9e\TextFormatter\Renderer;

class UploadImageDimensionsTest extends TestCase
{
    private function render(string $attributes, ?CommentPost $post): string
    {
        $repository = $this->createStub(FileRepository::class);
        $repository->method('getUrlForFile')->willReturn('https://cdn.example.com/image.jpg');

        return (new UploadImageDimensions($repository))(
            $this->createStub(Renderer::class),
            $post,
            '<r><UPL-IMAGE-PREVIEW '.$attributes.'/></r>'
        );
    }

    private function post(?int $width = 2400, ?int $height = 800): CommentPost
    {
        $file = (new File())->forceFill([
            'uuid' => 'image-uuid', 'url' => 'https://old.example.com/image.jpg',
            'image_width' => $width, 'image_height' => $height,
        ]);

        return (new CommentPost())->setRelation(EmbeddedFiles::NAME, new Collection([$file]));
    }

    #[Test]
    #[DataProvider('references')]
    public function uses_preloaded_original_dimensions(string $attributes): void
    {
        $xml = $this->render($attributes, $this->post());

        $this->assertStringContainsString('data-pswp-width="2400"', $xml);
        $this->assertStringContainsString('data-pswp-height="800"', $xml);
    }

    public static function references(): array
    {
        return [
            'uuid' => ['uuid="image-uuid" url="https://unrelated.example.com/image.jpg"'],
            'stored legacy URL' => ['url="https://old.example.com/image.jpg"'],
            'rewritten legacy URL' => ['url="https://cdn.example.com/image.jpg"'],
        ];
    }

    #[Test]
    #[DataProvider('invalidDimensions')]
    public function omits_incomplete_or_invalid_dimensions(?int $width, ?int $height): void
    {
        $xml = $this->render('uuid="image-uuid"', $this->post($width, $height));

        $this->assertStringNotContainsString('data-pswp-', $xml);
    }

    public static function invalidDimensions(): array
    {
        return [[null, null], [null, 800], [2400, null], [0, 800], [2400, 0], [-1, 800], [2400, -1]];
    }

    #[Test]
    public function does_not_fall_back_to_url_for_a_missing_uuid(): void
    {
        $xml = $this->render('uuid="deleted-uuid" url="https://old.example.com/image.jpg"', $this->post());

        $this->assertStringNotContainsString('data-pswp-', $xml);
    }

    #[Test]
    public function configuration_without_upload_is_unchanged(): void
    {
        $config = new Configurator();
        UploadImageDimensions::configure($config);

        $this->assertFalse($config->tags->offsetExists('UPL-IMAGE-PREVIEW'));
    }
}
