import PhotoSwipeLightbox from 'photoswipe/lightbox';

declare module 'flarum/forum/components/CommentPost' {
  export default interface CommentPost {
    lightboxInit?: boolean;
    lightbox?: PhotoSwipeLightbox;
    lightboxCloseWatcher?: CloseWatcher;
  }
}

declare module 'flarum/forum/components/DiscussionListItem' {
  export default interface DiscussionListItem {
    lightboxInit?: boolean;
    lightbox?: PhotoSwipeLightbox;
    lightboxCloseWatcher?: CloseWatcher;
  }
}
