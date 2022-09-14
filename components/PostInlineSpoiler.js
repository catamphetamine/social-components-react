import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './PostInlineSpoiler.css'

export default function PostInlineSpoiler({
	hidden,
	censored,
	content,
	children
}) {
	const [show, setShow] = useState()
	// Showing spoiler contents on click is also for
	// mobile devices which don't have "hover" event.
	const onClick = useCallback((event) => {
		// "Prevent default" to disable click fall-through.
		// (for example, when links are placed inside spoilers).
		event.preventDefault()
		setShow(true)
	}, [setShow])
	return (
		<span
			data-hide={!show && hidden ? true : undefined}
			title={hidden && censored && typeof content === 'string' ? content : undefined}
			onClick={onClick}
			className={classNames('PostInlineSpoiler', {
				'PostInlineSpoiler--hidden': !show && hidden,
				'PostInlineSpoiler--censored': censored
			})}>
			<span className="PostInlineSpoiler-contents">
				{children}
			</span>
		</span>
	)
}

PostInlineSpoiler.propTypes = {
	hidden: PropTypes.bool.isRequired,
	censored: PropTypes.bool,
	content: PropTypes.any,
	children: PropTypes.node.isRequired
}

PostInlineSpoiler.defaultProps = {
	hidden: true
}