# PhotoSwipe

![License](https://img.shields.io/badge/license-MIT-blue.svg) [![Latest Stable Version](https://img.shields.io/packagist/v/fof/photoswipe)](https://packagist.org/packages/fof/photoswipe) [![Total Downloads](https://img.shields.io/packagist/dt/fof/photoswipe)](https://packagist.org/packages/fof/photoswipe/stats)

A [Flarum](https://flarum.org/) extension. [PhotoSwipe](https://photoswipe.com/) integration.

## Installation

Install with composer:

```sh
composer require fof/photoswipe:"*"
```

## Updating

```sh
composer update fof/photoswipe:"*"
php flarum assets:publish
php flarum cache:clear
```

## For Developers

### Gallery extender

With `fof/photoswipe` declared as an optional dependency, in your extension's `js/src/forum/extend.ts`:

```ts
import Gallery from 'ext:fof/photoswipe/forum/extenders/Gallery';

export default [
  ...('fof-photoswipe' in flarum.extensions
    ? [new Gallery('ext:mu-custom/extension/forum/components/ContentPage', '.ContentPage-body')]
    : []),
];
```

Pass a component class or module path (preserving lazy loading) and a container selector. Each matching container, including the root, is a separate gallery; containers must not be nested. The default image link selector is `a[data-pswp], a.FoFUpload--Upl-Image-Preview-Link`; override it with a third argument: `{ children: 'a.custom-image' }`.

## Links

- [Packagist](https://packagist.org/packages/fof/photoswipe)
- [GitHub](https://github.com/FriendsOfFlarum/photoswipe)
- [Discuss](https://discuss.flarum.org/d/39120)
