import { afterEach, beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import bootstrapForum from '@flarum/jest-config/src/bootstrap/forum';
import app from 'flarum/forum/app';
import PhotoSwipe from 'photoswipe';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { readFileSync } from 'node:fs';
import { flatten } from 'flat';
import { load } from 'js-yaml';
import createLightbox from '../../src/forum/utils/createLightbox';

const translations = flatten(load(readFileSync(new URL('../../../resources/locale/en.yml', import.meta.url), 'utf8')));

let container;
let lightbox;
let cleanup;

beforeAll(() => {
  bootstrapForum();
  app.translator.addTranslations(translations);
});

beforeEach(() => {
  container = document.createElement('div');
  container.innerHTML = '<a data-pswp href="/a.jpg"><img></a><a data-pswp href="/b.jpg"><img></a>';
  const init = jest.spyOn(PhotoSwipeLightbox.prototype, 'init');
  cleanup = createLightbox(app, container, 'a[data-pswp]');
  lightbox = init.mock.instances[0];
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  delete window.CloseWatcher;
});

test('configures the gallery and translated controls', () => {
  expect(lightbox.options.gallery).toBe(container);
  expect(lightbox.options).toMatchObject({
    children: 'a[data-pswp]',
    escKey: true,
    closeTitle: translations['fof-photoswipe.forum.close_title'],
    zoomTitle: translations['fof-photoswipe.forum.zoom_title'],
    arrowPrevTitle: translations['fof-photoswipe.forum.arrow_prev_title'],
    arrowNextTitle: translations['fof-photoswipe.forum.arrow_next_title'],
    errorMsg: translations['fof-photoswipe.forum.error_msg'],
  });
});

test.each([
  ['link dimensions', '1200', '800', '600', '400', 300, 200, 1200, 800],
  ['image attributes', undefined, undefined, '600', '400', 300, 200, 600, 400],
  ['natural dimensions', 'invalid', '0', undefined, undefined, 300, 200, 300, 200],
  ['unloaded image', undefined, undefined, undefined, undefined, 0, 0, 0, 0],
])('uses %s for slide dimensions', (_name, linkWidth, linkHeight, width, height, naturalWidth, naturalHeight, expectedWidth, expectedHeight) => {
  const link = container.querySelector('a');
  const image = link.querySelector('img');
  if (linkWidth !== undefined) link.dataset.pswpWidth = linkWidth;
  if (linkHeight !== undefined) link.dataset.pswpHeight = linkHeight;
  if (width !== undefined) image.setAttribute('width', width);
  if (height !== undefined) image.setAttribute('height', height);
  Object.defineProperties(image, { naturalWidth: { value: naturalWidth }, naturalHeight: { value: naturalHeight } });

  expect(lightbox.applyFilters('domItemData', {}, link, link)).toMatchObject({
    width: expectedWidth,
    w: expectedWidth,
    height: expectedHeight,
    h: expectedHeight,
  });
});

test('refreshes a loaded image using the open gallery item order and removes the load listener on cleanup', () => {
  const links = [...container.querySelectorAll('a')];
  const pswp = new PhotoSwipe({ dataSource: { gallery: container, items: links.toReversed() } });
  lightbox.pswp = pswp;
  pswp.isOpen = true;
  const refresh = jest.spyOn(pswp, 'refreshSlideContent').mockImplementation(() => {});
  jest.spyOn(pswp, 'destroy').mockImplementation(() => {});

  links[0].querySelector('img').dispatchEvent(new Event('load'));
  expect(refresh).toHaveBeenCalledWith(1);

  cleanup();
  refresh.mockClear();
  links[0].querySelector('img').dispatchEvent(new Event('load'));
  expect(refresh).not.toHaveBeenCalled();
});

test.each(['closed', 'destroying', 'array source', 'missing item'])('ignores image loads for %s galleries', (state) => {
  const link = container.querySelector('a');
  const pswp = new PhotoSwipe({ dataSource: { gallery: container, items: state === 'missing item' ? [] : [link] } });
  lightbox.pswp = pswp;
  pswp.isOpen = state !== 'closed';
  pswp.isDestroying = state === 'destroying';
  if (state === 'array source') pswp.options.dataSource = [];
  const refresh = jest.spyOn(pswp, 'refreshSlideContent').mockImplementation(() => {});
  jest.spyOn(pswp, 'destroy').mockImplementation(() => {});

  link.querySelector('img').dispatchEvent(new Event('load'));
  expect(refresh).not.toHaveBeenCalled();
});

test('destroys an opening gallery after its animation ends', () => {
  const pswp = new PhotoSwipe({});
  lightbox.pswp = pswp;
  pswp.opener.isOpening = true;
  const destroy = jest.spyOn(pswp, 'destroy').mockImplementation(() => {});

  cleanup();
  destroy.mockClear();
  pswp.dispatch('openingAnimationEnd');
  expect(destroy).toHaveBeenCalledTimes(1);
});

test.each(['close', 'destroy'])('creates one CloseWatcher per opening and destroys it on %s and cleanup', (event) => {
  cleanup();
  const destroy = jest.fn();
  window.CloseWatcher = jest.fn().mockImplementation(() => ({ destroy }));
  cleanup = createLightbox(app, container, 'a[data-pswp]');
  lightbox = PhotoSwipeLightbox.prototype.init.mock.instances[1];
  expect(lightbox.options.escKey).toBe(false);

  lightbox.dispatch('beforeOpen');
  lightbox.dispatch('beforeOpen');
  expect(window.CloseWatcher).toHaveBeenCalledTimes(1);
  lightbox.dispatch(event);
  expect(destroy).toHaveBeenCalledTimes(1);

  lightbox.dispatch('beforeOpen');
  expect(window.CloseWatcher).toHaveBeenCalledTimes(2);
  cleanup();
  expect(destroy).toHaveBeenCalledTimes(2);
});

test('closes PhotoSwipe when CloseWatcher requests closing', () => {
  cleanup();
  const destroy = jest.fn();
  window.CloseWatcher = jest.fn().mockImplementation(() => ({ destroy }));
  cleanup = createLightbox(app, container, 'a[data-pswp]');
  lightbox = PhotoSwipeLightbox.prototype.init.mock.instances[1];
  lightbox.dispatch('beforeOpen');
  const pswp = new PhotoSwipe({});
  lightbox.pswp = pswp;
  const close = jest.spyOn(pswp, 'close').mockImplementation(() => {});
  jest.spyOn(pswp, 'destroy').mockImplementation(() => {});

  window.CloseWatcher.mock.results[0].value.onclose();

  expect(close).toHaveBeenCalledTimes(1);
  expect(destroy).toHaveBeenCalledTimes(1);
  cleanup();
  expect(destroy).toHaveBeenCalledTimes(1);
});
