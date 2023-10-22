// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

export default class SlideshowTouches {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props

		this.reset()
	}

	reset() {
		this.touches = []
	}

	addEventListeners() {
		// React doesn't support setting up non-passive listeners.
		// https://github.com/facebook/react/issues/14856
		// onTouchMove={this.onTouchMove}

		this.slideshow.onCleanUp(this.cleanUp)

		this.slideshow.addEventListener('touchStart', (event) => {
			this.onTouchStart(event)
		})

		this.slideshow.addEventListener('touchCancel', (event) => {
			this.onTouchCancelOrEnd(event)
		})

		this.slideshow.addEventListener('touchEnd', (event) => {
			this.onTouchCancelOrEnd(event)
		})

		this.slideshow.addEventListener('touchMove', (event) => {
			this.onTouchMove(event)
		})
	}

	getFunctions() {
		return {
			touches: {
				getTouch: this.getTouch,
				getTouchCount: this.getTouchCount,
				getCenterBetweenTouches: this.getCenterBetweenTouches,
				getDistanceBetweenTouches: this.getDistanceBetweenTouches
			}
		}
	}

	cleanUp = () => {
		this.reset()
	}

	getTouch = () => {
		return this.touches[0]
	}

	getTouches() {
		return this.touches
	}

	getTouchCount = () => {
		return this.touches.length
	}

	onTouchStart = (event) => {
		for (const touch of event.changedTouches) {
			this.touches.push({
				id: touch.identifier,
				x: touch.clientX,
				y: touch.clientY
			})
		}

		if (this.slideshow.isLocked()) {
			return
		}

		switch (this.getTouchCount()) {
			case 1:
				const { isButton } = this.props
				// Ignore button/link clicks.
				if (isButton(event.target)) {
					return
				}
				this.slideshow.triggerEventListeners('oneTouch', this.getTouch())
				break
			case 2:
				this.slideshow.triggerEventListeners('twoTouches', {
					getCenterBetweenTouches: this.getCenterBetweenTouches,
					getDistanceBetweenTouches: this.getDistanceBetweenTouches
				})
				break
			default:
				// Ignore more than two simultaneous touches.
				break
		}
	}

	onTouchCancelOrEnd = (event) => {
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
		// When a user scrolls to the next slide via touch
		// and then taps on the screen while the transition is still ongoing,
		// such "touchstart" event will be ignored, but the subsequent
		// "touchmove" events will still reach this listener.
		// In such cases `this.touches.getTouch()` is `undefined`,
		// so it can be used to detect such cases and ignore the "touchmove" event.
		if (!this.getTouch()) {
			return
		}

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
}