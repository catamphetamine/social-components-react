# `social-components-react`

A React implemenation of [`social-components`](https://npmjs.com/package/social-components) data structures, along with generic social service React components.

## Install

<!--
```
npm install social-components-react --save
```
-->

Clone the repository:

```
git clone https://gitlab.com/catamphetamine/frontend-lib.git
git clone https://gitlab.com/catamphetamine/social-components-react.git
```

## Use

Simply `import` components from the repository directory:

```js
import Post from '../../social-components-react/components/Post.js'
```

The reason for using these components as source code instead of importing them from an npm package is because a developer might prefer to modify them.

### Styles

Styles are defined in [`./style/variables.css`](https://gitlab.com/catamphetamine/social-components-react/blob/master/style/variables.css) and should be included on a page.

```css
@import "../../social-components-react/style/variables.css";
```

A developer might want to define some global "defaults", along with overriding some of the variables' values:

```css
@import "../../social-components-react/style/variables.css";

:root {
  /* A "modular grid" unit. */
  --unit: 14px;

  /* The color of the white color. Could be dimmed a little bit in Dark Mode. */
  --white-color: white;

  /* Text settings. */
  --SocialComponents-fontFamily: sans-serif;
  --SocialComponents-fontFamily--text: serif;
  --SocialComponents-lineHeight: 1.35em;

  /* Color (from light to dark) */
  --SocialComponents-color-100: #eaeaea;
  --SocialComponents-color-200: #dddddd;
  --SocialComponents-color-300: #cecece;
  --SocialComponents-color-400: #b7b7b7;
  --SocialComponents-color-500: #999999;
  --SocialComponents-color-600: #7b7b7b;
  --SocialComponents-color-700: #666666;
  --SocialComponents-color-800: #555555;
  --SocialComponents-color-900: #444444;

  /* Background Color */
  --SocialComponents-backgroundColor: white;

  /* Clickable Color */
  --SocialComponentsClickable-color: orange;
  --SocialComponentsClickable-color--active: yellow;
  /* "Clickable text" buttons are usually colored a bit darker. */
  --SocialComponentsClickable-color--text: brown;
}
```

Light Mode / Dark Mode styles are defined by `"light"` or `"dark"` CSS class being added to the `<html/>` element:

* Add `"light"` CSS class to the `<html/>` element to enable Light Mode.
* Add `"dark"` CSS class to the `<html/>` element to enable Dark Mode.

## Use

* [`PropTypes`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/PropTypes.js) — provides React `PropTypes` for `social-components` data structures.

* [`<Post/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/Post.js) — renders a [`Post`](https://gitlab.com/catamphetamine/social-components/blob/master/docs/Post.md) data structure.

* [`<CommentTree/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/CommentTree.js) — renders a tree of abstract "comments". Each "comment" must have an `id` property and an optional `replies?: Comment[]` property.

* [`<Slideshow/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/Slideshow.js) — shows [`Picture`](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#picture)s or [`Video`](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#video)s.

* [`<Picture/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/Picture.js) — renders a [`Picture`](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#picture).

* [`<Video/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/Video.js) — renders a [`Video`](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#video).

* [`<PictureStack/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/Picture.js) — renders a "stack" of [`Picture`](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#picture)s (only the top picture is shown, others are "hidden" beneath it).

* [`<PictureBadge/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/PictureBadge.js) — renders a "badge" with arbitrary content over a `<Picture/>`.

* [`<Tweet/>`](https://gitlab.com/catamphetamine/social-components-react/blob/master/components/Tweet.js) — renders a ["tweet"](https://twitter.com/).

## Slideshow

```js
import React, { useState, useCallback } from 'react'

import Slideshow from '../../social-components-react/components/Slideshow.js'
import useDeviceInfo from '../../social-components-react/hooks/useDeviceInfo.js'

function Application() {
  // Add `useDeviceInfo()` hook at the top level of a React application.
  // It detects whether the device supports touch input.
  useDeviceInfo()

  return <Page/>
}

function Page() {
  const [isOpen, setOpen] = useState()

  const onClose = useCallback(() => setOpen(false), [setOpen])

  return (
    <Slideshow
      slides={slides}
      isOpen={isOpen}
      onClose={onClose}
      overlayOpacity={0.5}
      showControls={true/false}
      showPagination={true/false}
      closeOnSlideClick={true/false}
    />
  )
}
```

#### Slides

`<Slideshow/>` supports the following types of slides:

* [Picture](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#picture)

```js
{
  type: 'picture',
  picture: {
    url: 'https://example.com/image.jpg',
    type: 'image/jpeg',
    width: 400,
    height: 400
  }
}
```

* [Video](https://gitlab.com/catamphetamine/social-components/-/blob/master/docs/ContentTypes.md#video) (supports YouTube or Vimeo)

```js
{
  type: 'video',
  video: {
    type: 'video/mp4',
    url: 'https://example.com/video.mp4',
    width: 1920,
    height: 1080,
    duration: 60,
    picture: {
      url: 'https://example.com/video-poster.jpg',
      type: 'image/jpeg',
      width: 1920,
      height: 1080
    }
  }
}
```

#### Initial Slide Index

By default, the slideshow starts showing slides from the first one. To open a slideshow starting from a specific slide, pass the initial slide index as an `initialSlideIndex: number` property.

#### Opening Pictures in Hover Mode

Pass `openPictureInHoverMode: true` property to open picture slides in "hover" mode, that is when an expanded picture slide gets rendered right over the thumbnail picture that got cliked, and the "black" overlay opacity is very subtle, along with hiding slideshow controls.

The rationale for the "hover" mode is that it's less intrusive than the regular "open slideshow" mode.

#### "Float on open/close" animation

When `animateOpenClose: "float"` property is passed, the slideshow plays a "float" animation on initial slide open/close.

* When slideshow is opened, the initial slide "floats" and expands from the thumbnail picture.
* When the initial slide is closed, it "floats" and minimizes back to the thumbnail picture.

The thumbnail picture should be passed as `imageElement` property. It should be set to the DOM `Element` of a thumbnail picture the user has clicked on.

To set the "black" overlay opacity specifically for the "float on open/close" cases, use `overlayOpacityOnFloatOpenCloseAnimation: number` property.

###### "Small Screen"

To only play the "float on open/close" animation on "small screens", use `animateOpenCloseOnSmallScreen: "float"` property.

The maximum width of a screen that is considered "small" is defined by `smallScreenMaxWidth: number` property.

#### Go To Source

(advanced)

If `goToSource: (slide) => { ... }` property is passed, `<Slideshow/>` will show a "Go To Source" button when showing a slide. When a user clicks on that button, the `goToSource(slide)` function gets called. The function should close the slideshow and scroll to the currently shown `slide`'s thumbnail image.

## GitHub Ban

On March 9th, 2020, GitHub, Inc. silently [banned](https://medium.com/@catamphetamine/how-github-blocked-me-and-all-my-libraries-c32c61f061d3) my account (erasing all my repos, issues and comments) without any notice or explanation. Because of that, all source codes had to be promptly moved to GitLab. The [GitHub repo](https://github.com/catamphetamine/social-components-react) is now only used as a backup (you can star the repo there too), and the primary repo is now the [GitLab one](https://gitlab.com/catamphetamine/social-components-react). Issues can be reported in any repo.

## License

[MIT](LICENSE)