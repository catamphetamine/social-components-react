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
			slideshow.onCleanUp(() => {
				window.removeEventListener('resize', onWindowResize)
			})
		})
		slideshow.onResize = (listener) => {
			this.listeners.push(listener)
		}
	}
}