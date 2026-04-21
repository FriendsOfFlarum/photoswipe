import PhotoSwipeLightbox from 'photoswipe/lightbox';

declare module 'flarum/forum/components/CommentPost' {
  export default interface CommentPost {
    lightboxInit?: boolean;
    lightbox?: PhotoSwipeLightbox;
    lightboxCloseWatcher?: CloseWatcher;
  }
}
