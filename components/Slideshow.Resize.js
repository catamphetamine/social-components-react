import { throttle } from 'lodash-es'

export default class SlideshowResize {
	constructor(slideshow) {
		this.slideshow = slideshow
		this.reset()
	}

	reset() {
		this.listeners = []
	}

	addEventListeners() {
		this.slideshow.addEventListener('init', () => {
			const slideshow = this.slideshow

			let width = slideshow.getSlideshowWidth()
			let height = slideshow.getSlideshowHeight()

			const onWindowResize = throttle((event) => {
				const newWidth = slideshow.getSlideshowWidth()
				const newHeight = slideshow.getSlideshowHeight()
				if (width !== newWidth || height !== newHeight) {
					for (const listener of this.listeners) {
						listener()
					}
					slideshow.rerender()
					width = newWidth
					height = newHeight
				}
			}, 100)

			window.addEventListener('resize', onWindowResize)

			this.removeEventListener = () => {
				window.removeEventListener('resize', onWindowResize)
			}
		})

		this.slideshow.onCleanUp(() => {
			this.removeEventListener()
		})
	}

	getFunctions() {
		return {
			onResize: (listener) => {
				this.listeners.push(listener)
			}
		}
	}
}