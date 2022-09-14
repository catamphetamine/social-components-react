import React from 'react'

import { linkAttachmentShape } from './PropTypes.js'

import './PostAttachmentLink.css'

export default function PostAttachmentLink({ children: { link } }) {
	return (
		<a
			href={link.url}
			target="_blank"
			className="PostAttachmentLink">
			{link.picture &&
				<Picture
					picture={link.picture}
					className="PostAttachmentLink-picture"/>
			}
			<div className="PostAttachmentLink-titleAndDescription">
				<h2 className="PostAttachmentLink-title">
					{link.title}
				</h2>
				<p className="PostAttachmentLink-description">
					{link.description}
				</p>
			</div>
		</a>
	)
}

PostAttachmentLink.propTypes = {
	children: linkAttachmentShape.isRequired
}