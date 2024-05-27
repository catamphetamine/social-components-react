import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './PostInlineSpoiler.css'

export default function PostInlineSpoiler({
	hidden = true,
	censored,
	content,
	children
}) {
	const [show, setShow] = useState()

	// When a user clicks on a spoiler element, it should reveal the hidden content.
	// That's primarily for touch device users who don't have the ability to "hover" a spoiler element
	// to peek under it.
	const onClick = useCallback((event) => {
		if (show) {
			return
		}
		setShow(true)

		// When a user is using a "pointer" device that supports "hover" event,
		// the spoiler will reveal its contents on "hover".
		// But it turns out that there's an issue with such behavior when such spoiler
		// contains a clickable element inside.
		//
		// When "tapping" on a not-yet-revealed spoiler that contains a link inside,
		// in Chrome Dev Tools, the "tap" falls through the spoiler element directly to the link inside it.
		// Perhaps that's because mobile browsers trigger a fake "hover" event on click for compatibility
		// with the old desktop behavior.
		// Presumably, that fake "hover" event temporarily reveals the spoiler for a moment
		// and that could be why the "tap" event falls through to the link and triggers a "click" on it.
		//
		// The resulting behavior is: the user intends to reveal a spoiler's contents, taps on it,
		// and is immediately being navigated to an external hyperlink URL without realizing
		// that he was tapping on some hyperlink.
		//
		// To fix that, `event.preventDefault()` is called when a "click" event is received
		// and the spoiler hasn't been permanently revealed yet.
		//
		// But this also results in a not-ideal user experience for pointer devices
		// because clicking on a link inside a hover-revealed spoiler won't trigger the click
		// contrary to the user's expectations. Instead, it will just permanently reveal the spoiler.
		// Only a subsequent click will trigger a click event on the link.
		//
		event.preventDefault()
	}, [
		show,
		setShow
	])

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
	hidden: PropTypes.bool,
	censored: PropTypes.bool,
	content: PropTypes.any,
	children: PropTypes.node.isRequired
}

function isClickableTarget(event) {
	return ['a', 'button'].includes(event.target.tagName.toLowerCase())
}