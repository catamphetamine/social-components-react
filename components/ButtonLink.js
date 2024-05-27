import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-pages'

import Button from './Button.js'

import { openLinkInNewTab as _openLinkInNewTab } from 'web-browser-input'

import isRelativeUrl from '../utility/isRelativeUrl.js'

const ButtonLink = React.forwardRef(function({
	url,
	children,
	panOffsetThreshold = 5,
	onClick: _onClick,
	...rest
}, ref) {
	function openLinkInNewTab() {
		_openLinkInNewTab(url)
	}

	function onClick(event) {
		// `onClick` is only for the left mouse button click.
		if (event.ctrlKey || event.cmdKey) {
			return openLinkInNewTab()
		}
		_onClick(event)
	}

	// If it's a "relative" URL, then render a `<Link/>`.
	if (isRelativeUrl(url)) {
		return (
			<Link
				{...rest}
				ref={ref}
				to={url}
				onClick={onClick}>
				{children}
			</Link>
		)
	}

	return (
		<a
			{...rest}
			ref={ref}
			target={url[0] === '#' ? undefined : '_blank'}
			href={url}
			onClick={onClick}>
			{/* attachment && attachment.type === 'video' &&  attachment.video.provider === 'YouTube' && */}
			{children}
		</a>
	)
})

ButtonLink.propTypes = {
	onClick: PropTypes.func.isRequired,
	url: PropTypes.string.isRequired,
	panOffsetThreshold: PropTypes.number,
	children: PropTypes.node.isRequired
}

export default ButtonLink