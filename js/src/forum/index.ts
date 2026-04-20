import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import CommentPost from 'flarum/forum/components/CommentPost';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

app.initializers.add('fof/photoswipe', () => {
  const components: Array<CommentPost | DiscussionListItem> = [CommentPost.prototype];

  if ('ianm-synopsis' in flarum.extensions) {
    components.push(DiscussionListItem.prototype);
  }

  const hasGalleryExtension = 'datitisev-post-galleries' in flarum.extensions;

  components.forEach((prototype) => {
    extend(prototype, 'oninit', function (this) {
      // @ts-ignore
      const dataId: string = this.attrs.post?.id() || this.attrs.discussion?.id();
      const selectors: string[] = [
        // A Photoswipe instance for images per post, per excerpt, and per article.
        `[data-id="${dataId}"] .Post-body:not(:has(.swiper)), [data-id="${dataId}"] .item-excerpt:not(:has(.swiper)), .FlarumBlog-Article .Post-body:not(:has(.swiper))`,
      ];

      if (hasGalleryExtension) {
        const singleImagesOutsideGalleries = ':not(:has(.swiper)):not([class^="swiper"]):has(>a[data-pswp])';
        selectors.push(
          `[data-id="${dataId}"] .Post-body ${singleImagesOutsideGalleries}, [data-id="${dataId}"] .item-excerpt ${singleImagesOutsideGalleries}, .FlarumBlog-Article .Post-body ${singleImagesOutsideGalleries}`
        );
        // A Photoswipe instance for images per gallery (per post, per excerpt, and per article).
        selectors.push(
          `[data-id="${dataId}"] .Post-body .swiper, [data-id="${dataId}"] .item-excerpt .swiper, .FlarumBlog-Article .Post-body .swiper`
        );
      }

      this.lightbox = new PhotoSwipeLightbox({
        gallery: selectors.join(', '),
        children: 'a[data-pswp]',
        pswpModule: async () => {
          __webpack_public_path__ = `${app.forum.attribute('baseUrl')}/assets/extensions/fof-photoswipe/`;
          const pswpJs = import('photoswipe');
          await import('photoswipe/dist/photoswipe.css');
          return pswpJs;
        },
      });
    });

    extend(prototype, ['onupdate', 'oncreate'], function () {
      // @ts-ignore
      this.$('a[data-pswp] > img').each((index, el: HTMLImageElement) => {
        const $el = $(el);
        const $a = $el.parent('a');
        const setDimensions = () => {
          $a.attr('data-pswp-width', el.naturalWidth);
          $a.attr('data-pswp-height', el.naturalHeight);
        };

        if (el.complete && el.naturalWidth) {
          setDimensions();
          this.lightbox.init();
        } else {
          el.onload = () => {
            setDimensions();
            this.lightbox.init();

            if (this.lightbox.pswp) this.lightbox.pswp.refreshSlideContent(index);
          };
        }
      });

      // Timeout to make sure galleries were initialized
      setTimeout(() => {
        if (this.galleries) {
          this.lightbox.on('change', () => {
            // Match the swiper current slide with the photoswipe current slide.
            const gallery = this.galleries.find((swiper: any) => this.lightbox.options.dataSource.gallery === swiper.$el[0]);
            gallery?.slideTo(this.lightbox.pswp.currIndex, 0, false);

            this.galleries
              .filter((swiper: any) => this.lightbox.options.dataSource.gallery !== swiper.$el[0])
              .map((swiper: any) => {
                swiper.tmpCurrIndex = swiper.currIndex;
                swiper.slideTo(this.lightbox.pswp.currIndex, 0, false);
                return swiper;
              })
              .forEach((swiper: any) => swiper.slideTo(swiper.tmpCurrIndex, 0, false));
          });
        }
      }, 100);
    });

    extend(prototype, 'onremove', function () {
      this.lightbox.destroy();
      this.lightbox = null;
    });
  });
});
