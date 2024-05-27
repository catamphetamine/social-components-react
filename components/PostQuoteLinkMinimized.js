import React, { useCallback, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import { postPostLinkShape } from './PropTypes.js'

const DocumentMouseMove = {
	wasMouseMoved: false
}

export default function PostQuoteLinkMinimized({
	postLink,
	onExpand,
	minimizedComponent: MinimizedComponent = MinimizedQuoteComponent,
	expandTimeout = 360,
	...rest
}) {
	const container = useRef()
	const mouseEntered = useRef()
	const expandTimer = useRef()
	const scheduleExpand = useCallback(() => {
		container.current.classList.add('PostQuoteLink--minimized--hover')
		expandTimer.current = setTimeout(() => {
			expandTimer.current = undefined
			onExpand()
		}, expandTimeout)
	}, [
		onExpand,
		expandTimeout
	])
	const cancelExpand = useCallback(() => {
		if (expandTimer.current) {
			clearTimeout(expandTimer.current)
			expandTimer.current = undefined
		}
	}, [])
	// This listener doesn't declare any "dependencies"
	// because a listener reference should stay the same
	// in order to be removed later.
	const onMouseMove = useCallback(() => {
		document.removeEventListener('mousemove', onMouseMove)
		scheduleExpand()
	}, [])
	// This listener doesn't declare any "dependencies"
	// because a listener reference should stay the same
	// in order to be removed later.
	const onMouseEnter = useCallback(() => {
		if (DocumentMouseMove.wasMouseMoved) {
			scheduleExpand()
		} else {
			// This code handles the case when a user has scrolled
			// and the mouse pointer got placed over the minimized quote
			// but that didn't trigger the "expand" action (intentionally)
			// and then the user moves the mouse and that should expand
			// the minimized quote.
			document.addEventListener('mousemove', onMouseMove)
		}
	}, [])
	// This listener doesn't declare any "dependencies"
	// because a listener reference should stay the same
	// in order to be removed later.
	const onMouseLeave = useCallback(() => {
		container.current.classList.remove('PostQuoteLink--minimized--hover')
		cleanUp()
	}, [])
	const cleanUp = useCallback(() => {
		cancelExpand()
		// The `mousemove` listener might have, or might have not,
		// been added, so remove it (if it has been added).
		document.removeEventListener('mousemove', onMouseMove)
	}, [
		cancelExpand,
		onMouseMove
	])
	useEffect(() => cleanUp, [])
	return (
		<span
			ref={container}
			{...rest}
			onClick={onExpand}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}>
			<MinimizedComponent postLink={postLink}/>
		</span>
	)
}

PostQuoteLinkMinimized.propTypes = {
	postLink: postPostLinkShape.isRequired,
	onExpand: PropTypes.func.isRequired,
	minimizedComponent: PropTypes.elementType,
	expandTimeout: PropTypes.number
}

function MinimizedQuoteComponent({ postLink }) {
	return '··············'
	// return `>>${postLink.postId}${postLink.threadId === postLink.postId ? ' (OP)' : ''}`
}

MinimizedQuoteComponent.propTypes = {
	postLink: postPostLinkShape.isRequired
}

function onDocumentMouseMove() {
	DocumentMouseMove.wasMouseMoved = true
}

function onDocumentScroll() {
	DocumentMouseMove.wasMouseMoved = false
}

// There could be several thousand minimized post link quotes on a page
// (when not using `<VirtualScroller/>`). So, in order not to add
// several thousand `mousemove` and `scroll` listeners,
// a single one for each of these two events is added instead.
if (typeof document !== 'undefined') {
	document.addEventListener('mousemove', onDocumentMouseMove)
	document.addEventListener('scroll', onDocumentScroll)
}