import type ForumApplication from 'flarum/forum/ForumApplication';
/** Initialize one gallery and return its cleanup function. */
export default function createLightbox(app: ForumApplication, container: HTMLElement, children: string): () => void;
