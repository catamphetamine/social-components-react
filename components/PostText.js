import React from 'react'
import PropTypes from 'prop-types'

import { postTextStyle, postInlineContent } from './PropTypes.js'

import './PostText.css'

export default function PostText({ style, children }) {
	const Tag = getTagForStyle(style)
	if (Tag) {
		return (
			<Tag>
				{children}
			</Tag>
		)
	}
	return (
		<span className={`PostText--${style}`}>
			{children}
		</span>
	)
	return children
}

PostText.propTypes = {
	style: postTextStyle.isRequired,
	// `content` is already pre-rendered.
	children: PropTypes.node.isRequired
}

function getTagForStyle(style) {
	switch (style) {
		case 'bold':
			return 'strong'
		case 'italic':
			return 'em'
		case 'strikethrough':
			return 'del'
		case 'superscript':
			return 'sup'
		case 'subscript':
			return 'sub'
	}
}