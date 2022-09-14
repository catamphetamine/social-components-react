import React, { useRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'

import { video } from './PropTypes.js'

import './Video.Html.css'

function VideoHtml(props, ref) {
	const player = useRef()
	const volumeBeforeMute = useRef()
	// `<video/>` docs:
	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
	const getPlayer = () => player.current
	const focus = () => getPlayer().focus()
	const play = () => getPlayer().play()
	const pause = () => getPlayer().pause()
	const isPaused = () => getPlayer().paused
	const getCurrentTime = () => getPlayer().currentTime
	const seekTo = (seconds) => getPlayer().currentTime = seconds
	const hasStarted = () => getCurrentTime() > 0
	const hasEnded = () => getPlayer().ended
	const setVolume = (volume) => getPlayer().volume = volume
	const getVolume = () => getPlayer().volume
	const isMuted = () => getVolume() === 0
	const mute = () => {
		volumeBeforeMute.current = getVolume()
		setVolume(0)
	}
	const unMute = () => {
		setVolume(volumeBeforeMute.current === undefined ? 1 : volumeBeforeMute.current)
	}

	useImperativeHandle(ref, () => ({
		getDOMNode: getPlayer,
		focus,
		play,
		pause,
		isPaused,
		getCurrentTime,
		seekTo,
		hasStarted,
		hasEnded,
		setVolume,
		getVolume,
		isMuted,
		mute,
		unMute
	}))

	const {
		video,
		preview,
		width,
		height,
		tabIndex,
		autoPlay,
		...rest
	} = props

	// // Manually starting autoplay instead of using `<video autoPlay={autoPlay}/>`
	// // because this way it returns the promise for managing player state correctly.
	// // https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
	// useEffect(() => {
	// 	if (autoPlay) {
	// 		play()
	// 	}
	// })

	// `playsinline` attribute prevents the video from
	// automatically entering fullscreen on play on iOS.
	// https://stackoverflow.com/questions/19521667/disable-fullscreen-iphone-video

	return (
		<video
			{...rest}
			ref={player}
			tabIndex={tabIndex}
			width={width}
			height={height}
			poster={preview ? video.picture && video.picture.url : undefined}
			autoPlay={autoPlay}
			playsInline
			controls>
			<source
				src={video.url}
				type={video.type}/>
		</video>
	)
}

VideoHtml = React.forwardRef(VideoHtml)

export default VideoHtml

VideoHtml.propTypes = {
	video: video.isRequired,
	preview: PropTypes.bool.isRequired,
	tabIndex: PropTypes.number,
	autoPlay: PropTypes.bool,
	width: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number
	]),
	height: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.number
	])
}

VideoHtml.defaultProps = {
	preview: true
}