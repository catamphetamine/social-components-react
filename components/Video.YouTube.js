import React, { useRef, useImperativeHandle, useEffect, useLayoutEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import { video } from './PropTypes.js'

import loadScript from '../utility/loadScript.js'

function VideoYouTube({
	video,
	width,
	height,
	autoPlay
}, ref) {
	const node = useRef()
	const player = useRef()
	const isReady = useRef()

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
	useLayoutEffect(() => {
		// * The `player` instance returned from `new YT.Player()` won't have any
		//   instance methods until the player is in the "ready" state.
		//
		// * On June 16, 2023, I've discovered that even after the `player` instance
		//   returned from the `new YT.Player()` call is "ready",
		//   it still doesn't have any instance methods.
		//   Seems like a bug in YouTube API, so instead I just changed it to use
		//   the player instance from the `onReady` event.
		//
		// player.current = new YT.Player(node.current, {
		new YT.Player(node.current, {
			width,
			height,
			videoId: video.id,
			playerVars: {
				// `autoplay: 1` player parameter doesn't work on iOS.
				// I checked it on my iPhone: even when using "immediate"
				// native DOM manipulations, without using React.
				// The manual `event.target.playVideo()`
				// (same as `player.current.playVideo()`)
				// seems to work in about half of the cases,
				// so it's being used instead.
				// autoplay: autoPlay ? 1 : 0,
				// `playsinline` attribute prevents the video from
				// automatically entering fullscreen on play on iOS.
				// https://stackoverflow.com/questions/40960747/disable-auto-fullscreen-of-youtube-embeds-on-iphone
				playsinline: 1,
				start: video.startAt
			},
			events: {
				onReady: (event) => {
					isReady.current = true
					// For some weird reason, the result of `new YT.Player()`
					// started returning an object that doesn't have any functions.
					// So instead of using `const player = new YT.Player()`
					// it just stores the reference to the player instance from the `event`.
					player.current = event.target
					if (autoPlay) {
						event.target.playVideo()
					}
				}
			}
		})
	}, [])

	const getState = useCallback(() => {
		if (isReady.current) {
			return player.current.getPlayerState()
		}
	}, [])

	const getCurrentTime = useCallback(() => {
		if (isReady.current) {
			return player.current.getCurrentTime()
		}
		return 0
	}, [])

	const getDOMNode = useCallback(() => {
		return player.current.getIframe()
	}, [])

	useImperativeHandle(ref, () => ({
		play: () => {
			if (isReady.current) {
				// state -> "playing" (1).
				player.current.playVideo()
			}
		},
		pause: () => {
			if (isReady.current) {
				// state -> "paused" (2) or "ended" (0).
				player.current.pauseVideo()
			}
		},
		stop: () => {
			if (isReady.current) {
				// Stops loading video stream.
				// state -> ended (0), paused (2), video cued (5) or unstarted (-1).
				player.current.stopVideo()
			}
		},
		getCurrentTime,
		getDuration: () => {
			if (isReady.current) {
				return player.current.getDuration()
			}
			return 0
		},
		seekTo: (seconds) => {
			if (isReady.current) {
				// const allowSeekAhead = true
				player.current.seekTo(seconds, true)
			}
		},
		// // Removes the player `<iframe/>` element.
		// destroy: () => {
		// 	player.current.destroy()
		// },
		isPaused: () => {
			switch (getState()) {
				case NOT_STARTED:
				case PAUSED:
				case ENDED:
					return true
				default:
					return false
			}
		},
		hasStarted: () => {
			switch (getState()) {
				case NOT_STARTED:
					return false
				default:
					return getCurrentTime() > 0
			}
		},
		hasEnded: () => {
			return getState() === ENDED
		},
		mute: () => {
			if (isReady.current) {
				player.current.mute()
			}
		},
		unMute: () => {
			if (isReady.current) {
				player.current.unMute()
			}
		},
		isMuted: () => {
			if (isReady.current) {
				return player.current.isMuted()
			}
		},
		setVolume: (volume) => {
			if (isReady.current) {
				player.current.setVolume(volume * 100)
			}
		},
		getVolume: () => {
			if (isReady.current) {
				return player.current.getVolume() / 100
			}
		},
		getDOMNode,
		focus: () => {
			getDOMNode().focus()
		}
	}), [getState])

	// The `<div/>` will be replaced by YouTube.
	return (
		<div ref={node}/>
	)
}

VideoYouTube = React.forwardRef(VideoYouTube)

VideoYouTube.propTypes = {
	video: video.isRequired,
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

export default VideoYouTube

/**
 * YouTube Player API should be loaded in advance
 * in order to be already "ready" for the player
 * to be rendered in the same "event loop" cycle
 * as the user's interaction, otherwise iOS
 * won't "auto play" the video.
 * For example, call `loadYouTubeVideoPlayerApi()`
 * after the website has loaded.
 * Calling it multiple times (including concurrently)
 * doesn't do anything.
 * https://developers.google.com/youtube/iframe_api_reference
 */
let apiStatus
let apiPromise
export function loadYouTubeVideoPlayerApi() {
	switch (apiStatus) {
		case 'LOADED':
			return Promise.resolve()
		case 'LOADING':
			return apiPromise
		default:
			if (apiStatus) {
				return Promise.reject(new Error(`Unknown YouTube Player API status: ${apiStatus}`))
			}
	}
	apiStatus = 'LOADING'
	apiPromise = loadScript(
		'https://www.youtube.com/iframe_api',
		(resolve) => window.onYouTubeIframeAPIReady = resolve
	).then(
		() => {
			apiStatus = 'LOADED'
			apiPromise = undefined
		},
		() => {
			apiStatus = undefined
			apiPromise = undefined
		}
	)
	return apiPromise
}

export function hasYouTubeVideoPlayerApiLoaded() {
	return typeof YT !== 'undefined' && YT.Player !== undefined
}

const NOT_STARTED = -1
const ENDED = 0
const PLAYING = 1
const PAUSED = 2
const LOADING = 3
const CUED = 5

// iOS auto play test: "auto play" only seems to work when
// called manually via a player method, and even then
// only in about half the cases.
//
// import React, { useState, useCallback } from 'react'
// import Video from 'webapp-frontend/src/components/Video'
//
// const VIDEO = {"id":"CLFUEr2NV7I","provider":"YouTube","title":"『Re:ゼロから始める異世界生活 氷結の絆』PV第3弾＜2019.11.08 ROADSHOW＞","duration":91,"width":1920,"height":1080,"aspectRatio":1.7777777777777777,"picture":{"width":1280,"height":720,"url":"https://img.youtube.com/vi/CLFUEr2NV7I/maxresdefault.jpg","type":"image/jpeg","sizes":[{"width":320,"height":180,"url":"https://img.youtube.com/vi/CLFUEr2NV7I/mqdefault.jpg","type":"image/jpeg"}]}}
//
// function YouTubePlayerMobileAutoPlayTest() {
// 	const [showVideo, setShowVideo] = useState()
// 	const playVideo = useCallback(() => {
// 		new YT.Player(document.getElementById('youtube-video-player'), {
// 			width: 1920,
// 			height: 1080,
// 			videoId: 'CLFUEr2NV7I',
// 			playerVars: {
// 				// `autoPlay` doesn't seem to work on iOS.
// 				// the manual `event.target.playVideo()`
// 				// (same as `player.current.playVideo()`)
// 				// seems to work from time to time (not always though).
// 				// autoplay: autoPlay ? 1 : 0,
// 				// `playsinline` attribute prevents the video from
// 				// automatically entering fullscreen on play on iOS.
// 				// https://stackoverflow.com/questions/40960747/disable-auto-fullscreen-of-youtube-embeds-on-iphone
// 				playsinline: 1
// 			},
// 			events: {
// 				onReady: (event) => {
// 					event.target.playVideo()
// 				}
// 			}
// 		})
// 	}, [])
// 	const playVideoAutoplay = useCallback(() => {
// 		new YT.Player(document.getElementById('youtube-video-player-autoplay'), {
// 			width: 1920,
// 			height: 1080,
// 			videoId: 'CLFUEr2NV7I',
// 			playerVars: {
// 				// `autoPlay` doesn't seem to work on iOS.
// 				// the manual `event.target.playVideo()`
// 				// (same as `player.current.playVideo()`)
// 				// seems to work from time to time (not always though).
// 				autoplay: 1,
// 				// `playsinline` attribute prevents the video from
// 				// automatically entering fullscreen on play on iOS.
// 				// https://stackoverflow.com/questions/40960747/disable-auto-fullscreen-of-youtube-embeds-on-iphone
// 				playsinline: 1
// 			},
// 			events: {
// 				onReady: (event) => {
// 				}
// 			}
// 		})
// 	}, [])
// 	return (
// 		<div>
// 			Video component being shown via a button:
// 			<br/>
// 			<br/>
// 			<button type="button" onClick={() => setShowVideo(true)}>
// 				Show and play video
// 			</button>
// 			{showVideo &&
// 				<Video video={VIDEO} maxWidth={400} autoPlay/>
// 			}
// 			<br/>
// 			<br/>
// 			Just a clickable Video component:
// 			<br/>
// 			<br/>
// 			<Video video={VIDEO} maxWidth={400}/>
// 			<br/>
// 			<br/>
// 			Native DOM YouTube video auto played manually:
// 			<br/>
// 			<br/>
// 			<button type="button" onClick={playVideo}>
// 				Play video
// 			</button>
// 			<div id="youtube-video-player" />
// 			<br/>
// 			<br/>
// 			Native DOM YouTube video auto played via "autoplay" player parameter:
// 			<br/>
// 			<br/>
// 			<button type="button" onClick={playVideoAutoplay}>
// 				Play video (autoplay)
// 			</button>
// 			<div id="youtube-video-player-autoplay" />
// 		</div>
// 	)
// }