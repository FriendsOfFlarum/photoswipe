<?php

namespace FoF\PhotoSwipe\Tests\integration;

use DOMDocument;
use Flarum\Discussion\Discussion;
use Flarum\Post\Post;
use Flarum\Testing\integration\TestCase;
use Flarum\Formatter\Formatter;
use Flarum\User\User;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;

class UploadImageDimensionsTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->extension('fof-upload', 'fof-photoswipe');
        $this->prepareDatabase([
            Discussion::class => [
                ['id' => 1, 'title' => 'Images', 'user_id' => 1, 'first_post_id' => 1, 'last_post_id' => 4, 'comment_count' => 4, 'last_post_number' => 4],
                ['id' => 2, 'title' => 'One image', 'user_id' => 1, 'first_post_id' => 5, 'last_post_id' => 5, 'comment_count' => 1, 'last_post_number' => 1],
            ],
            Post::class => [
                $this->post(1, 1, 1, $this->image(1).$this->image(2).$this->image(3).$this->image(99)),
                $this->post(2, 1, 2, '<UPL-IMAGE-PREVIEW url="https://old.example.com/image-1.png"/>'),
                $this->post(3, 1, 3, '<p>No images.</p>'),
                $this->post(4, 1, 4, $this->image(1)),
                $this->post(5, 2, 1, $this->image(1)),
            ],
            'fof_upload_files' => [
                $this->file(1, ['image_width' => 2400, 'image_height' => 800]),
                $this->file(2),
                $this->file(3, ['image_width' => 2400]),
            ],
        ]);
    }

    #[Test]
    public function rendered_html_has_original_dimensions_before_the_lightbox_opens(): void
    {
        $response = $this->send($this->request('GET', '/api/posts/1'));
        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $body = json_decode((string) $response->getBody(), true);
        $document = new DOMDocument();
        $document->loadHTML($body['data']['attributes']['contentHtml']);
        $links = $document->getElementsByTagName('a');
        $image = $links[0]->getElementsByTagName('img')->item(0);

        $this->assertSame('2400', $links[0]->getAttribute('data-pswp-width'));
        $this->assertSame('800', $links[0]->getAttribute('data-pswp-height'));
        $this->assertSame('http://localhost/assets/files/files/image-1.png', $links[0]->getAttribute('href'));
        $this->assertSame('800', $image->getAttribute('width'));
        $this->assertSame('267', $image->getAttribute('height'));
        $this->assertSame('http://localhost/assets/files/files/thumb-1.webp', $image->getAttribute('src'));
        $this->assertSame('Description', $image->getAttribute('alt'));
        $this->assertSame('_blank', $links[0]->getAttribute('target'));

        foreach ([$links[1], $links[2], $links[3]] as $link) {
            $this->assertFalse($link->hasAttribute('data-pswp-width'));
            $this->assertFalse($link->hasAttribute('data-pswp-height'));
        }
    }

    #[Test]
    public function finds_legacy_images_after_upload_rewrites_the_url(): void
    {
        $response = $this->send($this->request('GET', '/api/posts/2'));
        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $body = json_decode((string) $response->getBody(), true);
        $html = $body['data']['attributes']['contentHtml'];

        $this->assertStringContainsString('http://localhost/assets/files/files/image-1.png', $html);
        $this->assertStringContainsString('data-pswp-width="2400"', $html);
        $this->assertStringContainsString('data-pswp-height="800"', $html);
    }

    #[Test]
    public function upload_html_is_unchanged_when_photoswipe_is_disabled(): void
    {
        $this->extensions = ['fof-upload'];
        $response = $this->send($this->request('GET', '/api/posts/1'));

        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $this->assertStringNotContainsString('data-pswp-', (string) $response->getBody());
    }

    #[Test]
    public function photoswipe_boots_without_upload_enabled(): void
    {
        $this->extensions = ['fof-photoswipe'];
        unset($this->databaseContent['fof_upload_files']);
        $response = $this->send($this->request('GET', '/api/posts/3'));

        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $this->assertStringContainsString('No images.', (string) $response->getBody());
    }

    #[Test]
    public function original_dimensions_are_available_outside_posts(): void
    {
        $formatter = $this->app()->getContainer()->make(Formatter::class);
        $html = $formatter->render('<r>'.$this->image(1).'</r>', new User());

        $this->assertStringContainsString('data-pswp-width="2400"', $html);
        $this->assertStringContainsString('data-pswp-height="800"', $html);
        $this->assertStringContainsString('width="800" height="267"', $html);
    }
    #[Test]
    #[DataProvider('requestPairs')]
    public function upload_queries_do_not_grow_with_the_number_of_posts(array $few, array $many): void
    {
        $fewQueries = $this->uploadQueries(...$few);
        $manyQueries = $this->uploadQueries(...$many);

        $this->assertGreaterThan(0, $manyQueries['files']);
        $this->assertSame($fewQueries['files'], $manyQueries['files']);
        $this->assertSame(0, $manyQueries['downloads']);
    }

    public static function requestPairs(): array
    {
        return [
            'posts' => [['/api/posts', ['filter' => ['discussion' => 2]]], ['/api/posts', ['filter' => ['discussion' => 1]]]],
            'discussion' => [['/api/discussions/2'], ['/api/discussions/1']],
            'discussion list' => [
                ['/api/discussions', ['include' => 'firstPost,lastPost', 'page' => ['limit' => 1]]],
                ['/api/discussions', ['include' => 'firstPost,lastPost']],
            ],
            'forum page' => [['/d/2'], ['/d/1']],
        ];
    }

    private function uploadQueries(string $path, array $query = []): array
    {
        $response = $this->send($this->request('GET', $path)->withQueryParams($query));
        $this->assertSame(200, $response->getStatusCode(), (string) $response->getBody());
        $sql = array_column($this->database()->getQueryLog(), 'query');

        return [
            'files' => count(array_filter($sql, fn ($query) => str_contains($query, 'fof_upload_files'))),
            'downloads' => count(array_filter($sql, fn ($query) => str_contains($query, 'fof_upload_downloads'))),
        ];
    }

    private function post(int $id, int $discussion, int $number, string $content): array
    {
        return ['id' => $id, 'discussion_id' => $discussion, 'number' => $number, 'user_id' => 1, 'type' => 'comment', 'content' => '<r>'.$content.'</r>'];
    }

    private function image(int $id): string
    {
        return '<UPL-IMAGE-PREVIEW uuid="'.sprintf('00000000-0000-0000-0000-%012d', $id).'" url="https://old.example.com/image-'.$id.'.png" alt="Description"/>';
    }

    private function file(int $id, array $dimensions = []): array
    {
        return $dimensions + [
            'id' => $id, 'uuid' => sprintf('00000000-0000-0000-0000-%012d', $id),
            'base_name' => 'image-'.$id.'.png', 'path' => 'files/image-'.$id.'.png',
            'url' => 'https://old.example.com/image-'.$id.'.png', 'type' => 'image/png',
            'size' => 1000, 'upload_method' => 'local', 'actor_id' => 1,
            'thumbnail_path' => 'files/thumb-'.$id.'.webp', 'thumbnail_width' => 800, 'thumbnail_height' => 267,
            'created_at' => '2026-01-01 00:00:00',
        ];
    }
}
