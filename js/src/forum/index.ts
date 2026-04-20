import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import CommentPost from 'flarum/forum/components/CommentPost';
import DiscussionListItem from 'flarum/forum/components/DiscussionListItem';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import extractText from 'flarum/common/utils/extractText';

app.initializers.add('fof/photoswipe', () => {
  const components: Array<CommentPost | DiscussionListItem> = [CommentPost.prototype];

  if ('fof-synopsis' in flarum.extensions) {
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

      const pswp = new PhotoSwipeLightbox({
        gallery: selectors.join(', '),
        children: 'a[data-pswp]',
        escKey: !('CloseWatcher' in window),
        closeTitle: extractText(app.translator.trans('fof-photoswipe.forum.close_title')),
        zoomTitle: extractText(app.translator.trans('fof-photoswipe.forum.zoom_title')),
        arrowPrevTitle: extractText(app.translator.trans('fof-photoswipe.forum.arrow_prev_title')),
        arrowNextTitle: extractText(app.translator.trans('fof-photoswipe.forum.arrow_next_title')),
        errorMsg: extractText(app.translator.trans('fof-photoswipe.forum.error_msg')),
        pswpModule: async () => {
          __webpack_public_path__ = `${app.forum.attribute('baseUrl')}/assets/extensions/fof-photoswipe/`;
          const pswpJs = import('photoswipe');
          // Wait for the CSS to load to prevent flickering.
          await import('photoswipe/dist/photoswipe.css');
          return pswpJs;
        },
      });

      pswp.on('beforeOpen', () => {
        if (!this.lightboxCloseWatcher && 'CloseWatcher' in window) {
          this.lightboxCloseWatcher = new CloseWatcher();
          this.lightboxCloseWatcher.onclose = () => {
            this.lightboxCloseWatcher = undefined;
            if (pswp.pswp && pswp.pswp.isOpen) {
              pswp.pswp.close();
            }
          };
        }
      });
      pswp.on('close', () => {
        if (this.lightboxCloseWatcher) {
          this.lightboxCloseWatcher.destroy();
          this.lightboxCloseWatcher = undefined;
        }
      });

      this.lightbox = pswp;
    });

    extend(prototype, ['onupdate', 'oncreate'], function (this) {
      if (!this.lightbox) return;

      const images = this.element.querySelectorAll<HTMLImageElement>('a[data-pswp] > img');
      if (!images.length) return;

      images.forEach((image, index) => {
        const link = image.parentElement as HTMLAnchorElement;

        const setDimensions = () => {
          link.dataset.pswpWidth = image.naturalWidth.toString();
          link.dataset.pswpHeight = image.naturalHeight.toString();
        };

        if (image.complete && image.naturalWidth) {
          setDimensions();
        } else {
          image.addEventListener('load', () => {
            setDimensions();
            if (this.lightbox?.pswp) {
              this.lightbox.pswp.refreshSlideContent(index);
            }
          });
        }
      });

      if (!this.lightboxInit) {
        this.lightbox.init();
        this.lightboxInit = true;
      }

      if (hasGalleryExtension && this.lightbox && this.galleries) {
        this.lightbox.on('change', () => {
          const pswp = this.lightbox?.pswp;
          if (!pswp) return;

          // @ts-ignore
          const currEl: HTMLElement | undefined = pswp.currSlide?.data?.element ?? pswp.options?.dataSource?.items?.[pswp.currIndex]?.element;
          if (!currEl) return;

          const activeGallery = this.galleries!.find((swiper: any) => swiper.el.contains(currEl));
          if (!activeGallery) return;

          // @ts-ignore
          const targetIndex = Array.from(activeGallery.slides).findIndex((slide) => slide.contains(currEl));
          activeGallery.slideTo(targetIndex >= 0 ? targetIndex : pswp.currIndex, 0, false);

          this.galleries!.filter((swiper) => swiper !== activeGallery).forEach((swiper) => {
            const prev = swiper.tmpCurrIndex ?? swiper.activeIndex;
            swiper.tmpCurrIndex = prev;
            swiper.slideTo(prev, 0, false);
          });
        });
      }
    });

    extend(prototype, 'onremove', function () {
      if (this.lightbox) {
        this.lightbox.destroy();
        this.lightbox = undefined;
      }
      if (this.lightboxCloseWatcher) {
        this.lightboxCloseWatcher.destroy();
        this.lightboxCloseWatcher = undefined;
      }
    });
  });
});
