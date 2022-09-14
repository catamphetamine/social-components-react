import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-pages'

import Button from './Button.js'

import { openLinkInNewTab as _openLinkInNewTab } from 'web-browser-input'

const ButtonOrLink = React.forwardRef(function({
	url,
	children,
	panOffsetThreshold,
	onClick: _onClick,
	...rest
}, ref) {
	const isClickInProgress = useRef()
	const panOrigin = useRef()

	function isOverTheThreshold(x, y) {
		return (
			(Math.abs(x - panOrigin.current.x) > panOffsetThreshold) ||
			(Math.abs(y - panOrigin.current.y) > panOffsetThreshold)
		)
	}

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

	function onPointerMove(event) {
		if (isClickInProgress.current) {
			onPan(
				event.clientX,
				event.clientY
			)
		}
	}

	function onDragStart(event) {
		// Prevent dragging.
		event.preventDefault()
		onPointerOut()
	}

	function onClickStart() {
		isClickInProgress.current = true
	}

	function onClickStop() {
		isClickInProgress.current = false
	}

	function onPanStart(x, y) {
		onClickStart()
		panOrigin.current = { x, y }
	}

	function onPanStop() {
		onClickStop()
		panOrigin.current = undefined
	}

	function onPanCancel() {
		onPanStop()
	}

	function onPan(x, y) {
		if (isClickInProgress.current) {
			if (isOverTheThreshold(x, y)) {
				onPanStop()
			}
		}
	}

	function onPanEnd(x, y) {
		if (isClickInProgress.current) {
			openLinkInNewTab()
		}
		onPanStop()
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/pointerout_event
	// The pointerout event is fired for several reasons including:
	// * pointing device is moved out of the hit test boundaries of an element (`pointerleave`);
	// * firing the pointerup event for a device that does not support hover (see `pointerup`);
	// * after firing the pointercancel event (see `pointercancel`);
	// * when a pen stylus leaves the hover range detectable by the digitizer.
	function onPointerOut() {
		onPanCancel()
	}

	function onPointerDown(event) {
		switch (event.button) {
			// Middle mouse button.
			case 1:
				// `.preventDefault()` to prevent the web browser
				// from showing the "all-scroll" cursor.
				event.preventDefault()
				onPanStart(
					event.clientX,
					event.clientY
				)
				break
		}
	}

	function onPointerUp(event) {
		switch (event.button) {
			// Middle mouse button.
			case 1:
				if (isClickInProgress.current) {
					onPanEnd(
						event.clientX,
						event.clientY
					)
				}
				break
		}
	}

	// Click the link on Spacebar.
	// function onKeyDown(event) {
	// 	switch (event.keyCode) {
	// 		// Click the link on Spacebar.
	// 		case 32:
	// 			event.preventDefault()
	// 			return onClick({
	// 				// Simulate `event` argument.
	// 				preventDefault() {
	// 					this.defaultPrevented = true
	// 				},
	// 				stopPropagation() {}
	// 			})
	// 	}
	// }

	if (_onClick) {
		// Safari doesn't support pointer events.
		// https://caniuse.com/#feat=pointer
		// https://webkit.org/status/#?search=pointer%20events
		// onPointerDown={onPointerDown}
		// onPointerUp={onPointerUp}
		// onPointerMove={onPointerMove}
		// onPointerOut={onPointerOut}
		return (
			<Button
				{...rest}
				ref={ref}
				onDragStart={onDragStart}
				onClick={onClick}
				onMouseDown={onPointerDown}
				onMouseUp={onPointerUp}
				onMouseMove={onPointerMove}
				onMouseLeave={onPointerOut}>
				{children}
			</Button>
		)
	}
	if (url[0] === '/') {
		return (
			<Link
				{...rest}
				ref={ref}
				to={url}>
				{children}
			</Link>
		)
	}
	return (
		<a
			{...rest}
			ref={ref}
			target={url[0] === '#' ? undefined : '_blank'}
			href={url}>
			{/* attachment && attachment.type === 'video' &&  attachment.video.provider === 'YouTube' && */}
			{children}
		</a>
	)
})

ButtonOrLink.propTypes = {
	onClick: PropTypes.func,
	url: PropTypes.string.isRequired,
	panOffsetThreshold: PropTypes.number.isRequired,
	children: PropTypes.node.isRequired
}

ButtonOrLink.defaultProps = {
	panOffsetThreshold: 5
}

export default ButtonOrLink