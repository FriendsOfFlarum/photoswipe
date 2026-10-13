import { afterEach, beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import bootstrapForum from '@flarum/jest-config/src/bootstrap/forum';
import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import m from 'mithril';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import Gallery from '../../src/forum/extenders/Gallery';

let root;
let Content;
let init;

beforeAll(() => bootstrapForum());

beforeEach(() => {
  root = document.createElement('div');
  init = jest.spyOn(PhotoSwipeLightbox.prototype, 'init');
  Content = class extends Component {
    view() {
      return m(
        this.attrs.rootTag ?? 'div',
        { className: this.attrs.rootGallery ? 'gallery' : '' },
        (this.attrs.ids ?? []).map((id) => m('section.gallery', { key: id, 'data-id': id }))
      );
    }
  };
});

afterEach(() => {
  m.render(root, []);
  jest.restoreAllMocks();
});

test('initializes the root gallery with the default image selector', () => {
  new Gallery(Content, '.gallery').extend(app);
  m.render(root, m(Content, { rootGallery: true }));

  expect(init).toHaveBeenCalledTimes(1);
  expect(init.mock.instances[0].options.gallery).toBe(root.firstElementChild);
  expect(init.mock.instances[0].options.children).toBe('a[data-pswp], a.FoFUpload--Upl-Image-Preview-Link');
});

test('keeps existing galleries on redraw and cleans up removed containers', () => {
  new Gallery(Content, '.gallery', { children: 'a.custom-image' }).extend(app);
  m.render(root, m(Content, { ids: ['a', 'b'] }));
  const [destroyA, destroyB] = init.mock.instances.map((lightbox) => jest.spyOn(lightbox, 'destroy'));
  const containerB = root.querySelector('[data-id="b"]');

  m.render(root, m(Content, { ids: ['a', 'b'] }));
  expect(init).toHaveBeenCalledTimes(2);

  m.render(root, m(Content, { ids: ['b', 'c'] }));
  expect(destroyA).toHaveBeenCalledTimes(1);
  expect(destroyB).not.toHaveBeenCalled();
  expect(root.querySelector('[data-id="b"]')).toBe(containerB);
  expect(init).toHaveBeenCalledTimes(3);
  expect(init.mock.instances[2].options.gallery).toBe(root.querySelector('[data-id="c"]'));
  expect(init.mock.instances[2].options.children).toBe('a.custom-image');
  const destroyC = jest.spyOn(init.mock.instances[2], 'destroy');

  m.render(root, []);
  expect(destroyA).toHaveBeenCalledTimes(1);
  expect(destroyB).toHaveBeenCalledTimes(1);
  expect(destroyC).toHaveBeenCalledTimes(1);
});

test('replaces the gallery when the component root changes', () => {
  new Gallery(Content, '.gallery').extend(app);
  m.render(root, m(Content, { rootGallery: true }));
  const destroy = jest.spyOn(init.mock.instances[0], 'destroy');
  const oldRoot = root.firstElementChild;

  m.render(root, m(Content, { rootGallery: true, rootTag: 'article' }));

  expect(root.firstElementChild).not.toBe(oldRoot);
  expect(destroy).toHaveBeenCalledTimes(1);
  expect(init).toHaveBeenCalledTimes(2);
  expect(init.mock.instances[1].options.gallery).toBe(root.firstElementChild);
});

test('keeps component instances independent', () => {
  new Gallery(Content, '.gallery').extend(app);
  m.render(root, [m(Content, { key: 'a', rootGallery: true }), m(Content, { key: 'b', rootGallery: true })]);
  const [destroyA, destroyB] = init.mock.instances.map((lightbox) => jest.spyOn(lightbox, 'destroy'));

  m.render(root, [m(Content, { key: 'b', rootGallery: true })]);

  expect(destroyA).toHaveBeenCalledTimes(1);
  expect(destroyB).not.toHaveBeenCalled();
  expect(init).toHaveBeenCalledTimes(2);
});

test('does not initialize galleries when the selector has no matches', () => {
  new Gallery(Content, '.gallery').extend(app);
  m.render(root, m(Content));
  expect(init).not.toHaveBeenCalled();
});

test('attaches to a component registered after the extender', () => {
  new Gallery('flarum/forum/components/Content', '.gallery').extend(app);
  expect(init).not.toHaveBeenCalled();

  flarum.reg.add('core', 'forum/components/Content', Content);
  m.render(root, m(Content, { rootGallery: true }));

  expect(init).toHaveBeenCalledTimes(1);
  expect(init.mock.instances[0].options.gallery).toBe(root.firstElementChild);
});
