// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

export default class SlideshowTouch {
	touches = []

	constructor(slideshow) {
		// this.slideshow = slideshow
		// React doesn't support setting up non-passive listeners.
		// https://github.com/facebook/react/issues/14856
		// onTouchMove={this.onTouchMove}
		slideshow.onInit(({ container }) => {
			container.addEventListener('touchmove', slideshow.onTouchMove)
		})
		slideshow.onCleanUp(this.cleanUp)
	}

	cleanUp = () => {
		clearTimeout(this.tapEventTimeout)
	}

	getTouch() {
		return this.touches[0]
	}

	getTouches() {
		return this.touches
	}

	getTouchCount() {
		return this.touches.length
	}

	onTouchStart = (event) => {
		this.isTouchDevice = true
		for (const touch of event.changedTouches) {
			this.touches.push({
				id: touch.identifier,
				x: touch.clientX,
				y: touch.clientY
			})
		}
	}

	onTouchEnd = () => {
		this.isTapEvent = true
		this.tapEventTimeout = setTimeout(this.resetTapEvent, 30)
	}

	onTouchCancel = (event) => {
		// Remove cancelled/ended touches.
		this.touches = this.touches.filter((touch) => {
			for (const untouch of event.changedTouches) {
				if (untouch.identifier === touch.id) {
					return false
				}
			}
			return true
		})
	}

	onTouchMove = (event) => {
		for (const touch of event.changedTouches) {
			this.updateTouch(
				touch.identifier,
				touch.clientX,
				touch.clientY
			)
		}
	}

	updateTouch(id, x, y) {
		for (const touch of this.touches) {
			if (touch.id === id) {
				touch.x = x
				touch.y = y
			}
		}
	}

	getDistanceBetweenTouches = () => {
		const distanceX = Math.abs(this.touches[0].x - this.touches[1].x)
		const distanceY = Math.abs(this.touches[0].y - this.touches[1].y)
		return Math.sqrt(distanceX * distanceX + distanceY * distanceY)
	}

	getCenterBetweenTouches = () => {
		return [
			(this.touches[0].x + this.touches[1].x) / 2,
			(this.touches[0].y + this.touches[1].y) / 2
		]
	}

	resetTapEvent = () => {
		this.isTapEvent = undefined
	}
}