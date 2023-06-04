import React, { useState, useMemo, useCallback, useRef, useEffect, useLayoutEffect, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { video } from './PropTypes.js'
import getVideoUrl from 'social-components/utility/video/getVideoUrl.js'

import {
	enterFullScreen as _enterFullScreen,
	exitFullScreen as _exitFullScreen
} from 'web-browser-window'

import { px } from 'web-browser-style'

import AspectRatioWrapper from './AspectRatioWrapper.js'
import ButtonLink from './ButtonLink.js'

import Picture, { getMaxFitSize } from './Picture.js'
import VideoDuration from './VideoDuration.js'
import VideoPlayIcon from './VideoPlayIcon.js'
import VideoPlayer from './VideoPlayer.js'
import VideoProgress from './VideoProgress.js'

import { loadYouTubeVideoPlayerApi } from './Video.YouTube.js'

import useLayoutEffectSkipMount from '../hooks/useLayoutEffectSkipMount.js'
import useEffectSkipMount from '../hooks/useEffectSkipMount.js'

import './Video.css'

// Picture border width.
// Could also be read from the CSS variable:
// `parseInt(getComputedStyle(container.current).getPropertyValue('--Picture-borderWidth'))`.
export const BORDER_WIDTH = 1

/**
 * Renders a video component (optionally with a preview poster).
 * The "auto play" feature seems to work on iOS for native `<video/>`s,
 * but for YouTube videos it only "auto plays" in about half of the cases.
 * Though, also on iOS, I noticed that when some user interaction
 * (excluding the tap on the video itself) has happened recently
 * (for example, in a couple of seconds before tapping the video)
 * then even YouTube videos seem to "auto play" correctly. Whatever.
 */
function Video({
	video,
	border,
	showPreview: showPreviewProperty,
	autoPlay: autoPlayProperty,
	canPlay,
	canPlayOffBehavior,
	expand,
	showPlayButtonOverPreview,
	width,
	height,
	maxWidth,
	maxHeight,
	fit,
	onClick: _onClick,
	seekStep,
	largerSeekStep,
	seekOnArrowKeys,
	seekOnArrowKeysAtBorders,
	changeVolumeOnArrowKeys,
	changeVolumeStep,
	spoilerLabel,
	tabIndex,
	style,
	className,
	...rest
}, ref) {
	const [autoPlay, setAutoPlay] = useState(getAutoPlayValue(autoPlayProperty, canPlay))
	const [showPreview, setShowPreview] = useState(getShowPreviewValueForAutoPlayValue(showPreviewProperty, autoPlay))

	const setShowPreviewOrAutoPlay = useCallback((mode) => {
		switch (mode) {
			case 'showPreview':
				setShowPreview(true)
				setAutoPlay(false)
				break
			case 'autoPlay':
				setShowPreview(false)
				setAutoPlay(true)
				break
			default:
				throw new Error(`Unknown "setShowPreviewOrAutoPlay" mode: "${mode}"`)
		}
	}, [])

	const previewRef = useRef()
	const playerRef = useRef()
	const playerContainerInnerRef = useRef()
	const isFullScreen = useRef()
	const playState = useRef(Promise.resolve())

	// YouTube hides the embedded video progress bar while playing.
	// On open, the embedded YouTube video player itself is not focused
	// because it's rendered in an `<iframe/>` and therefore the browser
	// doesn't  provide any access to it.
	// To support seeking with a keyboard, the `<Video/>` component itself
	// listens for `keydown` events and calls `.seekTo()` manually.
	// But, in this scenario, the embedded YouTube video player doesn't show
	// the progress bar, which results in a confusing user experience.
	// Because YouTube embedded player doesn't want to show the progress bar
	// automatically on seek, the `<Video/>` component shows its own
	// progress bar in such cases.
	const onKeyboardSeek = useRef()

	useEffect(() => {
		// YouTube Player API should be loaded in advance
		// in order to be already "ready" for the player
		// to be rendered in the same "event loop" cycle
		// as the user's interaction, otherwise iOS
		// won't "auto play" the video.
		// For example, call `loadYouTubeVideoPlayerApi()`
		// after the website has loaded.
		// Calling it multiple times (including concurrently)
		// doesn't do anything.
		if (video.provider === 'YouTube') {
			loadYouTubeVideoPlayerApi()
		}
		return () => {
			if (isFullScreen.current) {
				exitFullScreen()
			}
		}
	}, [])

	// Using `useLayoutEffect()` instead of `useEffect()` here
	// because iOS won't "auto play" videos unless requested
	// in the same "event loop" cycle as the user's interaction
	// (for example, a tap).
	// Still the behavior observed on my iPhone is non-deterministic:
	// sometimes YouTube videos auto play, sometimes they won't.
	// YouTube Player API docs are extremely unclear about that:
	// in which cases would auto play work, in which it wouldn't.
	// https://developers.google.com/youtube/iframe_api_reference#Autoplay_and_scripted_playback
	// So it's unclear whether using `useLayoutEffect()`
	// instead of `useEffect()` here makes any difference.
	useLayoutEffectSkipMount(() => {
		if (autoPlay) {
			focus()
			setPlayState(play)
		}
	}, [autoPlay])

	// `useLayoutEffect()` is used here instead of the regular `useEffect()`
	// just so that it stops the video as soon as `canPlay` becomes `false`.
	useLayoutEffectSkipMount(() => {
		if (!canPlay) {
			switch (canPlayOffBehavior) {
				case 'stop':
					setPlayState(stop)
					break
				case 'pause':
					setPlayState(pause)
					break
				default:
					// Ignore.
			}
		}
	}, [canPlay])

	function setPlayState(newStateTransition) {
		playState.current = playState.current
			.then(newStateTransition)
			.catch((error) => {
				// When a new player is created with `autoPlay={true}`
				// it is initially being played without calling `play()`
				// so `playState` is not the `.play()` promise.
				// So, when a `<Slideshow/>` changes the current slide,
				// `pause()` is called on a `<Video/>` that might not have
				// started playing yet, causing the error.
				// An alternative code could, for example, somehow emulate `autoPlay={true}`
				// using `useLayoutEffect()` and setting `playState.current`
				// but that would be too much hassle just for this single use case,
				// so just ignoring these "DOMException" errors.
				// ("The play() request was interrupted by a call to pause()")
				if (error.name === 'AbortError') {
					// Ignore
				} else {
					throw error
				}
			})
	}

	// On `showPreview` property change.
	// On `autoPlay` property change.
	useEffectSkipMount(() => {
		setShowPreviewOrAutoPlay(getShowPreviewValueForAutoPlayValue(showPreviewProperty, getAutoPlayValue(autoPlayProperty, canPlay)) ? 'showPreview' : 'autoPlay')
	}, [
		showPreviewProperty,
		autoPlayProperty
	])

	useImperativeHandle(ref, () => ({
		focus
	}))

	function play() {
		if (playerRef.current && playerRef.current.play) {
			const result = playerRef.current.play()
			// HTML `<video/>` `.play()` returns a `Promise`.
			// https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
			if (result && typeof result.then === 'function') {
				return result
			}
			return true
		}
	}

	function pause() {
		if (playerRef.current && playerRef.current.pause) {
			playerRef.current.pause()
			return true
		}
	}

	function stop() {
		if (playerRef.current) {
			// Exit fullscreen on stop.
			// For example, when watching slides in a slideshow
			// and the current slide is video and it's in fullscreen mode
			// and then the user pushes "Left" or "Right" key
			// to move to another slide that next slide should be focused
			// which wouldn't be possible until the fullscreen mode is exited from.
			if (isFullScreen.current) {
				exitFullScreen()
			}
			if (playerRef.current.stop) {
				playerRef.current.stop()
				return true
			}
			// `<VideoHtml/>` doesn't have a `.stop()` method.
			// Emulate `stop()` via `pause()` and `seekTo()`.
			else {
				return pause() && seekTo(0)
			}
		}
	}

	function togglePlay() {
		if (isPaused() !== undefined) {
			if (isPaused()) {
				return play()
			} else {
				return pause()
			}
		}
	}

	function isPaused() {
		if (playerRef.current && playerRef.current.isPaused) {
			return playerRef.current.isPaused()
		}
	}

	function hasStarted() {
		if (playerRef.current && playerRef.current.hasStarted) {
			return playerRef.current.hasStarted()
		}
	}

	function hasEnded() {
		if (playerRef.current && playerRef.current.hasEnded) {
			return playerRef.current.hasEnded()
		}
	}

	function getCurrentTime() {
		if (playerRef.current && playerRef.current.getCurrentTime) {
			return playerRef.current.getCurrentTime()
		}
	}

	function seek(delta) {
		const currentTime = getCurrentTime()
		if (currentTime !== undefined) {
			return seekTo(currentTime + delta)
		}
	}

	function seekTo(seconds) {
		if (playerRef.current && playerRef.current.seekTo) {
			playerRef.current.seekTo(seconds)
			return true
		}
	}

	function setVolume(volume) {
		if (playerRef.current && playerRef.current.setVolume) {
			playerRef.current.setVolume(volume)
			return true
		}
	}

	function getVolume() {
		if (playerRef.current && playerRef.current.getVolume) {
			return playerRef.current.getVolume()
		}
	}

	function getDuration() {
		// Even if `video` didn't contain `duration`
		// YouTube player can return its duration.
		if (playerRef.current && playerRef.current.getDuration) {
			return playerRef.current.getDuration()
		}
		return video.duration
	}

	function changeVolume(up) {
		const delta = up ? changeVolumeStep : -1 * changeVolumeStep
		const volume = getVolume()
		if (volume !== undefined) {
			return setVolume(Math.min(Math.max(0, volume + delta), 1))
		}
	}

	function mute() {
		if (playerRef.current && playerRef.current.mute) {
			playerRef.current.mute()
			return true
		}
	}

	function unMute() {
		if (playerRef.current && playerRef.current.unMute) {
			playerRef.current.unMute()
			return true
		}
	}

	function isMuted() {
		if (playerRef.current && playerRef.current.isMuted) {
			return playerRef.current.isMuted()
		}
	}

	function toggleMute() {
		if (isMuted() !== undefined) {
			if (isMuted()) {
				return unMute()
			} else {
				return mute()
			}
		}
	}

	function focus() {
		if (showPreview) {
			previewRef.current.focus()
		} else if (shouldFocusPlayer(video) &&
			playerRef.current && playerRef.current.focus) {
			playerRef.current.focus()
		} else {
			playerContainerInnerRef.current.focus()
		}
	}

	function onClick(event) {
		if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
			return
		}
		// Expanded attachments handle click event by themselves.
		if (expand) {
			return
		}
		// `<Slideshow/>` passes `onClick()` to prevent
		// `<video/>` from toggling Pause/Play on click-and-drag.
		if (_onClick) {
			// `<Slideshow/>` calls `event.preventDefault()` here on click-and-drag.
			_onClick(event)
		}
		if (showPreview && !event.defaultPrevented) {
			event.preventDefault()
			setShowPreviewOrAutoPlay('autoPlay')
		}
	}

	function onKeyDown(event) {
		if (event.ctrlKey || event.altKey || event.metaKey) {
			return
		}
		if (event.shiftKey) {
			switch (event.keyCode) {
				// Left arrow.
				case 37:
				// Right arrow.
				case 39:
					// Allow Shift key.
					break
				default:
					return
			}
		}
		switch (event.keyCode) {
			// Pause/Play on Spacebar.
			case 32:
				if (!videoPlayerHandlesTogglePlayOnSpacebar(video)) {
					if (isPaused() !== undefined) {
						setPlayState(togglePlay)
						event.preventDefault()
					}
				}
				break

			// Seek backwards on Left Arrow key.
			case 37:
				if (seekOnArrowKeys &&
					(seekOnArrowKeysAtBorders || hasStarted() === true)
				) {
					const backwardSeekStep = event.shiftKey ? largerSeekStep : seekStep
					if (seek(-backwardSeekStep)) {
						event.preventDefault()
						// `isPaused()` is always true when the progress as at the end.
						// `if (!isPaused())` would result in the progress being stale
						// when the user hits `End` and then `Home` or Left Arrow.
						// if (!isPaused()) {
							if (onKeyboardSeek.current) {
								onKeyboardSeek.current(
									Math.max(0, (getCurrentTime() - backwardSeekStep) / getDuration())
								)
							}
						// }
					}
				}
				break

			// Seek forward on Right Arrow key.
			case 39:
				if (seekOnArrowKeys &&
					(seekOnArrowKeysAtBorders || hasEnded() === false)
				) {
					const forwardSeekStep = event.shiftKey ? largerSeekStep : seekStep
					if (seek(forwardSeekStep)) {
						event.preventDefault()
						// `isPaused()` is commented out on Left Arrow, so, for consistency,
						// it's also commented out here (on Right Arrow).
						// if (!isPaused()) {
							if (onKeyboardSeek.current) {
								onKeyboardSeek.current(
									Math.min(1, (getCurrentTime() + forwardSeekStep) / getDuration())
								)
							}
						// }
					}
				}
				break

			// Seek to start on Home key.
			case 36:
				if (seekTo(0)) {
					event.preventDefault()
					// `isPaused()` is always true when the progress as at the end.
					// `if (!isPaused())` would result in the progress being stale
					// when the user hits `End` and then `Home` or Left Arrow.
					// if (!isPaused()) {
						if (onKeyboardSeek.current) {
							onKeyboardSeek.current(0)
						}
					// }
				}
				break

			// Seek to end on End key.
			case 35:
				if (seekTo(video.duration)) {
					event.preventDefault()
					// `isPaused()` is commented out on `Home`, so, for consistency,
					// it's also commented out here (on `End`).
					// if (!isPaused()) {
						if (onKeyboardSeek.current) {
							onKeyboardSeek.current(1)
						}
					// }
				}
				break

			// Volume Up on Up Arrow key.
			case 38:
				if (changeVolumeOnArrowKeys) {
					if (changeVolume(true)) {
						event.preventDefault()
					}
				}
				break

			// Volume Down on Down Arrow key.
			case 40:
				if (changeVolumeOnArrowKeys) {
					if (changeVolume(false)) {
						event.preventDefault()
					}
				}
				break

			// Toggle mute on "M" key.
			case 77:
				if (toggleMute()) {
					event.preventDefault()
				}
				break

			// Toggle fullscreen on "F" key.
			case 70:
				if (!showPreview) {
					let node
					// If focus is not inside the element being promoted to
					// fullscreen then the focus is lost upon entering fullscreen.
					if (shouldFocusPlayer(video)) {
						node = playerRef.current && getPlayerNode(playerRef.current, video)
					}
					node = node || playerContainerInnerRef.current
					if (isFullScreen.current) {
						exitFullScreen()
					} else {
						enterFullScreen(node)
					}
					event.preventDefault()
				}
				break
		}
	}

	function enterFullScreen(node) {
		if (_enterFullScreen(node)) {
			isFullScreen.current = true
		}
	}

	function exitFullScreen() {
		_exitFullScreen()
		isFullScreen.current = false
	}

	function addBorder(dimension) {
		if (border) {
			return dimension + 2 * BORDER_WIDTH
		}
		return dimension
	}

	function getMaxWidth() {
		const maxWidths = []
		if (maxWidth) {
			maxWidths.push(maxWidth)
		}
		if (maxHeight) {
			maxWidths.push(maxHeight * getAspectRatio(video))
		}
		if (fit === 'scale-down') {
			maxWidths.push(getMaxSize(video).width)
		}
		if (maxWidths.length > 0) {
			return Math.min(...maxWidths)
		}
	}

	function getContainerStyle() {
		if (width || height) {
			return {
				width: px(addBorder(width || (height * getAspectRatio(video)))),
				height: px(addBorder(height || (width / getAspectRatio(video))))
			}
		}
		if (maxWidth || maxHeight) {
			return {
				width: '100%',
				maxWidth: px(addBorder(getMaxWidth()))
			}
		}
	}

	const buttonLinkComponentProps = useMemo(() => ({
		url: getUrl(video),
		onClick,
		tabIndex
	}), [
		video,
		onClick,
		tabIndex
	])

	if (showPreview) {
		return (
			<Picture
				{...rest}
				ref={previewRef}
				border={border}
				picture={video.picture}
				component={ButtonLink}
				componentProps={buttonLinkComponentProps}
				width={expand ? undefined : width}
				height={expand ? undefined : height}
				maxWidth={expand ? getMaxSize(video).width : getMaxWidth()}
				maxHeight={expand ? undefined : maxHeight}
				aria-hidden
				style={style}
				className={classNames(
					className,
					'Video',
					'Video--preview', {
						'Video--border': border
					}
				)}>
				{showPlayButtonOverPreview &&
					<VideoPlayIcon className="VideoPlayIcon--center"/>
				}
				{!showPlayButtonOverPreview &&
					<VideoDuration duration={video.duration}/>
				}
			</Picture>
		)
	}

	// `<video/>` can maintain its aspect ratio during layout
	// but only after the video file has loaded, and there's a
	// very short period of time at the start of `<video/>` layout
	// when it doesn't maintain aspect ratio. This results in
	// `<Post/>`s having `<video/>`s changing their height after
	// such `<Post/>`s have been mounted which results in
	// `virtual-scroller` jumping while scrolling.
	// Therefore using an `<AspectRatioWrapper/>` here too
	// to preserve aspect ratio.
	return (
		<AspectRatioWrapper
			{...rest}
			innerRef={playerContainerInnerRef}
			onKeyDown={onKeyDown}
			aspectRatio={getAspectRatio(video)}
			innerTabIndex={!shouldFocusPlayer(video) ? tabIndex : -1}
			innerClassName="Video-playerContainerInner"
			style={style ? { ...style, ...getContainerStyle() } : getContainerStyle()}
			className={classNames(className, 'Video', {
				'Video--border': !shouldFocusPlayer(video) && border
			})}>
			<VideoPlayer
				ref={playerRef}
				video={video}
				showPreview={showPreview}
				autoPlay={autoPlay}
				tabIndex={shouldFocusPlayer(video) ? tabIndex : undefined}
				onClick={onClick}
				className={classNames({
					'Video--border': shouldFocusPlayer(video) && border
				})}
			/>
			{video.provider === 'YouTube' &&
				<VideoProgress
					provider={video.provider}
					onKeyboardSeek={onKeyboardSeek}
					getDuration={getDuration}
					getCurrentTime={getCurrentTime}
				/>
			}
		</AspectRatioWrapper>
	)
}

Video = React.forwardRef(Video)

Video.propTypes = {
	video: video.isRequired,
	width: PropTypes.number,
	height: PropTypes.number,
	maxWidth: PropTypes.number,
	maxHeight: PropTypes.number,
	fit: PropTypes.oneOf(['scale-down']),
	showPreview: PropTypes.bool,
	autoPlay: PropTypes.bool,
	canPlay: PropTypes.bool,
	canPlayOffBehavior: PropTypes.oneOf(['stop', 'pause']),
	seekOnArrowKeys: PropTypes.bool.isRequired,
	seekOnArrowKeysAtBorders: PropTypes.bool.isRequired,
	seekStep: PropTypes.number.isRequired,
	largerSeekStep: PropTypes.number.isRequired,
	changeVolumeOnArrowKeys: PropTypes.bool.isRequired,
	changeVolumeStep: PropTypes.number.isRequired,
	showPlayButtonOverPreview: PropTypes.bool,
	onClick: PropTypes.func,
	tabIndex: PropTypes.number,
	border: PropTypes.bool,
	expand: PropTypes.bool,
	style: PropTypes.object,
	className: PropTypes.string
}

Video.defaultProps = {
	canPlay: true,
	canPlayOffBehavior: 'stop',
	showPreview: true,
	seekOnArrowKeys: true,
	seekOnArrowKeysAtBorders: true,
	seekStep: 5,
	largerSeekStep: 30,
	changeVolumeOnArrowKeys: true,
	changeVolumeStep: 0.1
}

export default Video

function getPlayerNode(playerRef, video) {
	if (video.provider === 'Vimeo') {
		return playerRef
	}
	if (video.provider === 'YouTube') {
		// YouTube video could be shown in a YouTube player
		// or as an `<iframe/>` (as a fallback).
		if (playerRef instanceof VideoYouTube) {
			return playerRef.getDOMNode()
		}
		return playerRef
	}
	if (!video.provider) {
		return playerRef.getDOMNode()
	}
}

function shouldFocusPlayer(video) {
	// HTML `<video/>` player is focusable
	// and it doesn't consume `keydown` events.
	// `<iframes/>` aren't interactive elements
	// and also they don't bubble `keydown` events.
	return !video.provider
}

function videoPlayerHandlesTogglePlayOnSpacebar(video) {
	// HTML `<video/>` player already handles toggling play/pause on Spacebar.
	return !video.provider
}

export function getUrl(video) {
	if (!video.provider) {
		return video.url
	}
	if (video.provider === 'Vimeo' || video.provider === 'YouTube') {
		return getVideoUrl(video.id, video.provider, {
			startAt: video.startAt
		})
	}
	console.error(`Unsupported video provider: ${video.provider}`)
	return
}

export function getAspectRatio(video) {
	if (video.aspectRatio) {
		return video.aspectRatio
	}
	const maxSize = getMaxSize(video)
	if (maxSize) {
		return maxSize.width / maxSize.height
	}
}

export function getMaxSize(video) {
	// `.width` and `.height` aren't required on a `video`
	// because, for example, if it's a YouTube video
	// which was parsed without using a YouTube API key
	// it will only contain video ID and the thumbnail picture.
	if (video.width && video.height) {
		return video
	}
	return video.picture
}

function getAutoPlayValue(autoPlay, canPlay) {
	return Boolean(autoPlay && canPlay)
}

function getShowPreviewValueForAutoPlayValue(showPreviewCurrentValue, autoPlay) {
	return Boolean(showPreviewCurrentValue && !autoPlay)
}