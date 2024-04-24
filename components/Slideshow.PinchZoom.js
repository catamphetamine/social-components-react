import { px } from 'web-browser-style'
import { isKeyCombination } from 'web-browser-input'

export const PINCH_ZOOM_EMULATION_MODE_KEY = 'Z'

export default class SlideshowScalePinchZoom {
	constructor(slideshow, {
		onPinchZoom
	}) {
		this.slideshow = slideshow
		this.onPinchZoom = onPinchZoom
	}

	addEventListeners() {
		this.slideshow.addEventListener('twoTouches', ({
			getCenterBetweenTouches,
			getDistanceBetweenTouches
		}) => {
			this.enterPinchZoomMode({
				getCenterBetweenTouches,
				getDistanceBetweenTouches
			})
		})

		this.slideshow.addEventListener('touchMove', (event) => {
			// Call `preventDefault()` on touch move `event`s if
			// the user is scaling the current slide via a "pinch-zoom" gesture
			// so that it doesn't interpret such gesture as scaling a web page
			// in a mobile web browser.
			if (this.isInteractivePhaseOfPinchZoomMode) {
				if (event.cancelable) {
					event.preventDefault()
				}
			}

			// Handle the "pinch-zoom" gesture.
			if (!this.slideshow.isLocked()) {
				if (this.isInteractivePhaseOfPinchZoomMode) {
					// Pinch zoom will also move the slide
					// when touch fingers are moved.
					this.applyInteractivePinchZoomUpdatesOnScreen()
				}
			}
		})

		this.slideshow.addEventListener('touchCancel', () => {
			// If it was pinch-zoom mode, then exit it.
			if (this.isInteractivePhaseOfPinchZoomMode) {
				this.stopPinchZoom()
			}
		})

		this.slideshow.addEventListener('touchEnd', () => {
			// If it was pinch-zoom mode, then exit it.
			if (this.isInteractivePhaseOfPinchZoomMode) {
				this.stopPinchZoom()
			}
		})

		this.slideshow.addEventListener('slideChange', () => {
			// If it was pinch-zoom mode, then exit it.
			if (this.isInteractivePhaseOfPinchZoomMode) {
				this.stopPinchZoom({ shouldApplyScaleValue: false })
			}
			if (this.isPinchZoomEmulationMode) {
				this.exitPinchZoomEmulationMode()
			}
		})
	}

	getFunctions() {
		return {
			pinchZoom: {
				stopPinchZoom: this.stopPinchZoom,
				enterPinchZoomEmulationMode: this.enterPinchZoomEmulationMode,
				resetIfActive: this.resetIfActive,
				onResetScaleOrigin: this.onResetScaleOrigin,
				onScaleChangesSavedInState: this.onScaleChangesSavedInState,
				isInInteractivePhaseOfPinchZoomMode: () => this.isInteractivePhaseOfPinchZoomMode,
				getAdditionalOffsetForInteractivePhaseOfPinchZoom: this.getAdditionalOffsetForInteractivePhaseOfPinchZoom
			}
		}
	}

	resetIfActive = (callback) => {
		if (this.isPinchZoomMode) {
			this.resetPinchZoomMode()
			callback()
		}
	}

	// Stops pinch-zoom mode, whether "real" or "emulated" one.
	stopPinchZoom = ({ shouldApplyScaleValue } = {}) => {
		let stopped = false
		// In pinch-zoom emulation mode, the "interactive" phase of it
		// doesn't start until the user moves the mouse cursor.
		if (this.isPinchZoomEmulationMode) {
			this.exitPinchZoomEmulationMode()
			stopped = true
		}
		if (this.isInteractivePhaseOfPinchZoomMode) {
			this.exitPinchZoomMode({ shouldApplyScaleValue })
			stopped = true
		}
		return stopped
	}

	onScaleChangesSavedInState = (callback) => {
		if (this.isPinchZoomMode) {
			this.resetPinchZoomMode()
			this.onPinchZoomEnd()
			callback()
		}
	}

	resetPinchZoomMode() {
		this.isPinchZoomMode = undefined
		this.isInteractivePhaseOfPinchZoomMode = undefined
		this.scaleBeforeInteractiveZoom = undefined
		this.getPinchZoomValue = undefined
		this.initialZoomValue = undefined
		this.getPinchZoomOrigin = undefined
		// Reset stuff used when exiting "Pan and Zoom" mode on fast zoom out.
		// // Reset stuff used when closing the slideshow on fast zoom out.
		// this.pinchZoomSpeed = undefined
		this.pinchZoomInitialValue = undefined
		// this.pinchZoomPrevTimestamp = undefined
		this.pinchZoomSlideWidth = undefined
		this.pinchZoomSlideHeight = undefined
		this.pinchZoomMaxAvailableSpaceRestrictionAxis = undefined
		this.pinchZoomMaxAvailableSlideWidth = undefined
		this.pinchZoomMaxAvailableSlideHeight = undefined
		this.pinchZoomFit = undefined
	}

	onResetScaleOrigin = () => {
		this.pinchZoomOriginX = undefined
		this.pinchZoomOriginY = undefined
	}

	onPinchZoomStart(originX, originY) {
		this.slideshow.scale.setScaleOrigin(originX, originY)
		this.updatePinchZoomOriginValue(originX, originY)
	}

	onPinchZoomEnd() {
		const [offsetX, offsetY] = this.slideshow.scale.getScaleOriginOffset()
		const [scaleOriginX, scaleOriginY] = this.slideshow.scale.getScaleOrigin()
		this.slideshow.scale.setScaleOriginOffset(
			offsetX + this.pinchZoomOriginX - scaleOriginX,
			offsetY + this.pinchZoomOriginY - scaleOriginY
		)
	}

	updatePinchZoomOriginValue(originX, originY) {
		this.pinchZoomOriginX = originX
		this.pinchZoomOriginY = originY
	}

	getPinchZoomOrigin() {
		return [
			this.pinchZoomOriginX,
			this.pinchZoomOriginY
		]
	}

	getAdditionalOffsetForInteractivePhaseOfPinchZoom = () => {
		const [
			pinchZoomOriginX,
			pinchZoomOriginY
		] = this.getPinchZoomOrigin()

		const [
			scaleOriginX,
			scaleOriginY
		] = this.slideshow.scale.getScaleOrigin()

		return [
			pinchZoomOriginX - scaleOriginX,
			pinchZoomOriginY - scaleOriginY
		]
	}

	/**
	 * Enters continuous zoom mode.
	 * @param {function} getCenterBetweenTouches — A function returning "zoom origin". For example, "zoom origin" could be the middle point between two touches.
	 * @param {function} getDistanceBetweenTouches — A function returning "zoom value". For example, "zoom value" could be distance between two touches.
	 * @return {boolean} [result] Returns `false` if didn't enter zoom mode.
	 */
	enterPinchZoomMode = ({ getCenterBetweenTouches, getDistanceBetweenTouches }) => {
		// Isn't supposed to happen.
		if (this.isPinchZoomMode) {
			console.error('Continuous zoom mode initiated while already being active')
			return false
		}

		// Isn't supposed to happen.
		if (this.slideshow.scale.isScalingAtCustomOrigin()) {
			console.error('Continuous zoom mode initiated while already scaling at custom origin')
			return false
		}

		this.slideshow.drag.stopDragInertialMovement()

		const origin = getCenterBetweenTouches()
		const [originX, originY] = origin

		this.onPinchZoomStart(originX, originY)
		this.initialZoomValue = getDistanceBetweenTouches(originX, originY)

		const { scale } = this.slideshow.getState()

		this.scaleBeforeInteractiveZoom = scale
		this.slideshow.scale.startDynamicScaling()
		this.getPinchZoomValue = getDistanceBetweenTouches
		this.getPinchZoomOrigin = getCenterBetweenTouches

		this.isPinchZoomMode = true
		this.isInteractivePhaseOfPinchZoomMode = true

		// Measure stuff used when exiting "Pan and Zoom" mode on fast zoom out.
		// // Measure stuff used when closing the slideshow on fast zoom out.
		const slide = this.slideshow.getCurrentSlide()
		const maxAvailableSlideWidth = this.slideshow.getMaxAvailableSlideWidth()
		const maxAvailableSlideHeight = this.slideshow.getMaxAvailableSlideHeight()
		const maxAvailableSlideSizeRatio = maxAvailableSlideWidth / maxAvailableSlideHeight
		const slideInitialWidth = this.slideshow.getSlideInitialWidth(slide)
		const slideInitialHeight = this.slideshow.getSlideInitialHeight(slide)
		const slideSizeRatio = slideInitialWidth / slideInitialHeight
		if (slideSizeRatio >= maxAvailableSlideSizeRatio) {
			this.pinchZoomMaxAvailableSpaceRestrictionAxis = 'x'
			this.pinchZoomMaxAvailableSlideWidth = maxAvailableSlideWidth
			this.pinchZoomSlideWidth = slideInitialWidth
		} else {
			this.pinchZoomMaxAvailableSpaceRestrictionAxis = 'y'
			this.pinchZoomMaxAvailableSlideHeight = maxAvailableSlideHeight
			this.pinchZoomSlideHeight = slideInitialHeight
		}

		this.pinchZoomFit = this.getFit()
	}

	/**
	 * Exits continuous zoom mode.
	 */
	exitPinchZoomMode = ({ shouldApplyScaleValue = true } = {}) => {
		if (!this.isInteractivePhaseOfPinchZoomMode) {
			return console.error('"exitPinchZoomMode()" called while not interactively zooming')
		}
		this.isInteractivePhaseOfPinchZoomMode = undefined
		this.slideshow.scale.stopDynamicScaling({ shouldApplyScaleValue })
	}

	getScaleValue() {
		const zoomFactor = this.getPinchZoomValue() / this.initialZoomValue
		return this.getScaleValueForScale(this.scaleBeforeInteractiveZoom * zoomFactor)
	}

	/**
	 * Performs continuous zoom step.
	 */
	applyInteractivePinchZoomUpdatesOnScreen = () => {
		if (!this.isPinchZoomMode) {
			return
		}

		if (this.pinchZoomInitialValue === undefined) {
			this.pinchZoomInitialValue = this.getPinchZoomValue()
		}

		let wasStopped = false

		// Get `fit` value.
		const fit = this.getFit()

		// Get `fitChange` value.
		let fitChange
		if (fit === 'fits' && this.pinchZoomFit === 'not-fits') {
			fitChange = 'fits'
		} else if (fit === 'not-fits' && this.pinchZoomFit === 'fit') {
			fitChange = 'not-fits'
		}

		// Update `this.pinchZoomFit`.
		this.pinchZoomFit = fit

		this.onPinchZoom({
			// zoomRatio: this.getPinchZoomValue() / this.pinchZoomInitialValue,
			fitChange,
			followPinchZoomOrigin: () => {
				const [originX, originY] = this.getPinchZoomOrigin()
				this.updatePinchZoomOriginValue(originX, originY)
			},
			// This function can be called if the outside code has exited "Pan and Zoom" mode.
			// Exiting "Pan and Zoom" mode automatically calls `stopPinchZoom()` function
			// in `onExitPanAndZoomMode()` listener.
			onStopped: () => {
				wasStopped = true
			}
		})

		// If pinch-zooming was stopped then don't update the dynamic scale.
		if (wasStopped) {
			return
		}

		// Update the scale.
		this.slideshow.scale.setDynamicScaleValue(this.getScaleValue())

		// // Close slideshow on fast zoom out when the slide is minimized.
		// const INTERACTIVE_ZOOM_CLOSE_SPEED_THRESHOLD = 0.5
		// const INTERACTIVE_ZOOM_CLOSE_MAX_SIZE_RATIO_THRESHOLD = 0.85
		// if (this.pinchZoomSpeed > INTERACTIVE_ZOOM_CLOSE_SPEED_THRESHOLD) {
		// 	let shouldClose
		// 	if (this.pinchZoomMaxAvailableSlideWidth !== undefined) {
		// 		shouldClose = this.pinchZoomSlideWidth * zoomFactor < INTERACTIVE_ZOOM_CLOSE_MAX_SIZE_RATIO_THRESHOLD * this.pinchZoomMaxAvailableSlideWidth
		// 	} else {
		// 		shouldClose = this.pinchZoomSlideHeight * zoomFactor < INTERACTIVE_ZOOM_CLOSE_MAX_SIZE_RATIO_THRESHOLD * this.pinchZoomMaxAvailableSlideHeight
		// 	}
		// 	if (shouldClose) {
		// 		this.exitPinchZoomMode()
		// 		const ANIMATION_DURATION = 120 * 100
		// 		function timeoutPromise(duration) {
		// 			return new Promise(resolve => setTimeout(resolve, duration))
		// 		}
		// 		this.slideshow.addEventListener('close', ({ interaction }) => {
		// 			if (interaction === 'zoomOut') {
		// 				if (this.slideshow.resetEmulateInteractiveZoom) {
		// 					this.slideshow.resetEmulateInteractiveZoom()
		// 				}
		// 				return {
		// 					animationDuration: ANIMATION_DURATION,
		// 					promise: timeoutPromise(ANIMATION_DURATION)
		// 				}
		// 			}
		// 		})
		// 		this.slideshow.close({ interaction: 'zoomOut' })
		// 		console.log('@ Add fake touch move listeners here, and remove them on touch end/cancel.')
		// 		return
		// 	}
		// }
	}

	getScaleValueForScale(scale) {
		if (this.slideshow.panAndZoomMode.isPanAndZoomMode()) {
			// Don't limit min / max scale in "Pan & Zoom" mode.
			return scale
		} else {
			// Limit min / max scale in regular zoom mode.
			return this.slideshow.scale.getConstrainedScaleForCurrentSlide(scale)
		}
	}

	getFit() {
		return this.doesFitInTheAvailableSpace() ? 'fits' : 'not-fits'
	}

	doesFitInTheAvailableSpace() {
		if (!this.isPinchZoomMode) {
			throw new Error('`doesFitInTheAvailableSpace()` can\'t be called outside of pinch-zoom mode')
		}
		if (this.pinchZoomMaxAvailableSpaceRestrictionAxis === 'x') {
			return this.pinchZoomSlideWidth * this.getScaleValue() <= this.pinchZoomMaxAvailableSlideWidth
		} else if (this.pinchZoomMaxAvailableSpaceRestrictionAxis === 'y') {
			return this.pinchZoomSlideHeight * this.getScaleValue() <= this.pinchZoomMaxAvailableSlideHeight
		}
	}

	/**
	 * Can be used for testing touch zoom.
	 * DevTools doesn't provide the means to test multi-touch.
	 * Isn't used in production.
	 */
	enterPinchZoomEmulationMode = () => {
		if (this.isPinchZoomEmulationMode) {
			console.error('Already in pinch-zoom emulation mode')
			return false
		}

		console.log('### Start Pinch Zoom Emulation. Move the mouse cursor while holding Z key to zoom. Release Z key to stop zooming.')

		this.isPinchZoomEmulationMode = true

		this.pinchZoomEmulationModeMouseMoveListener = (event) => {
			const secondTouchElement = this.pinchZoomEmulationModeSecondTouchElement
			if (secondTouchElement) {
				this.updateSecondTouchCoords(event.clientX, event.clientY)
				secondTouchElement.style.top = px(event.clientY - PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH / 2)
				secondTouchElement.style.left = px(event.clientX - PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH / 2)
				this.applyInteractivePinchZoomUpdatesOnScreen()
			} else {
				this.startInteractivePhaseOfPinchZoomEmulationMode(event)
			}
		}

		this.pinchZoomEmulationModeKeyUpListener = (event) => {
			if (event.key === PINCH_ZOOM_EMULATION_MODE_KEY.toLowerCase() || event.key === PINCH_ZOOM_EMULATION_MODE_KEY.toUpperCase()) {
				this.stopPinchZoom()
			}
		}

		document.addEventListener('mousemove', this.pinchZoomEmulationModeMouseMoveListener)
		document.addEventListener('keyup', this.pinchZoomEmulationModeKeyUpListener)
	}

	startInteractivePhaseOfPinchZoomEmulationMode(event) {
		this.updateFirstTouchCoords(
			event.clientX - Math.random() * 100,
			event.clientY - Math.random() * 100
		)

		this.updateSecondTouchCoords(
			event.clientX,
			event.clientY
		)

		this.enterPinchZoomMode({
			getCenterBetweenTouches: () => {
				const firstTouchCoords = this.pinchZoomEmulationModeFirstTouchCoords
				const secondTouchCoords = this.pinchZoomEmulationModeSecondTouchCoords

				return [
					firstTouchCoords[0] + (secondTouchCoords[0] - firstTouchCoords[0]) / 2,
					firstTouchCoords[1] + (secondTouchCoords[1] - firstTouchCoords[1]) / 2
				]
			},

			getDistanceBetweenTouches: () => {
				const firstTouchCoords = this.pinchZoomEmulationModeFirstTouchCoords
				const secondTouchCoords = this.pinchZoomEmulationModeSecondTouchCoords

				return Math.sqrt(
					(secondTouchCoords[0] - firstTouchCoords[0]) * (secondTouchCoords[0] - firstTouchCoords[0]) +
					(secondTouchCoords[1] - firstTouchCoords[1]) * (secondTouchCoords[1] - firstTouchCoords[1])
				)
			}
		})

		function createTouchElement(x, y) {
			const element = document.createElement('div')
			element.style.position = 'fixed'
			element.style.top = px(y - PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH / 2)
			element.style.left = px(x - PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH / 2)
			element.style.zIndex = 1000
			// Don't "steal" the focus on click.
			// Otherwise, the user won't be able to exit pinch-zoom emulation mode via Esc key.
			element.style.pointerEvents = 'none'
			element.style.width = px(PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH)
			element.style.height = px(PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH)
			element.style.borderRadius = px(PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH / 2)
			element.style.border = '1px solid rgba(0,0,0,0.3)'
			element.style.background = 'rgba(255,0,0,0.3)'
			document.body.appendChild(element)
			return element
		}

		const firstTouchCoords = this.pinchZoomEmulationModeFirstTouchCoords
		const secondTouchCoords = this.pinchZoomEmulationModeSecondTouchCoords

		this.pinchZoomEmulationModeFirstTouchElement = createTouchElement(firstTouchCoords[0], firstTouchCoords[1])
		this.pinchZoomEmulationModeSecondTouchElement = createTouchElement(secondTouchCoords[0], secondTouchCoords[1])

		return true
	}

	exitPinchZoomEmulationMode() {
		if (!this.isPinchZoomEmulationMode) {
			return console.error('Not in pinch-zoom emulation mode')
		}

		console.log('### End Pinch Zoom Emulation')

		document.removeEventListener('mousemove', this.pinchZoomEmulationModeMouseMoveListener)
		this.pinchZoomEmulationModeMouseMoveListener = undefined

		document.removeEventListener('keyup', this.pinchZoomEmulationModeKeyUpListener)
		this.pinchZoomEmulationModeKeyUpListener = undefined

		if (this.pinchZoomEmulationModeFirstTouchElement) {
			document.body.removeChild(this.pinchZoomEmulationModeFirstTouchElement)
			document.body.removeChild(this.pinchZoomEmulationModeSecondTouchElement)
			this.pinchZoomEmulationModeFirstTouchElement = undefined
			this.pinchZoomEmulationModeSecondTouchElement = undefined
		}

		this.pinchZoomEmulationModeFirstTouchCoords = undefined
		this.pinchZoomEmulationModeSecondTouchCoords = undefined

		this.isPinchZoomEmulationMode = undefined
	}

	updateFirstTouchCoords(x, y) {
		this.pinchZoomEmulationModeFirstTouchCoords = [x, y]
	}

	updateSecondTouchCoords(x, y) {
		this.pinchZoomEmulationModeSecondTouchCoords = [x, y]
	}
}

const PINCH_ZOOM_EMULATION_MODE_TOUCH_ELEMENT_WIDTH = 20