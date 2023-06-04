import { throttle } from 'lodash-es'

export default class SlideshowResize {
	listeners = []

	constructor(slideshow) {
		slideshow.onInit(() => {
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
			this.unlistenWindowResize = () => window.removeEventListener('resize', onWindowResize)
		})

		slideshow.onCleanUp(() => {
			if (this.unlistenWindowResize) {
				this.unlistenWindowResize()
				this.unlistenWindowResize = undefined
			}
		})

		slideshow.onResize = (listener) => {
			this.listeners.push(listener)
		}
	}
}