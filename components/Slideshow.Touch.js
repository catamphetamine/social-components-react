// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

export default class SlideshowTouch {
	constructor(slideshow) {
		this.slideshow = slideshow
	}

	addEventListeners() {
		// React doesn't support setting up "non-passive" listeners like "touchmove" ones.
		// https://github.com/facebook/react/issues/14856
		// So it doesn't support simply passing `onTouchMove={this.onTouchMove}` property
		// to the `<Slideshow/>` element.
		this.slideshow.addEventListener('init', ({ container }) => {
			container.addEventListener('touchmove', this.onTouchMove)

			this.removeEventListener = () => {
				container.removeEventListener('touchmove', this.onTouchMove)
			}
		})

		this.slideshow.onCleanUp(() => {
			this.cleanUp()
			this.removeEventListener()
		})
	}

	getFunctions() {
		return {
			isTouchDevice: () => this.isTouchDevice,
			onTouchStart: this.onTouchStart,
			onTouchEnd: this.onTouchEnd,
			onTouchCancel: this.onTouchCancel,
			touch: {
				ignoreTouchMoveEventsForCurrentTouches: this.ignoreTouchMoveEventsForCurrentTouches
			}
		}
	}

	cleanUp = () => {
		if (this.tapEventTimeout) {
			clearTimeout(this.tapEventTimeout)
			this.tapEventTimeout = undefined
		}
		this.resetTapEvent()
		this.resetIgnoreTouchMoveEvents()
	}

	resetIgnoreTouchMoveEvents = () => {
		this.ignoreTouchMoveEvents = undefined
	}

	resetTapEvent = () => {
		this.isTapEvent = undefined
	}

	onTouchStart = (event) => {
		this.isTouchDevice = true

		// Reset `ignoreTouchMoveEvents` flag.
		if (this.ignoreTouchMoveEvents) {
			this.ignoreTouchMoveEvents = undefined
		}

		this.slideshow.triggerEventListeners('touchStart', event)
	}

	onTouchEnd = (event) => {
		this.isTapEvent = true
		this.tapEventTimeout = setTimeout(this.resetTapEvent, 30)

		this.slideshow.triggerEventListeners('touchEnd', event)
		this.onTouchEndOrCancel()
	}

	onTouchCancel = (event) => {
		this.slideshow.triggerEventListeners('touchCancel', event)
		this.onTouchEndOrCancel()
	}

	onTouchEndOrCancel = () => {
		// Reset `ignoreTouchMoveEvents` flag.
		if (this.ignoreTouchMoveEvents) {
			this.ignoreTouchMoveEvents = undefined
		}
	}

	onTouchMove = (event) => {
		// Call `preventDefault()` on touch move `event`s if the slideshow is locked
		// so that it doesn't interpret such gesture as scrolling a web page or
		// scaling a web page in a mobile web browser.
		if (this.slideshow.isLocked() || this.ignoreTouchMoveEvents) {
			if (event.cancelable) {
				event.preventDefault()
			}
		}

		this.slideshow.triggerEventListeners('touchMove', event)
	}

	// Disables responding to `touchmove` events for the current set of touches.
	// This flag will be reset when the touch configuration changes:
	// when new touches will start or some of the existing touches will end or cancel.
	ignoreTouchMoveEventsForCurrentTouches = () => {
		this.ignoreTouchMoveEvents = true
	}
}