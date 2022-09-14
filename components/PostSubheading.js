import React from 'react'

import { postInlineContent } from './PropTypes.js'

import './PostSubheading.css'

export default function PostSubheading({ children: content }) {
	return (
		<h2 className="PostSubheading">
			{content}
		</h2>
	)
}

PostSubheading.propTypes = {
	children: postInlineContent.isRequired
}