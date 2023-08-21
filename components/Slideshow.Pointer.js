export default class SlideshowPointer {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
	}

	addEventListeners() {
		this.slideshow.onCleanUp(this.cleanUp)

		// React doesn't support setting up "non-passive" listeners like "wheel" ones.
		// https://github.com/facebook/react/issues/14856
		// So it doesn't support simply passing `onWheel={this.onWheel}` property
		// to the `<Slideshow/>` element.
		this.slideshow.addEventListener('init', ({ container }) => {
			container.addEventListener('wheel', this.onWheel)

			this.removeEventListener = () => {
				container.removeEventListener('wheel', this.onWheel)
			}
		})

		this.slideshow.onCleanUp(() => {
			this.removeEventListener()
		})

		this.slideshow.addEventListener('dragCancel', () => {
			// If a user was panning and then the pointer moved out of the browser window,
			// the panning stops. But the user still hasn't let go of the mouse button,
			// so they move the pointer back to the browser window and only then they
			// release the mouse button, which would be recognized as a "click" event
			// by the web browser, resulting in closing the currently open slide.
			// Setting `ignorePointerUpEvent` to `true` works around that bug.
			this.ignorePointerUpEvent = true
		})
	}

	cleanUp = () => {
		this.ignoreBackgroundClick = undefined
		this.ignorePointerUpEvent = undefined
	}

	getFunctions() {
		return {
			onPointerDown: this.onPointerDown,
			onPointerUp: this.onPointerUp,
			onPointerMove: this.onPointerMove,
			onPointerOut: this.onPointerOut,
			onDragStart: this.onDragStart,
			onBackgroundClick: this.onBackgroundClick,
			shouldIgnoreClickEvent: this.shouldIgnoreClickEvent
		}
	}

	onPointerDown = (event) => {
		if (this.slideshow.isLocked()) {
			this.ignoreBackgroundClick = true
			return
		}
		if (!this.isClickDown(event)) {
			return this.onPointerUp()
		}
		const { isButton } = this.props
		if (isButton(event.target)) {
			return
		}
		this.ignorePointerUpEvent = undefined
		this.slideshow.triggerEventListeners('pointerDown', event)
	}

	onPointerUp = () => {
		this.slideshow.triggerEventListeners('pointerUp')
	}

	onPointerMove = (event) => {
		this.slideshow.triggerEventListeners('pointerMove', event)
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/pointerout_event
	// The pointerout event is fired for several reasons including:
	// * pointing device is moved out of the hit test boundaries of an element (`pointerleave`);
	// * firing the pointerup event for a device that does not support hover (see `pointerup`);
	// * after firing the pointercancel event (see `pointercancel`);
	// * when a pen stylus leaves the hover range detectable by the digitizer.
	onPointerOut = () => {
		this.slideshow.triggerEventListeners('pointerOut')
	}

	onBackgroundClick = (event) => {
		if (this.ignoreBackgroundClick) {
			this.ignoreBackgroundClick = undefined
			return
		}
		if (this.ignorePointerUpEvent) {
			return
		}
		if (this.slideshow.isLocked()) {
			return
		}
		// A "click" event is emitted on mouse up
		// when a user finishes panning to next/previous slide
		// then ignore such click event.
		if (this.slideshow.drag.hasBeenDragging()) {
			return
		}
		this.onBackgroundClick_(event)
	}

	onBackgroundClick_ = (event) => {
		const { closeOnOverlayClick, isOverlay } = this.props
		// Only handle clicks on slideshow overlay.
		if (!isOverlay(event.target)) {
			return
		}
		if (closeOnOverlayClick) {
			this.slideshow.close()
		}
	}

	// Cancel any possible native "dragging".
	onDragStart = (event) => {
		event.preventDefault()
	}

	onWheel = (event) => {
		const { inline, mouseWheelScaleFactor } = this.props
		const { deltaY } = event
		if (!inline) {
			event.preventDefault()
			if (deltaY < 0) {
				this.slideshow.scale.onScaleUp(event, { scaleFactor: mouseWheelScaleFactor })
			} else {
				this.slideshow.scale.onScaleDown(event, { scaleFactor: mouseWheelScaleFactor })
			}
		}
	}

	/**
	 * Returns `true` if the left mouse button was clicked.
	 * @param  {Event}  event
	 * @return {Boolean}
	 */
	isClickDown = (event) => {
		return event.button === 0
		// switch (event.button) {
		// 	// Left
		// 	case 0:
		// 		return true
		// 	// Middle
		// 	case 1:
		// 	// Right
		// 	case 2:
		// 	default:
		// 		return false
		// }
	}

	shouldIgnoreClickEvent = (event) => {
		if (this.ignorePointerUpEvent) {
			return true
		}
	}
}