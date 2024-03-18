# Style Variables

This document describes the [CSS Variables](https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties) available for customization. If you have suggestions for new CSS Variables then contact the repo author through [issues](https://gitlab.com/catamphetamine/social-components-react/issues) to discuss that.

All variables listed here have their default values which are defined in the following files:
* [variables.css](https://gitlab.com/catamphetamine/social-components-react/blob/master/style/variables.css) — common defaults
* [variables.light.css](https://gitlab.com/catamphetamine/social-components-react/blob/master/style/variables.light.css) — custom defaults for light mode
* [variables.dark.css](https://gitlab.com/catamphetamine/social-components-react/blob/master/style/variables.dark.css) — custom defaults for dark mode

Some variables can potentially be missing from this document due to being overlooked.

## Picture

Represents a picture.

* `--Picture-backgroundColor: gray` — Background color of a picture while it's being loaded.
* `--Picture-borderWidth: 1px` — Picture border width.
* `--Picture-borderColor: gray` — Picture border color.
* `--Picture-borderColor--focus: gray` — Picture border color when focused.
* `--Picture-filter: none` — Picture filter. For example, "Dark Mode" uses `brightness(85%)`.

## Video

Represents a video.

## CommentTree

Comments — even single ones — are conceptually classified as "trees".

A "tree" is a structure having a "root" and (optionally) one or more children. Each of the children, in turn, can be a "root" of its own tree, making it a "recursive" structure. This is called "nesting" of deeper-level trees inside the ones that're higher-up in the hierarchy. First-level nesting is when a tree starts off a child of the top-most root element, etc.

When an element of a tree doesn't have any children, it's called a "leaf" one.

In order to visualize connections between the comments of a tree, "paths" are shown: from parent to child.

* `--CommentTree-marginLeft--child` — The horizontal shift between the left edge of a root comment and the left edges of its children.

### CommentTreePath

Describes a "path" of a tree.

* `--CommentTreePath-color: black` — The color of the tree path lines.
* `--CommentTreePath-color--branch: black` — The color of the "branch off" parts of a tree path: the path lines that "branch off" from a vertical one to the right.
* `--CommentTreePath-color--hover: orange` — The color of the tree path lines on mouse over.
* `--CommentTreePath-backgroundColor--hover: gray` — The background color of the tree path on mouse over.
* `--CommentTreePath-marginLeft` — The left margin of the tree path (relative to the left edge of the comment it starts off).
* `--CommentTreePath-marginLeftRatio--root` — The left margin of the tree path that starts off the root comment.

### CommentTreePathBranch

Describes a "branch off to side" part of a path of a tree.

* `--CommentTreePathBranch-marginLeft`
* `--CommentTreePathBranch-marginLeft--workaround` — (advanced) When viewed from an iOS device, for some reason the "branch" parts of the tree path of a root comment aren't visible. The bug was observed in iOS Safari at the early 2023. Supposedly, some kind of weird clipping occurs at the left edge. To work around that, the parent `<div/>`'s width is expanded by `1px` at the left side.
* `--CommentTreePathBranch-marginRight`
* `--CommentTreePathBranch-marginTop`

### CommentTreePathWithNoBranching

Describes the path of a tree that has no branching: the path starts off a comment and goes to the single child of that comment. In such cases, the presentation of such a "straightforward" parent-child relationship could be optimized, hence the use of this special case.

Could be styled in two different variants, depending on the preferred setting:
* `straight-through` — The tree path visually goes straight "through" the comment: enters it at the top and "exists" it at the bottom.
* `sideways` — The tree path exits from the left side of the parent comment, then turns to the left, proceeds vertically "from top to bottom" until it reaches the child comment's level, then turns to the left again and enters the child comment at its left side.

* `--CommentTreePathWithNoBranching-height--straightThrough` — The height of the tree path when using `through` style.

## Post

A "post" could represent a "comment" on a social network or in a chat, a "blog post", a "longread" article or even a book.

* `--Post-color--secondary: gray` — A color for "secondary" content of a post. "Secondary" content is everything besides the comment text (comment date, buttons color, icons color).

### PostQuoteBlock

* `--PostQuoteBlock-color: green` — Post quote text color.
* `--PostQuoteBlock-backgroundColor: transparent` — Post quote background color.
* `--PostQuoteBlock-backgroundColor--hover: gray` — Post quote background color on mouse over.
* `--PostQuoteBlock-borderColor: transparent` — Post quote border color.
<!-- * `--PostQuoteBlock-borderColor--hover: gray` — Post quote border color on mouse over. -->
<!-- * `--PostQuoteBlock-spacing: 0px` — The spacing between the "blocks" of a post quote. Each block is marked by a `PostQuoteBlockBorderLeft` (a vertical line on the left side of a quote). -->
* `--PostQuoteBlock-marginTop: 0px` — The top margin of a post quote. When a post quote has a background then the content is usually more readable with some additional vertical margin, and also this way consequtive post quotes don't look like a single one.
* `--PostQuoteBlock-marginBottom: 0px` — The bottom margin of a post quote. Is equal to `--PostQuoteBlock-marginTop` by default.

For autogenerated post links there're the same style variables but ending with a `--generated` postfix.

* `--PostQuoteBlock-color--generated`
* `--PostQuoteBlock-backgroundColor--generated`
* `--PostQuoteBlock-backgroundColor--generated--hover`
* `--PostQuoteBlock-borderColor--generated`
<!-- * `--PostQuoteBlock-borderColor--generated--hover` -->
<!-- * `--PostQuoteBlock-spacing--generated` -->
* `--PostQuoteBlock-marginTop--generated`
* `--PostQuoteBlock-marginBottom--generated`

`8ch.net` and imageboards running on `lynxchan` engine (such as `kohlchan.net`) have a notion of "inverse" quotes: the ones posted with a `<` prefix rather than the normal `>` quote prefix. There's no explanation on how "inverse" quotes are different from the normal ones and what's the purpose of their existence.

For "inverse" quotes there're the same style variables but ending with a `--inverse` postfix.

### PostQuoteBlockBorderLeft

"Post quote marker" is the vertical line on the left side of the quote.

* `--PostQuoteBlockBorderLeft-color: gray` — Post quote marker color.
* `--PostQuoteBlockBorderLeft-opacity: 1` — Post quote marker opacity.
* `--PostQuoteBlockBorderLeft-width: 2px` — Post quote marker width.
* `--PostQuoteBlockBorderLeft-marginTop: 0.2em` — Post quote marker top and bottom padding.

For autogenerated post links there're the same style variables for `PostQuoteBlockBorderLeft` but ending with a `--generated` postfix.

* `--PostQuoteBlockBorderLeft-color--generated`
* `--PostQuoteBlockBorderLeft-opacity--generated`
* `--PostQuoteBlockBorderLeft-width--generated`
* `--PostQuoteBlockBorderLeft-marginTop--generated`

For "inverse" quotes there're the same style variables but ending with a `--inverse` postfix.

### PostInlineSpoiler

* `--PostInlineSpoiler-color: gray` — Spoiler color.
* `--PostInlineSpoiler-color--contentActive: gray` — When a thread is clicked in a list of threads all spoilers in its opening post will have this color.
* `--PostInlineSpoiler-color--censored: red` — Ignored word spoiler color.
* `--PostInlineSpoiler-color--censoredContentActive: red` — When a thread is clicked in a list of threads all ignored word spoilers in its opening post will have this color.

<!-- ### PostAttachment -->

<!-- * `--PostAttachment-shadowColor--hover: gray` — The color of `box-shadow` of a post attachment on mouse over. -->

### PostVotes

Sometimes imageboards allow upvoting/downvoting comments and threads on some channels (for example, [`2ch.hk`](https://2ch.hk/) on [`po`](https://2ch.hk/po/) and [`news`](https://2ch.hk/news/) channels).

* `--PostVotes-color--positive: green` — The color of a positive post rating.
* `--PostVotes-color--positive: red` — The color of a negative post rating.
