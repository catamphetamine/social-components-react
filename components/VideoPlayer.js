import React from 'react'
import PropTypes from 'prop-types'

import { video } from './PropTypes.js'
import { getEmbeddedVideoUrl } from 'social-components/utility/video/getVideoUrl.js'

import VideoHtml from './Video.Html.js'
import VideoYouTube, { hasYouTubeVideoPlayerApiLoaded } from './Video.YouTube.js'

function VideoPlayer({
	video,
	showPreview,
	autoPlay,
	tabIndex,
	onClick
}, ref) {
	if (!video.provider) {
		// `onClick` is used to prevent Chrome Video player
		// triggering "pause"/"play" on click while dragging.
		return (
			<VideoHtml
				width="100%"
				height="100%"
				showPreview={showPreview}
				ref={ref}
				onClick={onClick}
				tabIndex={tabIndex}
				video={video}
				autoPlay={autoPlay}
			/>
		)
	}

	if (video.provider === 'YouTube' && hasYouTubeVideoPlayerApiLoaded()) {
		// `<video/>` can maintain its aspect ratio during layout
		// while `<iframe/>` can't, so using the `paddingBottom` trick here
		// to preserve aspect ratio.
		return (
			<VideoYouTube
				ref={ref}
				tabIndex={tabIndex}
				video={video}
				width="100%"
				height="100%"
				autoPlay={autoPlay}
			/>
		)
	}

	if (video.provider === 'Vimeo' || video.provider === 'YouTube') {
		// https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
		// `allowFullScreen` property is for legacy browsers support.
		//
		// `<video/>` can maintain its aspect ratio during layout
		// while `<iframe/>` can't, so using the `paddingBottom` trick here
		// to preserve aspect ratio.
		return (
			<iframe
				ref={ref}
				src={getEmbeddedVideoUrl(video.id, video.provider, {
					autoPlay,
					startAt: video.startAt
				})}
				width="100%"
				height="100%"
				frameBorder={0}
				allow="autoplay; fullscreen"
				allowFullScreen
			/>
		)
	}

	console.error(`Unsupported video provider: ${video.provider}`)
	return null
}

VideoPlayer = React.forwardRef(VideoPlayer)

VideoPlayer.propTypes = {
	video: video.isRequired,
	showPreview: PropTypes.bool,
	autoPlay: PropTypes.bool,
	tabIndex: PropTypes.number,
	onClick: PropTypes.func
}

export default VideoPlayer