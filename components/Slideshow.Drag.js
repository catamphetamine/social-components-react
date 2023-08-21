// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import { throttle } from 'lodash-es'

import { ms } from 'web-browser-style'

const DRAG_SPEED_CALC_THROTTLE = 200  // in milliseconds
const DRAG_SPEED_CALC_INTERVAL = DRAG_SPEED_CALC_THROTTLE + 100 // in milliseconds

export default class SlideshowDrag {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props

		this.reset()
	}

	addEventListeners() {
		this.slideshow.onCleanUp(this.reset)

		this.slideshow.addEventListener('slideChange', ({ i, interaction }) => {
			if (interaction !== 'pan') {
				this.reset()
			}
		})

		this.slideshow.addEventListener('pointerDown', () => {
			this.onDragStart(
				event.clientX,
				event.clientY
			)
		})

		this.slideshow.addEventListener('pointerUp', () => {
			if (this.isDragging()) {
				this.onDragEnd({ inputType: 'pointer' })
			}
		})

		this.slideshow.addEventListener('pointerOut', () => {
			// When panning on non-touch devices and the pointer goes out of
			// the viewport area, cancel the panning.
			// when starting to pan on touch devices.
			if (!this.slideshow.isTouchDevice()) {
				if (this.isDragging()) {
					this.onDragEnd({ cancelled: true, inputType: 'pointer' })
				}
			}
		})

		this.slideshow.addEventListener('pointerMove', (event) => {
			if (this.isDragging()) {
				this.onDrag(
					event.clientX,
					event.clientY
				)
			}
		})

		this.slideshow.addEventListener('oneTouch', (touch) => {
			const { x, y } = touch
			this.onDragStart(x, y)
		})

		this.slideshow.addEventListener('twoTouches', () => {
			// Exit "panning" mode when starting "touch zooming".
			// The user will still be able to pan in "touch zoom" mode by shifting both fingers:
			// when the center between the touches shifts, the slide's pan offset shifts accordingly.
			if (this.isDragging()) {
				this.onDragEnd({ ignore: true, inputType: 'touch' })
			}
		})

		const onTouchCancelOrEnd = ({ cancelled }) => {
			// If it was single-touch panning mode, then exit it.
			if (this.isDragging()) {
				this.onDragEnd({ cancelled, inputType: 'touch' })
			}
			// When lifting one finger while in double-touch zooming mode,
			// exit to single-touch panning mode.
			else if (this.slideshow.touches.getTouchCount() === 1) {
				const { x, y } = this.slideshow.touches.getTouch()
				this.onDragStart(x, y)
			}
		}

		this.slideshow.addEventListener('touchEnd', () => {
			onTouchCancelOrEnd({ cancelled: false })
		})

		this.slideshow.addEventListener('touchCancel', () => {
			onTouchCancelOrEnd({ cancelled: true })
		})

		this.slideshow.addEventListener('touchMove', (event) => {
			// Call `preventDefault()` on touch move `event`s if
			// the user is panning the current slide via a "pan" gesture
			// so that it doesn't interpret such gesture as scrolling a web page
			// in a mobile web browser.
			if (this.isDragging()) {
				if (event.cancelable) {
					event.preventDefault()
				}
			}

			// Handle the "pan" gesture.
			if (!this.slideshow.isLocked()) {
				if (this.isDragging()) {
					const { x, y } = this.slideshow.touches.getTouch()
					this.onDrag(x, y)
				}
			}
		})
	}

	getFunctions() {
		return {
			drag: {
				hasBeenDragging: this.hasBeenDragging,
				onDragStart: this.onDragStart,
				onDragEnd: this.onDragEnd,
				onDrag: this.onDrag,
				onDragOffsetChange: this.onDragOffsetChange,
				finishPanTransition: this.finishPanOffsetAnimation,
				setSlideOffsetX: (offsetX) => {
					this.slideOffsetX = offsetX
				},
				setSlideOffsetY: (offsetY) => {
					this.slideOffsetY = offsetY
				},
				getSlideOffsetPlusDragOffsetX: () => {
					return this.slideOffsetX + this.getDragOffsetX()
				},
				getSlideOffsetPlusDragOffsetY: () => {
					return this.slideOffsetY + this.getDragOffsetY()
				},
				getDragOffsetX: this.getDragOffsetX,
				getDragOffsetY: this.getDragOffsetY,
				setDragOffsetX: (offsetX) => {
					this.currentDragOffsetX = offsetX - this.prevDragsEndedAtOffsetX
				},
				setDragOffsetY: (offsetY) => {
					this.currentDragOffsetY = offsetY - this.prevDragsEndedAtOffsetY
				},
				stopDragInertialMovement: this.stopDragInertialMovement,
				resetDragOffset: this.resetDragOffset,
				resetDragInertialMovementOffset: this.resetDragInertialMovementOffset
			}
		}
	}

	reset = () => {
		this.resetDrag()
		this.resetDragOffset()
		this.resetDragInertialMovementOffset()
		this.finishPanOffsetAnimation()
		// Resetting `this.hasBeenDragging_` is not part of `resetDrag()`
		// because it's supposed to be reset some time after,
		// so that the "mouse up" event doesn't trigger a closing click
		// on the current slide.
		this.hasBeenDragging_ = undefined
		this.resetDragEndAnimation()
	}

	resetDrag() {
		this.isDragging_ = false
		this.isActuallyDragging = false
		this.panDirection = undefined
		this.dragSpeed = 0
		this.dragSpeedAngle = 0
		this.dragSpeedSampleTimestamp = undefined
		this.currentDragOffsetXSample = undefined
		this.currentDragOffsetYSample = undefined
		this.slideshowWidth = undefined
		this.dragOriginX = undefined
		this.dragOriginY = undefined
	}

	resetCurrentDragOffset() {
		this.currentDragOffsetX = 0
		this.currentDragOffsetY = 0
	}

	resetPrevDragOffset() {
		this.prevDragsEndedAtOffsetX = 0
		this.prevDragsEndedAtOffsetY = 0
	}

	resetSlideOffset() {
		this.slideOffsetX = 0
		this.slideOffsetY = 0
	}

	resetDragInertialMovementOffset = () => {
		this.dragInertialMovementOffsetX = 0
		this.dragInertialMovementOffsetY = 0
	}

	resetDragOffset = () => {
		this.resetPrevDragOffset()
		this.resetCurrentDragOffset()
		this.resetSlideOffset()
	}

	resetDragEndAnimation = () => {
		if (this.dragEndAnimation) {
			cancelAnimationFrame(this.dragEndAnimation)
			this.dragEndAnimation = undefined
		}
	}

	stopDragInertialMovement = () => {
		this.resetDragEndAnimation()
	}

	isDragging = () => {
		return this.isDragging_
	}

	hasBeenDragging = () => {
		return this.hasBeenDragging_
	}

	getDragOffsetX = () => {
		return this.prevDragsEndedAtOffsetX + this.currentDragOffsetX + this.dragInertialMovementOffsetX
	}

	getDragOffsetY = () => {
		return this.prevDragsEndedAtOffsetY + this.currentDragOffsetY + this.dragInertialMovementOffsetY
	}

	onDragStart = (x, y) => {
		// If the slide was moving due to the inertia of the previous drag,
		// stop that inertial movement and snapshot the current slide offset.
		if (this.dragInertialMovementOffsetX) {
			this.prevDragsEndedAtOffsetX += this.dragInertialMovementOffsetX
			this.prevDragsEndedAtOffsetY += this.dragInertialMovementOffsetY
			this.resetDragInertialMovementOffset()
		}
		this.resetDragEndAnimation()

		// Reset other stuff.
		this.finishPanOffsetAnimation()
		this.slideshow.scale.stopScaleAnimation()
		this.slideshow.pinchZoom.stopPinchZoom()
		this.isDragging_ = true
		this.dragOriginX = x
		this.dragOriginY = y
		this.slideshowWidth = this.slideshow.getSlideshowWidth()
	}

	onActualDragStart(x, y) {
		this.dragOriginX = x
		this.dragOriginY = y
		this.isActuallyDragging = true
		const { onDragStart } = this.props
		onDragStart()
	}

	getAdjacentSlideTransitionDuration(pannedRatio) {
		const {
			panSlideInAnimationDuration,
			panSlideInAnimationDurationMin
		} = this.props
		return panSlideInAnimationDurationMin + Math.round(Math.abs(pannedRatio) * (panSlideInAnimationDuration - panSlideInAnimationDurationMin))
	}

	animateDragEnd = () => {
		this.dragInertialMovementOffsetX = 0
		this.dragInertialMovementOffsetY = 0

		const startedAt = Date.now()
		const initialSpeed = this.dragSpeed
		const speedAngleSin = Math.sin(this.dragSpeedAngle)
		const speedAngleCos = Math.cos(this.dragSpeedAngle)
		const easeOutTime = Math.sqrt(initialSpeed) * 0.35 * 1000
		if (easeOutTime > 0) {
			this.animateDragEndFrame(startedAt, initialSpeed, speedAngleSin, speedAngleCos, easeOutTime)
		}
	}

	animateDragEndFrame(startedAt, initialSpeed, speedAngleSin, speedAngleCos, easeOutTime, previousTimestamp = startedAt) {
		this.dragEndAnimation = requestAnimationFrame(() => {
			this.dragEndAnimation = undefined
			const now = Date.now()
			const relativeDuration = (now - startedAt) / easeOutTime
			if (relativeDuration < 1) {
				const speed = initialSpeed * (1 - easeOutQuad(relativeDuration))
				const dt = now - previousTimestamp
				const dr = speed * dt
				this.dragInertialMovementOffsetX += dr * speedAngleCos
				this.dragInertialMovementOffsetY -= dr * speedAngleSin
				this.onDragOffsetChange()
				this.animateDragEndFrame(startedAt, initialSpeed, speedAngleSin, speedAngleCos, easeOutTime, now)
			}
		})
	}

	onDragEnd = ({ cancelled, ignore, inputType } = {}) => {
		if (cancelled) {
			this.slideshow.triggerEventListeners('dragCancel')
		}

		this.calculateDragSpeed()

		const direction = this.props.getDirection()

		if (direction === 'free') {
			this.prevDragsEndedAtOffsetX += this.currentDragOffsetX
			this.prevDragsEndedAtOffsetY += this.currentDragOffsetY
			this.resetCurrentDragOffset()
			// Start inertial drag movement animation.
			this.animateDragEnd()
		} else {
			let hasClosedSlideshow
			let hasChangedSlide
			if (this.currentDragOffsetX || this.currentDragOffsetY) {
				const { i } = this.slideshow.getState()
				let slideIndex = i
				let pannedRatio
				if (this.currentDragOffsetX) {
					pannedRatio = Math.abs(this.currentDragOffsetX) / this.slideshowWidth
					// Switch slide (if panning wasn't taken over by zooming).
					if (!ignore) {
						if (pannedRatio > 0.5 || this.dragSpeed > 0.05) {
							const animationDuration = this.getAdjacentSlideTransitionDuration(pannedRatio)
							if (this.currentDragOffsetX < 0) {
								if (this.slideshow.showNext({ animationDuration, interaction: 'pan' })) {
									slideIndex++
									hasChangedSlide = true
								}
							} else {
								if (this.slideshow.showPrevious({ animationDuration, interaction: 'pan' })) {
									slideIndex--
									hasChangedSlide = true
								}
							}
						}
					}
				} else {
					pannedRatio = Math.abs(this.currentDragOffsetY) / this.slideshow.getSlideshowHeight()
					// Close the slideshow if panned vertically far enough or fast enough.
					if (!ignore) {
						if (pannedRatio > 0.5 || this.dragSpeed > 0.05) {
							hasClosedSlideshow = true
							this.slideshow.close({ interaction: 'pan' })
						}
					}
				}

				let animateOverlay
				let overlayOpacity
				if (this.currentDragOffsetY && !hasClosedSlideshow) {
					animateOverlay = true
					const { overlayOpacityForCurrentSlide } = this.slideshow.getState()
					overlayOpacity = overlayOpacityForCurrentSlide
				} else if (this.currentDragOffsetX && this.slideshow.shouldAnimateOverlayOpacityWhenPagingThrough() && hasChangedSlide) {
					animateOverlay = true
					// `overlayOpacityForCurrentSlide` is set in `state` in `Slideshow.Core`
					// before this code is executed, but the `state` might not
					// have updated yet, so using the value from `props` instead.
					overlayOpacity = this.slideshow.getOverlayOpacityWhenPagingThrough()
				}

				// Reset pan offset so that `getSlideshowPanTransform()` is reset
				// and the current slide moves back to its initial position.
				this.resetCurrentDragOffset()
				this.startPanOffsetAnimation({
					duration: this.getAdjacentSlideTransitionDuration(pannedRatio),
					slideIndex,
					animateOverlay,
					overlayOpacity
				})
			}
		}

		// Rest.
		const { onDragEnd } = this.props
		onDragEnd()

		// `this.hasBeenDragging_` flag is read later
		// to decide whether the "pointer up" event
		// should be considered part of a click
		// that closes the current slide, or whether
		// it should be cancelled.
		this.hasBeenDragging_ = this.isActuallyDragging
		setTimeout(() => {
			const { isRendered } = this.props
			if (isRendered()) {
				this.hasBeenDragging_ = undefined
			}
		}, 0)

		this.resetDrag()
	}

	onDrag = (positionX, positionY) => {
		const {
			inline,
			emulatePanResistanceOnFirstAndLastSlides,
			dragOffsetThreshold
		} = this.props

		const overlayOpacity = this.slideshow.getOverlayOpacityForCurrentSlide()

		const { i } = this.slideshow.getState()
		const direction = this.props.getDirection()

		if (!this.isActuallyDragging) {
			const dragOffsetX = positionX - this.dragOriginX
			const dragOffsetY = positionY - this.dragOriginY
			// Don't treat accidental `touchmove`
			// (or `mousemove`) events as panning.
			const isDraggingX = Math.abs(dragOffsetX) > dragOffsetThreshold
			const isDraggingY = Math.abs(dragOffsetY) > dragOffsetThreshold
			if (!isDraggingX && !isDraggingY) {
				return
			}
			this.onActualDragStart(
				this.dragOriginX + Math.sign(dragOffsetX) * dragOffsetThreshold,
				this.dragOriginY + Math.sign(dragOffsetY) * dragOffsetThreshold,
			)
			if (direction === 'xy') {
				// Can only pan in one direction: either horizontally or vertically.
				this.panDirection = isDraggingX ? 'horizontal' : 'vertical'
			}
		}

		if (direction === 'free') {
			this.currentDragOffsetX = positionX - this.dragOriginX
			this.currentDragOffsetY = positionY - this.dragOriginY
			this.onDragOffsetChange()
		} else if (direction === 'xy') {
			if (this.panDirection === 'horizontal') {
				this.currentDragOffsetX = positionX - this.dragOriginX
			} else {
				this.currentDragOffsetY = positionY - this.dragOriginY
			}
		}

		// Calculate speed.
		this.calculateDragSpeedThrottled()

		if (direction === 'xy') {
			// The user intended to swipe left/right through slides
			// which means the slideshow should start preloading and showing
			// previous/next slides (if it's not showing them already).
			if (this.panDirection === 'horizontal') {
				this.slideshow.onPeek()
			}

			// Emulate pan resistance when there are
			// no more slides to navigate to.
			if (emulatePanResistanceOnFirstAndLastSlides) {
				if (this.panDirection === 'horizontal') {
					if ((this.slideshow.isFirst() && this.currentDragOffsetX > 0) ||
						(this.slideshow.isLast() && this.currentDragOffsetX < 0)) {
						this.currentDragOffsetX = this.emulateDragResistance(this.currentDragOffsetX)
					}
				} else {
					this.currentDragOffsetY = this.emulateDragResistance(this.currentDragOffsetY)
				}
			}

			// Update overlay opacity.
			if (!inline) {
				if (this.panDirection === 'horizontal') {
					if ((this.slideshow.isFirst() && this.currentDragOffsetX > 0) ||
						(this.slideshow.isLast() && this.currentDragOffsetX < 0)) {
						this.updateOverlayOpacity(
							overlayOpacity * (1 - (Math.abs(this.currentDragOffsetX) / this.slideshow.getSlideshowWidth()))
						)
					}
				} else {
					this.updateOverlayOpacity(
						overlayOpacity * (1 - (Math.abs(this.currentDragOffsetY) / this.slideshow.getSlideshowHeight()))
					)
				}
			}

			const { updateSlideshowPanOffset } = this.props
			updateSlideshowPanOffset({ slideIndex: i })
		}
	}

	calculateDragSpeed = () => {
		const direction = this.props.getDirection()
		const now = Date.now()

		// Calculate slide offset.
		let offset
		if (direction === 'free') {
			offset = Math.sqrt(this.currentDragOffsetX * this.currentDragOffsetX + this.currentDragOffsetY * this.currentDragOffsetY)
		} else if (direction === 'xy') {
			if (this.panDirection === 'horizontal') {
				offset = this.currentDragOffsetX
			} else {
				offset = this.currentDragOffsetY
			}
		}

		if (this.dragSpeedSampleTimestamp) {
			const dt = now - this.dragSpeedSampleTimestamp
			if (dt > 0) {
				if (dt < DRAG_SPEED_CALC_INTERVAL) {
					const dx = -1 * (this.currentDragOffsetXSample - this.currentDragOffsetX)
					const dy = this.currentDragOffsetYSample - this.currentDragOffsetY

					// Calculate `dr`.
					let dr
					if (direction === 'free') {
						dr = Math.sqrt(dx * dx + dy * dy)
					} else if (direction === 'xy') {
						if (this.panDirection === 'horizontal') {
							dr = Math.abs(dx)
						} else {
							dr = Math.abs(dy)
						}
					}

					this.dragSpeed = dr / dt
					this.dragSpeedAngle = Math.atan2(dy, dx)
				} else {
					this.dragSpeed = 0
					this.dragSpeedAngle = 0
				}
			}
		}
		this.dragSpeedSampleTimestamp = now
		this.currentDragOffsetXSample = this.currentDragOffsetX
		this.currentDragOffsetYSample = this.currentDragOffsetY
	}

	onDragOffsetChange = ({ animate } = {}) => {
		if (animate) {
			const { getSlideDOMNode, animationDuration } = this.props
			this.slideshow.setSlideTransition(`transform ${ms(animationDuration)}`)
			this.resetSlideTransitionTimer = setTimeout(() => {
				this.resetSlideTransitionTimer = undefined
				this.slideshow.setSlideTransition(undefined)
			}, animationDuration)
		}

		this.slideshow.resetSlideTransform()
	}

	calculateDragSpeedThrottled = throttle(this.calculateDragSpeed, DRAG_SPEED_CALC_THROTTLE, {
		trailing: false
	})

	finishPanOffsetAnimation = () => {
		if (this.panOffsetAnimationEndTimer) {
			clearTimeout(this.panOffsetAnimationEndTimer)
			this._onPanOffsetAnimationEnd()
		}
	}

	startPanOffsetAnimation({ duration, slideIndex, animateOverlay, overlayOpacity }) {
		if (animateOverlay) {
			const { setOverlayTransitionDuration } = this.props
			setOverlayTransitionDuration(duration)
			this.updateOverlayOpacity(overlayOpacity)
		}
		const { setSlideshowPanTransitionDuration, updateSlideshowPanOffset } = this.props
		setSlideshowPanTransitionDuration(duration)
		updateSlideshowPanOffset({ slideIndex })
		// Transition the slide back to it's original position.
		this.slideshow.lock()
		this.transitionAnimatesOverlay = animateOverlay
		this.panOffsetAnimationEndTimer = setTimeout(this._onPanOffsetAnimationEnd, duration)
	}

	_onPanOffsetAnimationEnd = () => {
		const { isRendered } = this.props
		if (isRendered()) {
			this.onPanOffsetAnimationEnd()
		}
		this.panOffsetAnimationEndTimer = undefined
		this.transitionAnimatesOverlay = undefined
	}

	onPanOffsetAnimationEnd = () => {
		const { setSlideshowPanTransitionDuration } = this.props
		setSlideshowPanTransitionDuration(0)
		if (this.transitionAnimatesOverlay) {
			const { setOverlayTransitionDuration } = this.props
			setOverlayTransitionDuration(0)
		}
		this.slideshow.unlock()
	}

	emulateDragResistance(dragOffset) {
		return dragOffset * Math.exp(-1 - (dragOffset / this.slideshowWidth) / 2)
	}

	updateOverlayOpacity(opacity) {
		const { setOverlayBackgroundColor } = this.props
		setOverlayBackgroundColor(this.slideshow.getOverlayBackgroundColor(opacity))
	}
}

// https://gist.github.com/gre/1650294
function easeOutQuad(t) {
	return t * (2 - t)
}