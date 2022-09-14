import React from 'react'
import PropTypes from 'prop-types'

import './PostEmbeddedAttachmentTitle.css'

export default function PostEmbeddedAttachmentTitle({ link, children }) {
	return (
		<h1 className="PostEmbeddedAttachmentTitle">
			{link &&
				<a
					target="_blank"
					href={link}>
					{children}
				</a>
			}
			{!link && children}
		</h1>
	)
}

PostEmbeddedAttachmentTitle.propTypes = {
	link: PropTypes.string,
	children: PropTypes.string.isRequired
}