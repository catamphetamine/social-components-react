// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import { throttle } from 'lodash-es'

const PAN_SPEED_CALC_THROTTLE = 200  // in milliseconds
const PAN_SPEED_CALC_WINDOW = PAN_SPEED_CALC_THROTTLE + 100 // in milliseconds

export default class SlideshowPan {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
		slideshow.getDragOffset = () => [this.dragOffsetX, this.dragOffsetY]
		slideshow.onCleanUp(this.reset)
		slideshow.onSlideChange((i, { interaction } = {}) => {
			if (interaction !== 'pan') {
				this.reset()
			}
		})
		this.reset()
	}

	reset = () => {
		this.resetPan()
		this.resetDragOffset()
		this.resetDragOrigin()
		this.finishTransition()
		// Resetting `this.wasPanning` is not part of `resetPan()`
		// because it's supposed to be reset some time after,
		// so that the "mouse up" event doesn't trigger a closing click
		// on the current slide.
		this.wasPanning = undefined
		this.resetDragEndAnimation()
	}

	resetPan() {
		this.isPanning = false
		this.isActuallyPanning = false
		this.panDirection = undefined
		this.panSpeed = 0
		this.panSpeedAngle = 0
		this.panSpeedSampleTimestamp = undefined
		this.panOffsetXSample = undefined
		this.panOffsetYSample = undefined
		this.slideshowWidth = undefined
		this.panOriginX = undefined
		this.panOriginY = undefined
		this.resetPanOffset()
	}

	resetPanOffset() {
		this.panOffsetX = 0
		this.panOffsetY = 0
	}

	resetDragOffset() {
		this.dragOffsetX = 0
		this.dragOffsetY = 0
	}

	resetDragOrigin() {
		this.dragOriginX = undefined
		this.dragOriginY = undefined
	}

	resetDragEndAnimation() {
		if (this.dragEndAnimation) {
			cancelAnimationFrame(this.dragEndAnimation)
			this.dragEndAnimation = undefined
		}
	}

	// Public API.
	stopDragInertialMovement() {
		this.resetDragEndAnimation()
	}

	onPanStart(x, y) {
		this.resetDragEndAnimation()
		this.finishTransition()
		this.slideshow.scale.stopAnimateScale()
		this.isPanning = true
		this.panOriginX = x
		this.panOriginY = y
		this.slideshowWidth = this.slideshow.getSlideshowWidth()
		this.dragOriginX = this.dragOffsetX
		this.dragOriginY = this.dragOffsetY
	}

	onActualPanStart(x, y) {
		this.panOriginX = x
		this.panOriginY = y
		this.isActuallyPanning = true
		const { onPanStart } = this.props
		onPanStart()
	}

	getAdjacentSlideTransitionDuration(pannedRatio) {
		const {
			panSlideInAnimationDuration,
			panSlideInAnimationDurationMin
		} = this.props
		return panSlideInAnimationDurationMin + Math.round(Math.abs(pannedRatio) * (panSlideInAnimationDuration - panSlideInAnimationDurationMin))
	}

	animateDragEnd = () => {
		const startedAt = Date.now()
		const initialSpeed = this.panSpeed
		const speedAngleSin = Math.sin(this.panSpeedAngle)
		const speedAngleCos = Math.cos(this.panSpeedAngle)
		const easeOutTime = Math.sqrt(initialSpeed) * 0.35 * 1000
		if (easeOutTime > 0) {
			this.animateDragEndFrame(startedAt, initialSpeed, speedAngleSin, speedAngleCos, easeOutTime)
		}
	}

	animateDragEndFrame(startedAt, initialSpeed, speedAngleSin, speedAngleCos, easeOutTime, previousTimestamp = startedAt) {
		this.dragEndAnimation = requestAnimationFrame(() => {
			const now = Date.now()
			const relativeDuration = (now - startedAt) / easeOutTime
			if (relativeDuration < 1) {
				const speed = initialSpeed * (1 - easeOutQuad(relativeDuration))
				const dt = now - previousTimestamp
				const dr = speed * dt
				this.dragOffsetX += dr * speedAngleCos
				this.dragOffsetY -= dr * speedAngleSin
				this.slideshow.onDragOffsetChange()
				this.animateDragEndFrame(startedAt, initialSpeed, speedAngleSin, speedAngleCos, easeOutTime, now)
			} else {
				this.dragEndAnimation = undefined
			}
		})
	}

	onPanEnd({ cancelled, ignorePan } = {}) {
		const { inline } = this.props
		const { i } = this.slideshow.getState()
		const dragAndScaleMode = this.slideshow.isDragAndScaleMode()

		if (cancelled) {
			// If a user was panning and then the pointer moved out of the browser window,
			// and if after that the user moves the pointer back to the browser window
			// without releasing the mouse button (or touch), then this works around the bug
			// when the slide would be closed due to a `click` event being processed.
			this.slideshow.ignorePointerUpEvents = true
		}

		this.calculatePanSpeed()

		if (dragAndScaleMode) {
			this.resetDragOrigin()
			this.animateDragEnd()
		} else {
			let hasClosedSlideshow
			let hasChangedSlide
			if (this.panOffsetX || this.panOffsetY) {
				let slideIndex = i
				let pannedRatio
				if (this.panOffsetX) {
					pannedRatio = Math.abs(this.panOffsetX) / this.slideshowWidth
					// Switch slide (if panning wasn't taken over by zooming).
					if (!ignorePan) {
						if (pannedRatio > 0.5 || this.panSpeed > 0.05) {
							const animationDuration = this.getAdjacentSlideTransitionDuration(pannedRatio)
							if (this.panOffsetX < 0) {
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
					pannedRatio = Math.abs(this.panOffsetY) / this.slideshow.getSlideshowHeight()
					// Close the slideshow if panned vertically far enough or fast enough.
					if (!ignorePan) {
						if (pannedRatio > 0.5 || this.panSpeed > 0.05) {
							hasClosedSlideshow = true
							this.slideshow.close({ interaction: 'pan' })
						}
					}
				}

				let animateOverlay
				let overlayOpacity
				if (this.panOffsetY && !hasClosedSlideshow) {
					animateOverlay = true
					const { maxOverlayOpacity } = this.slideshow.state
					overlayOpacity = maxOverlayOpacity
				} else if (this.panOffsetX && this.slideshow.shouldAnimateOverlayOpacityWhenPagingThrough() && hasChangedSlide) {
					animateOverlay = true
					// `maxOverlayOpacity` is set in `state` in `Slideshow.Core`
					// before this code is executed, but the `state` might not
					// have updated yet, so using the value from `props` instead.
					overlayOpacity = this.slideshow.getOverlayOpacityWhenPagingThrough()
				}

				// Reset pan offset so that `getSlideRollTransform()`
				// moves the current slide to its initial position.
				this.resetPanOffset()
				this.onTransitionStart({
					duration: this.getAdjacentSlideTransitionDuration(pannedRatio),
					slideIndex,
					animateOverlay,
					overlayOpacity
				})
			}
		}
		// Rest.
		const { onPanEnd } = this.props
		onPanEnd()
		// `this.wasPanning` flag is read later
		// to decide whether the "pointer up" event
		// should be considered part of a click
		// that closes the current slide, or whether
		// it should be cancelled.
		this.wasPanning = this.isActuallyPanning
		setTimeout(() => {
			const { isRendered } = this.props
			if (isRendered()) {
				this.wasPanning = undefined
			}
		}, 0)
		this.resetPan()
	}

	onPan(positionX, positionY) {
		const {
			inline,
			emulatePanResistanceOnFirstAndLastSlides,
			panOffsetThreshold
		} = this.props

		const overlayOpacity = this.slideshow.getMaxOverlayOpacity()

		const { i } = this.slideshow.getState()
		const dragAndScaleMode = this.slideshow.isDragAndScaleMode()

		if (!this.isActuallyPanning) {
			const panOffsetX = positionX - this.panOriginX
			const panOffsetY = positionY - this.panOriginY
			// Don't treat accidental `touchmove`
			// (or `mousemove`) events as panning.
			const isPanningX = Math.abs(panOffsetX) > panOffsetThreshold
			const isPanningY = Math.abs(panOffsetY) > panOffsetThreshold
			if (!isPanningX && !isPanningY) {
				return
			}
			this.onActualPanStart(
				this.panOriginX + Math.sign(panOffsetX) * panOffsetThreshold,
				this.panOriginY + Math.sign(panOffsetY) * panOffsetThreshold,
			)
			if (!dragAndScaleMode) {
				// Can only pan in one direction: either horizontally or vertically.
				this.panDirection = isPanningX ? 'horizontal' : 'vertical'
			}
		}

		if (dragAndScaleMode) {
			this.panOffsetX = positionX - this.panOriginX
			this.panOffsetY = positionY - this.panOriginY
			this.dragOffsetX = this.dragOriginX + this.panOffsetX
			this.dragOffsetY = this.dragOriginY + this.panOffsetY
			this.slideshow.onDragOffsetChange()
		} else if (this.panDirection === 'horizontal') {
			this.panOffsetX = positionX - this.panOriginX
		} else if (this.panDirection === 'vertical') {
			this.panOffsetY = positionY - this.panOriginY
		}

		// Calculate speed.
		this.calculatePanSpeedThrottled()

		if (dragAndScaleMode) {
			return
		}

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
				if ((this.slideshow.isFirst() && this.panOffsetX > 0) ||
					(this.slideshow.isLast() && this.panOffsetX < 0)) {
					this.panOffsetX = this.emulatePanResistance(this.panOffsetX)
				}
			} else if (this.panDirection === 'vertical') {
				this.panOffsetY = this.emulatePanResistance(this.panOffsetY)
			}
		}
		// Update overlay opacity.
		if (!inline) {
			if (this.panDirection === 'horizontal') {
				if ((this.slideshow.isFirst() && this.panOffsetX > 0) ||
					(this.slideshow.isLast() && this.panOffsetX < 0)) {
					this.updateOverlayOpacity(
						overlayOpacity * (1 - (Math.abs(this.panOffsetX) / this.slideshow.getSlideshowWidth()))
					)
				}
			} else if (this.panDirection === 'vertical') {
				this.updateOverlayOpacity(
					overlayOpacity * (1 - (Math.abs(this.panOffsetY) / this.slideshow.getSlideshowHeight()))
				)
			}
		}
		this.updateSlideRollOffset(i)
	}

	calculatePanSpeed = () => {
		const dragAndScaleMode = this.slideshow.isDragAndScaleMode()
		const now = Date.now()
		const offset = dragAndScaleMode ? Math.sqrt(this.panOffsetX * this.panOffsetX + this.panOffsetY * this.panOffsetY) : this.panOffsetX || this.panOffsetY
		if (this.panSpeedSampleTimestamp) {
			const dt = now - this.panSpeedSampleTimestamp
			if (dt > 0) {
				if (dt < PAN_SPEED_CALC_WINDOW) {
					const dx = -1 * (this.panOffsetXSample - this.panOffsetX)
					const dy = this.panOffsetYSample - this.panOffsetY
					let dr
					if (dragAndScaleMode) {
						dr = Math.sqrt(dx * dx + dy * dy)
					} else if (this.panDirection === 'horizontal') {
						dr = Math.abs(dx)
					} else if (this.panDirection === 'vertical') {
						dr = Math.abs(dy)
					}
					this.panSpeed = dr / dt
					this.panSpeedAngle = Math.atan2(dy, dx)
				} else {
					this.panSpeed = 0
					this.panSpeedAngle = 0
				}
			}
		}
		this.panSpeedSampleTimestamp = now
		this.panOffsetXSample = this.panOffsetX
		this.panOffsetYSample = this.panOffsetY
	}

	calculatePanSpeedThrottled = throttle(this.calculatePanSpeed, PAN_SPEED_CALC_THROTTLE, {
		trailing: false
	})

	finishTransition() {
		if (this.transitionEndTimer) {
			clearTimeout(this.transitionEndTimer)
			this._onTransitionEnd()
		}
	}

	onTransitionStart({ duration, slideIndex, animateOverlay, overlayOpacity }) {
		if (animateOverlay) {
			const { setOverlayTransitionDuration } = this.props
			setOverlayTransitionDuration(duration)
			this.updateOverlayOpacity(overlayOpacity)
		}
		const { setSlideRollTransitionDuration } = this.props
		setSlideRollTransitionDuration(duration)
		this.updateSlideRollOffset(slideIndex)
		// Transition the slide back to it's original position.
		this.slideshow.lock()
		this.transitionAnimatesOverlay = animateOverlay
		this.transitionEndTimer = setTimeout(this._onTransitionEnd, duration)
	}

	_onTransitionEnd = () => {
		const { isRendered } = this.props
		if (isRendered()) {
			this.onTransitionEnd()
		}
		this.transitionEndTimer = undefined
		this.transitionAnimatesOverlay = undefined
	}

	onTransitionEnd = () => {
		const { setSlideRollTransitionDuration } = this.props
		setSlideRollTransitionDuration(0)
		if (this.transitionAnimatesOverlay) {
			const { setOverlayTransitionDuration } = this.props
			setOverlayTransitionDuration(0)
		}
		this.slideshow.unlock()
	}

	emulatePanResistance(panOffset) {
		return panOffset * Math.exp(-1 - (panOffset / this.slideshowWidth) / 2)
	}

	/**
	 * Moves the slide roll to the "current" slide position.
	 */
	updateSlideRollOffset(i) {
		const { updateSlideRollOffset } = this.props
		updateSlideRollOffset(i)
	}

	updateOverlayOpacity(opacity) {
		const { setOverlayBackgroundColor } = this.props
		setOverlayBackgroundColor(this.slideshow.getOverlayBackgroundColor(opacity))
	}

	getPanOffsetX() {
		return this.panOffsetX
	}

	getPanOffsetY() {
		return this.panOffsetY
	}
}

// https://gist.github.com/gre/1650294
function easeOutQuad(t) {
	return t * (2 - t)
}