import {
	enterFullScreen,
	exitFullScreen,
	onFullScreenChange
} from 'web-browser-window'

export default class SlideshowFullscreen {
	constructor(slideshow) {
		this.slideshow = slideshow
	}

	addEventListeners() {
		this.slideshow.onCleanUp(() => {
			if (this.exitFullScreen) {
				this.exitFullScreen()
				this.exitFullScreen = undefined
			}
		})
	}

	getFunctions() {
		return {
			enterFullscreen: this.enterFullscreen
		}
	}

	enterFullscreen = (container) => {
		if (enterFullScreen(container)) {
			const unlistenFullScreen = onFullScreenChange(() => {
				// Re-render the current slide.
				this.slideshow.showSlide(this.slideshow.getState().i)
			})
			this.exitFullScreen = () => {
				exitFullScreen()
				unlistenFullScreen()
			}
			return true
		}
	}
}