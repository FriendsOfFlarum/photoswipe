<?php

namespace FoF\PhotoSwipe;

use s9e\TextFormatter\Configurator;

class MarkNormalPostImages
{
    const array TAGS = [ 'IMG' => 'src', 'UPL-IMAGE-PREVIEW' => 'url'];

    public function __invoke(Configurator $config): void
    {
        if (!$config->tags->offsetExists('URL')) {
            return;
        }

        $urlTag = $config->tags->get('URL');

        foreach (self::TAGS as $tagName => $src) {
            if (!$config->tags->offsetExists($tagName)) {
                continue;
            }

            $tag = $config->tags->get($tagName);
            $inner = $tag->template;

            $tag->template = <<<XSL
                <xsl:choose>
                    <xsl:when test="ancestor::URL">$inner</xsl:when>
                    <xsl:otherwise>
                        <a data-pswp="" href="{@$src}">$inner</a>
                    </xsl:otherwise>
                </xsl:choose>
                XSL;

            $urlTag->rules->allowChild($tagName);
        }
    }
}
