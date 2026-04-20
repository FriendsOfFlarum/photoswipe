import PhotoSwipeLightbox from 'photoswipe/lightbox';

interface gallery {
  [key: string]: any;
  el: HTMLElement;
  tmpCurrIndex?: number;
}

declare module 'flarum/forum/components/CommentPost' {
  export default interface CommentPost {
    lightboxInit?: boolean;
    lightbox?: PhotoSwipeLightbox;
    lightboxCloseWatcher?: CloseWatcher;
    galleries?: gallery[];
  }
}

declare module 'flarum/forum/components/DiscussionListItem' {
  export default interface DiscussionListItem {
    lightboxInit?: boolean;
    lightbox?: PhotoSwipeLightbox;
    lightboxCloseWatcher?: CloseWatcher;
    galleries?: gallery[];
  }
}
