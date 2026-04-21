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

  components.forEach((prototype) => {
    extend(prototype, 'oninit', function (this) {
      // @ts-ignore
      const dataId: string = this.attrs.post?.id() || this.attrs.discussion?.id();

      const pswp = new PhotoSwipeLightbox({
        gallery: `[data-id="${dataId}"] .Post-body, [data-id="${dataId}"] .item-excerpt`,
        children: 'a[data-pswp], a.FoFUpload--Upl-Image-Preview-Link',
        escKey: !('CloseWatcher' in window),
        closeTitle: extractText(app.translator.trans('fof-photoswipe.forum.close_title')),
        zoomTitle: extractText(app.translator.trans('fof-photoswipe.forum.zoom_title')),
        arrowPrevTitle: extractText(app.translator.trans('fof-photoswipe.forum.arrow_prev_title')),
        arrowNextTitle: extractText(app.translator.trans('fof-photoswipe.forum.arrow_next_title')),
        errorMsg: extractText(app.translator.trans('fof-photoswipe.forum.error_msg')),
        pswpModule: () => import('./photoswipe'),
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

      const images = this.element.querySelectorAll<HTMLImageElement>('a[data-pswp] > img, a.FoFUpload--Upl-Image-Preview-Link > img');
      if (!images.length) return;

      images.forEach((image, index) => {
        const link = image.parentElement as HTMLAnchorElement;

        const setDimensions = () => {
          link.dataset.pswpWidth = image.getAttribute('width') || image.naturalWidth.toString();
          link.dataset.pswpHeight = image.getAttribute('height') || image.naturalHeight.toString();
        };

        if (image.getAttribute('width') && image.getAttribute('height')) {
          setDimensions();
        } else if (image.complete && image.naturalWidth) {
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
