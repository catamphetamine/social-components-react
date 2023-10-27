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
				getTouchCount: this.getTouchCount
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
				// Create a "closure" for `this.touches[0]` and `this.touches[1]`
				// because if the user lifts off a finger, `this.touches[]` array will change
				// and will contain less than two touches, and the returned functions
				// `getCenterBetweenTouches()` and `getDistanceBetweenTouches()`
				// rely on there being exactly two of those touches.
				// So those two functions can't operate on `this.touches[]`
				// and instead they should snapshot those two initial touches.
				((touch1, touch2) => {
					this.slideshow.triggerEventListeners('twoTouches', {
						getCenterBetweenTouches: () => getCenterBetweenTouches(touch1, touch2),
						getDistanceBetweenTouches: () => getDistanceBetweenTouches(touch1, touch2)
					})
				})(this.touches[0], this.touches[1])
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
}

function getDistanceBetweenTouches(touch1, touch2) {
	const distanceX = Math.abs(touch1.x - touch2.x)
	const distanceY = Math.abs(touch1.y - touch2.y)
	return Math.sqrt(distanceX * distanceX + distanceY * distanceY)
}

function getCenterBetweenTouches(touch1, touch2) {
	return [
		(touch1.x + touch2.x) / 2,
		(touch1.y + touch2.y) / 2
	]
}