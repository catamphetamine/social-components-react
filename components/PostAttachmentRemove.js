import React from 'react'
import PropTypes from 'prop-types'

import Button from './Button.js'

import './PostAttachmentRemove.css'

export default function PostAttachmentRemove({
	onClick,
	children = '✕'
}) {
	return (
		<>
			<div className="PostAttachmentRemove-separator">
				·
			</div>
			<Button onClick={onClick} className="PostAttachmentRemove-button">
				{children}
			</Button>
		</>
	)
}

PostAttachmentRemove.propTypes = {
	onClick: PropTypes.func.isRequired,
	children: PropTypes.string
}