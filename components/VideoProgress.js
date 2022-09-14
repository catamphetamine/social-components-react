import React, { useCallback, useRef, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import './VideoProgress.css'

export default function VideoProgress({
	provider,
	onKeyboardSeek,
	hideDelay,
	hideDuration,
	showDuration,
	getDuration,
	getCurrentTime
}) {
	const element = useRef()
	const hideTimer = useRef()
	const isShown = useRef()
	const progressUpdateFrame = useRef()
	const afterHideTimer = useRef()
	// const [progress, setProgress] = useState()
	function roundProgressValue(value) {
		return Math.round(value * 1000) / 1000
	}
	const setProgress = useCallback((value) => {
		// Show the progress.
		const showDuration = 100
		element.current.style.transition = `opacity ${showDuration}ms ease-out`
		// element.current.style.setProperty('--Video-progress', value)
		element.current.style.transform = `scaleX(${roundProgressValue(value)})`
		element.current.style.opacity = 1
		isShown.current = true
		// Start progress refresh (until hidden).
		cancelAnimationFrame(progressUpdateFrame.current)
		function scheduleUpdateProgress() {
			progressUpdateFrame.current = requestAnimationFrame(() => {
				const currentProgress = Math.max(value, getCurrentTime() / getDuration())
				// element.current.style.setProperty('--Video-progress', currentProgress)
				element.current.style.transform = `scaleX(${roundProgressValue(currentProgress)})`
				if (isShown.current) {
					scheduleUpdateProgress()
				}
			})
		}
		scheduleUpdateProgress()
		// Cancel hiding.
		clearTimeout(afterHideTimer.current)
		clearTimeout(hideTimer.current)
		// Schedule hiding.
		hideTimer.current = setTimeout(() => {
			element.current.style.transition = `opacity ${hideDuration}ms`
			element.current.style.opacity = 0
			afterHideTimer.current = setTimeout(() => {
				isShown.current = false
				if (element.current) {
					element.current.style.transition = 'none'
				}
			}, hideDuration)
		}, hideDelay)
	}, [])
	useLayoutEffect(() => {
		// Add "on keyboard seek" listener.
		onKeyboardSeek.current = setProgress
		// Is hidden until keyboard seeking starts.
		element.current.style.opacity = 0
		return () => {
			clearTimeout(hideTimer.current)
			cancelAnimationFrame(progressUpdateFrame.current)
		}
	}, [])
	return (
		<div
			ref={element}
			className={classNames('Video-progress', {
			'Video-progress--YouTube': provider === 'YouTube'
		})}/>
	)
}

VideoProgress.propTypes = {
	provider: PropTypes.string.isRequired,
	onKeyboardSeek: PropTypes.object.isRequired,
	hideDelay: PropTypes.number.isRequired,
	hideDuration: PropTypes.number.isRequired,
	showDuration: PropTypes.number.isRequired,
	getDuration: PropTypes.func.isRequired,
	getCurrentTime: PropTypes.func.isRequired
}

VideoProgress.defaultProps = {
	hideDelay: 1000,
	showDuration: 100,
	hideDuration: 400
}