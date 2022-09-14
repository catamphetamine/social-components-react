import {
	enterFullScreen,
	exitFullScreen,
	onFullScreenChange
} from 'web-browser-window'

export default class SlideshowFullscreen {
	constructor(slideshow) {
		this.slideshow = slideshow
	}

	enterFullscreen = (container) => {
		if (enterFullScreen(container)) {
			const unlistenFullScreen = onFullScreenChange(() => {
				// Re-render the current slide.
				this.slideshow.showSlide(this.slideshow.getState().i)
			})
			this.slideshow.onCleanUp(() => {
				exitFullScreen()
				unlistenFullScreen()
			})
			return true
		}
	}
}