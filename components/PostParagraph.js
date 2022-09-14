import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { postInlineContent } from './PropTypes.js'

import './PostParagraph.css'

export default function PostParagraph({ first, children }) {
	// The `<span/>` wrapper around `children` is added
	// just to be able to detect whether a user clicked
	// on text or on empty space inside the
	// `PostParagraph` HTML element bounds.
	// This is used, for example, to call `onReply`
	// on double click on empty space in a paragraph,
	// while double click on text in paragraph
	// doesn't trigger `onReply`, and instead simply
	// selects text.
	return (
		<p className={classNames('PostParagraph', {
			'PostParagraph--first': first
		})}>
			<span>
				{children}
			</span>
		</p>
	)
}

PostParagraph.propTypes = {
	first: PropTypes.bool,
	children: PropTypes.oneOfType([
		postInlineContent,
		PropTypes.node
	]).isRequired
}