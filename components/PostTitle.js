import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { post } from './PropTypes.js'

import PostInlineContent from './PostInlineContent.js'

import './PostTitle.css'

export default function PostTitle({
	post,
	compact
}) {
	if (!post.title) {
		return null
	}
	return (
		<h1 className={classNames('PostTitle', {
			'PostTitle--compact': compact
		})}>
			{post.title && Array.isArray(post.title)
				? (
					<PostInlineContent>
						{post.title}
					</PostInlineContent>
				)
				: post.title
			}
		</h1>
	)
}

PostTitle.propTypes = {
	post: post.isRequired,
	compact: PropTypes.bool
}