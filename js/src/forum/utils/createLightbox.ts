import type ForumApplication from 'flarum/forum/ForumApplication';
import extractText from 'flarum/common/utils/extractText';
import PhotoSwipeLightbox from 'photoswipe/lightbox';

/** Initialize one gallery and return its cleanup function. */
export default function createLightbox(app: ForumApplication, container: HTMLElement, children: string): () => void {
  const lightbox = new PhotoSwipeLightbox({
    gallery: container,
    children,
    escKey: !('CloseWatcher' in window),
    closeTitle: extractText(app.translator.trans('fof-photoswipe.forum.close_title')),
    zoomTitle: extractText(app.translator.trans('fof-photoswipe.forum.zoom_title')),
    arrowPrevTitle: extractText(app.translator.trans('fof-photoswipe.forum.arrow_prev_title')),
    arrowNextTitle: extractText(app.translator.trans('fof-photoswipe.forum.arrow_next_title')),
    errorMsg: extractText(app.translator.trans('fof-photoswipe.forum.error_msg')),
    pswpModule: () => import('../photoswipe'),
  });

  lightbox.addFilter('domItemData', (itemData, element, link) => {
    const image = element.querySelector('img');
    itemData.width = itemData.w = Number(link?.dataset.pswpWidth) || Number(image?.getAttribute('width')) || image?.naturalWidth || 0;
    itemData.height = itemData.h = Number(link?.dataset.pswpHeight) || Number(image?.getAttribute('height')) || image?.naturalHeight || 0;
    return itemData;
  });

  let closeWatcher: CloseWatcher | undefined;
  const destroyCloseWatcher = () => {
    closeWatcher?.destroy();
    closeWatcher = undefined;
  };

  lightbox.on('beforeOpen', () => {
    if (!closeWatcher && 'CloseWatcher' in window) {
      closeWatcher = new CloseWatcher();
      closeWatcher.onclose = () => {
        destroyCloseWatcher();
        lightbox.pswp?.close();
      };
    }
  });
  lightbox.on('close', destroyCloseWatcher);
  lightbox.on('destroy', destroyCloseWatcher);

  const onImageLoad = (event: Event) => {
    const pswp = lightbox.pswp;
    if (!pswp?.isOpen || pswp.isDestroying || !(event.target instanceof HTMLImageElement)) return;

    const link = event.target.closest<HTMLAnchorElement>(children);
    const source = pswp.options.dataSource;
    if (!link || !source || Array.isArray(source)) return;

    // DOM order can change while open; use PhotoSwipe's current item list.
    const index = source.items?.indexOf(link) ?? -1;
    if (index !== -1) pswp.refreshSlideContent(index);
  };

  container.addEventListener('load', onImageLoad, true);
  lightbox.init();

  return () => {
    container.removeEventListener('load', onImageLoad, true);
    destroyCloseWatcher();

    // PhotoSwipe cannot close during its opening animation.
    const pswp = lightbox.pswp;
    if (pswp?.opener.isOpening) pswp.on('openingAnimationEnd', () => pswp.destroy());

    lightbox.destroy();
  };
}
