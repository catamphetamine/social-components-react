import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import PostQuoteBorderLeft from './PostQuoteBorderLeft.js'

import './PostQuoteBlock.css'

export default function PostQuoteBlock({
	kind,
	inline,
	generated,
	first,
	className,
	children
}) {
	// `<span/>`s are used instead of `<div/>`s
	// because the parent tag is `<a/>`
	// which can't contain block-level DOM elements.
	return (
		<span className={classNames(
			className,
			'PostQuoteBlock',
			kind && `PostQuoteBlock--${kind}`, {
				'PostQuoteBlock--generated': generated,
				'PostQuoteBlock--inline': inline,
				'PostQuoteBlock--first': first
			})}>
			<PostQuoteBorderLeft/>
			{/* Set the content to "> " for copy-pasting quotes. */}
			{/* It won't be visible due to `font-size: 0`. */}
			<span className="PostQuoteBlock__prefix">
				{'> '}
			</span>
			<q className="PostQuoteBlock__content">
				{children}
			</q>
		</span>
	)
}

PostQuoteBlock.propTypes = {
	// Regular "inline quotes" are delimited with `<br/>`s so they're rendered as
  // `inline-block`s so that there're no additional "new lines" around them.
  // At the same time there're `post-link`s having `quotes` that are rendered as
  // `block`s because they don't have additional "new lines" around them.
	inline: PropTypes.bool,
	// `kohlchan.net` and `8ch.net` have regular quotes and "inverse" quotes.
	kind: PropTypes.string,
	generated: PropTypes.bool,
	first: PropTypes.bool,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}