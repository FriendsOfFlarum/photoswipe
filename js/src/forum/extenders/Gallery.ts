import type Component from 'flarum/common/Component';
import { extend } from 'flarum/common/extend';
import type IExtender from 'flarum/common/extenders/IExtender';
import type { IExtensionModule } from 'flarum/common/extenders/IExtender';
import type ForumApplication from 'flarum/forum/ForumApplication';

import createLightbox from '../utils/createLightbox';

export type GalleryComponent = string | { prototype: Component<any, any> };

export interface GalleryOptions {
  /** CSS selector for image links within each gallery container. */
  children?: string;
}

/** Attach independent DOM link galleries to a Flarum component. */
export default class Gallery implements IExtender<ForumApplication> {
  constructor(
    private component: GalleryComponent,
    private selector: string,
    private options: GalleryOptions = {}
  ) {}

  extend(app: ForumApplication, extension: IExtensionModule): void {
    const target = typeof this.component === 'string' ? this.component : this.component.prototype;
    const selector = this.selector;
    const children = this.options.children ?? 'a[data-pswp], a.FoFUpload--Upl-Image-Preview-Link';
    const galleries = new WeakMap<Component<any, any>, Map<HTMLElement, () => void>>();

    extend<Component<any, any>, 'oncreate' | 'onupdate'>(target, ['oncreate', 'onupdate'], function (_result, vnode) {
      // Component.element is set only oncreate; vnode.dom also tracks a replaced root.
      const root = vnode.dom;
      const containers = new Set<HTMLElement>();

      if (root instanceof HTMLElement) {
        if (root.matches(selector)) containers.add(root);
        root.querySelectorAll<HTMLElement>(selector).forEach((container) => containers.add(container));
      }

      const instances = galleries.get(this) ?? new Map<HTMLElement, () => void>();
      galleries.set(this, instances);

      instances.forEach((destroy, container) => {
        if (!containers.has(container)) {
          destroy();
          instances.delete(container);
        }
      });

      containers.forEach((container) => {
        if (!instances.has(container)) {
          instances.set(container, createLightbox(app, container, children));
        }
      });
    });

    extend<Component<any, any>, 'onremove'>(target, 'onremove', function () {
      galleries.get(this)?.forEach((destroy) => destroy());
      galleries.delete(this);
    });
  }
}
