import type Component from 'flarum/common/Component';
import type IExtender from 'flarum/common/extenders/IExtender';
import type { IExtensionModule } from 'flarum/common/extenders/IExtender';
import type ForumApplication from 'flarum/forum/ForumApplication';
export type GalleryComponent = string | {
    prototype: Component<any, any>;
};
export interface GalleryOptions {
    /** CSS selector for image links within each gallery container. */
    children?: string;
}
/** Attach independent DOM link galleries to a Flarum component. */
export default class Gallery implements IExtender<ForumApplication> {
    private component;
    private selector;
    private options;
    constructor(component: GalleryComponent, selector: string, options?: GalleryOptions);
    extend(app: ForumApplication, extension: IExtensionModule): void;
}
