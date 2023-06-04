import React from 'react'
import classNames from 'classnames'

import { getAspectRatio } from './Picture.js'
import Video, { getMaxSize, getUrl } from './Video.js'

import { isKeyCombination } from 'web-browser-input'

export default {
	// Chrome web browser seems to have fixed the native `<video/>` player controls
	// when its width is very short, so this workaround seems no longer required.
	//
	// // Sometimes a slide is disproportionately long by one of the dimensions
	// // resulting in it being disproportionately short by the other dimension.
	// // Such cases could be worked around by setting the minimum allowed
	// // ratio of a slide by any of the dimensions via
	// // `minInitialSizeRatioRelativeToMaxSizeAvailable` property on a plugin.
	// //
	// // Because native `<video/>` player is used to play video slides,
	// // when its width becomes too short, its controls start looking not pretty,
	// // so a minimum acceptable width is set for a `<video/>` player
	// // by setting the minumum initial slide size.
	// //
	// minInitialSizeRatioRelativeToMaxSizeAvailable: 0.65,
	//
	// showCloseButtonForSingleSlide: true,
	getMaxSize(slide) {
		return getMaxSize(slide.video)
	},
	getAspectRatio(slide) {
		if (slide.video.aspectRatio) {
			return slide.video.aspectRatio
		}
		return getAspectRatio(slide.video.picture)
	},
	// isScaleDownAllowed(slide) {
	// 	return false
	// },
	// capturesArrowKeys(slide) {
	// 	return true
	// },
	canSwipe(slide) {
		switch (slide.video.provider) {
			// iOS Safari has a bug when YouTube video is played in fullscreen slideshow:
			// touch scroll goes through it and it doesn't respond to swiping.
			// I guess Vimeo could have the same bug (didn't test).
			// On desktop mouse users are unable to swipe the video <iframe/> too.
			case 'YouTube':
			case 'Vimeo':
				return false
			default:
				return true
		}
	},
	// hasCloseButtonClickingIssues(slide) {
	// 	switch (slide.video.provider) {
	// 		// (Experienced both in iOS Safari and in desktop Chrome)
	// 		// Even though slideshow actions are shown above a YouTube video <iframe/>
	// 		// clicks are being captured by that video <iframe/> for some reason.
	// 		// I guess Vimeo could have the same bug (didn't test).
	// 		case 'YouTube':
	// 		case 'Vimeo':
	// 			return true
	// 		default:
	// 			return false
	// 	}
	// },
	onKeyDown(event) {
		// Capture Spacebar (Play/Pause).
		if (isKeyCombination(event, ['Space'])) {
			// Spacebar is always handled by the `<Video/>` which is focused.
			return true
		}
	},
	canOpenExternalLink(slide) {
		return true
	},
	getExternalLink(slide) {
		return getUrl(slide.video)
	},
	// canDownload(slide) {
	// 	switch (slide.video.provider) {
	// 		case undefined:
	// 			return true
	// 		default:
	// 			return false
	// 	}
	// },
	// getDownloadLink(slide) {
	// 	switch (slide.video.provider) {
	// 		case undefined:
	// 			return slide.video.url
	// 	}
	// },
	canRender(slide) {
		return slide.type === 'video'
	},
	// onShowSlide(slide, ref, props) {
	// 	if (_autoPlay) {
	// 		ref.showVideo(() => ref.play())
	// 	}
	// },
	render({
		ref,
		slide,
		isCurrentSlide,
		autoPlay,
		onClick,
		width,
		height,
		// maxWidth,
		// maxHeight,
		dragAndScaleMode,
		tabIndex,
		style,
		className
	}) {
		// maxWidth={maxWidth}
		// maxHeight={maxHeight}
		// Disables video seeking on Left/Right arrow keys.
		// seekOnArrowKeys={_seekOnArrowKeys}
		return (
			<Video
				ref={ref}
				video={slide.video}
				onClick={onClick}
				autoPlay={autoPlay && isCurrentSlide}
				canPlay={isCurrentSlide}
				showPlayButtonOverPreview
				width={width}
				height={height}
				fit="scale-down"
				tabIndex={tabIndex}
				showPreview={autoPlay ? false : undefined}
				seekOnArrowKeysAtBorders={false}
				seekOnArrowKeys={dragAndScaleMode ? false : undefined}
				changeVolumeOnArrowKeys={dragAndScaleMode ? false : undefined}
				style={style}
				className={classNames('Slideshow-Video', className)}
			/>
		)
	}
}