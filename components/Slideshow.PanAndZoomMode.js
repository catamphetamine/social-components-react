import { ms, scaleFactor as formatScaleFactor } from 'web-browser-style'

export default class SlideshowScalePanAndZoomMode {
	constructor(slideshow, {
		onEnterPanAndZoomMode,
		onExitPanAndZoomMode,
		scaleAnimationDuration,
		focus
	}) {
		this.slideshow = slideshow

		this.onEnterPanAndZoomMode = onEnterPanAndZoomMode
		this.onExitPanAndZoomMode = onExitPanAndZoomMode

		this.props = {
			scaleAnimationDuration,
			focus
		}
	}

	addEventListeners() {
		// Reset "Pan and Zoom" mode exit timer.
		this.slideshow.onCleanUp(() => {
			this.resetExitPanAndZoomModeTimer()
		})

		this.slideshow.addEventListener('slideChange', () => {
			this.resetPanAndZoomMode()
			this.resetExitPanAndZoomModeTimer()
		})
	}

	getFunctions() {
		return {
			panAndZoomMode: {
				isPanAndZoomMode: this.isPanAndZoomMode,
				enterPanAndZoomMode: this.enterPanAndZoomMode,
				exitPanAndZoomMode: this.exitPanAndZoomMode,
				getCurrentSlideOffsetInPanAndZoomMode: this.getCurrentSlideOffsetInPanAndZoomMode,
				getPanAndZoomModeMoveStep: this.getPanAndZoomModeMoveStep
			}
		}
	}

	isPanAndZoomMode = () => {
		return this.panAndZoomMode
	}

	enterPanAndZoomMode = () => {
		if (this.onEnterPanAndZoomMode) {
			this.onEnterPanAndZoomMode()
		}
		// this.resetExitPanAndZoomModeTimer()
		this.panAndZoomMode = true
	}

	getPanAndZoomModeMoveStep = () => {
		return Math.max(this.slideshow.getSlideshowWidth(), this.slideshow.getSlideshowHeight()) / 10
	}

	exitPanAndZoomMode = () => {
		this.slideshow.lock()

		const slide = this.slideshow.getCurrentSlide()

		// Calculate scale factor.
		const { scale: currentScale } = this.slideshow.getState()

		let scale = this.slideshow.scale.stopScaleAnimation({ shouldApplyScaleValue: false })
		if (scale === undefined) {
			scale = currentScale
		}

		// Start animation.
		const { scaleAnimationDuration } = this.props
		const scaleFactor = this.slideshow.scale.getInitialScaleForCurrentSlide() / currentScale

		const { i } = this.slideshow.getState()
		const { transform, transformOrigin } = this.slideshow.getSlideTransform(i, {
			scaleFactor,
			whenExitsPanAndZoomMode: true
		})

		// // Resets the CSS `transform` property.
		// // But calling this function should also come with resetting
		// // the `width` and `height` of the slide,
		// // otherwise there'd be a momentary "flicker" of an enlarged copy of the slide.
		// const resetTransformScale = () => {
		// 	const { transform, transformOrigin } = this.slideshow.getSlideTransform(i, {
		// 		whenExitsPanAndZoomMode: true
		// 	})
		// 	this.slideshow.setSlideTransform(transform, transformOrigin)
		// }

		const cleanUp = () => {
			// Turn off CSS `transition` for the slide
			// so that it doesn't animate changes in `transform`, etc.
			this.slideshow.setSlideTransition(undefined)

			this.slideshow.drag.resetDragOffset()
			this.slideshow.drag.resetDragInertialMovementOffset()
			this.slideshow.scale.resetScaleOrigin()

			// `this.slideshow.scale.resetBoxShadowChangesForDynamicScale()` function is not used here
			// because it would produce a momentary "flicker" of the box shadow
			// upon exiting "Pan & Zoom" mode because the slide's scale is not
			// reset at that time yet: it will be reset during a follow-up React re-render.
			// this.slideshow.scale.resetBoxShadowChangesForDynamicScale()

			// Scale is not reset immediately.
			// Instead, it's reset during a follow-up React re-render.
			// resetTransformScale()

			// Reset "Pan and Zoom" mode.
			// Will update slideshow state and re-render the `<Slideshow/>`.
			this.resetPanAndZoomMode(() => {
				// The current slide's `box-shadow` gets "scaled" along with the slide itself
				// so it has to be dynamically adjusted to counter that scaling so that
				// the shadow stays of the same size.
				//
				// When a user resets a slide's zoom, its `box-shadow` has to be reset
				// to its original value as well immediately after a React re-render.
				//
				this.slideshow.scale.resetBoxShadowChangesForDynamicScale()

				// Re-focus the slide, because the "Pan and Zoom" mode button
				// won't be rendered after the new state is applied,
				// and so it would "lose" the focus.
				const { focus } = this.props
				focus(i)

				this.slideshow.unlock()
			})
		}

		// // Update scale value in the UI.
		// const { onScaleChange } = this.props
		// if (onScaleChange) {
		// 	onScaleChange(1)
		// }
		// It turned out that for large scales the `transform: scale()` transition is laggy,
		// even on a modern PC, when zooming out from 5x to 1x.
		// On iPhone 6S Plus it even crashes iOS Safari when exiting
		// zoom mode with a scale transition from 100x to 1x.
		// Therefore, for scales larger than 5x there's no transition.
		if (scale > 5) {
			// No `transform: scale()` transition.
			return cleanUp()
		}

		// Calculate animation distance.
		const { offsetX, offsetY } = this.slideshow.getSlideCoordinates(i)
		const [defaultOffsetX, defaultOffsetY] = this.slideshow.getBaseOffsetForSlide(i, {
			whenExitsPanAndZoomMode: true
		})
		const bounceAnimation = new BounceAnimation(this.slideshow, transform, transformOrigin)
		const dx = offsetX - defaultOffsetX
		const dy = offsetY - defaultOffsetY
		const dr = Math.sqrt(dx * dx + dy * dy)
		const dw = (this.slideshow.getSlideInitialWidth(this.slideshow.getCurrentSlide()) * (scale - 1))
		const animationOffset = dr + dw / 2
		const animationDuration = scaleAnimationDuration * (0.7 + 0.5 * animationOffset / 1000)

		this.slideshow.setSlideTransition(`transform ${ms(animationDuration)}, box-shadow ${ms(animationDuration)}`)

		// Scale (and animate) the slide's shadow accordingly.
		this.slideshow.scale.updateBoxShadowForDynamicScale(1)
		this.slideshow.setSlideTransform(
			bounceAnimation ? bounceAnimation.getInitialTransform() : transform,
			transformOrigin
		)

		if (this.onExitPanAndZoomMode) {
			this.onExitPanAndZoomMode()
		}

		this.exitPanAndZoomModeTimer = setTimeout(() => {
			this.exitPanAndZoomModeTimer = undefined
			if (bounceAnimation) {
				bounceAnimation.playBounceAnimation(timer => this.exitPanAndZoomModeTimer = timer).then(cleanUp)
			} else {
				cleanUp()
			}
		}, animationDuration)
	}

	resetPanAndZoomMode(callback) {
		this.panAndZoomMode = undefined

		const initialScale = this.slideshow.scale.getInitialScaleForCurrentSlide();

		// If `callback` was supplied, then call it right after the state update.
		if (callback) {
			this.slideshow.addEventListener('stateChangeImmediate', () => {
				// Workaround: Manually reset `style.transform` of the current slide
				// because otherwise, for some weird reason, it wouldn't be reset
				// for some video slides.
				//
				// Steps to reproduce:
				//
				// * Comment out the `this.setSlideTransform()` call below.
				// * Open a video slide that is smaller than the viewport.
				// * Enlarge the video slide via "Shift + Up Arrow" key combination.
				//   Enlarging via mouse wheel won't work, presumably because it already
				//   modifies `style.transform` directly when handling mouse wheel events.
				// * Keep enlarging the video until the slide enters "Pan & Zoom" mode
				//   due to being larger than the viewport.
				// * Hit "Esc" key to exit "Pan & Zoom" mode.
				// * The slide will bounce-animate back to its initial width
				//   and then it will abruptly scale down by the same factor
				//   it scaled itself down as part of "Exit Pan & Zoom mode" animation.
				// * To verify that it's a bug in Chrome or in React, scale down the video slide
				//   via "Shift + Down Arrow" key combination and see that it either almost won't
				//   shrink in size or it may even grow larger in size, meaning that the styles
				//   haven't been applied correctly.
				const { transform, transformOrigin } = this.slideshow.getSlideTransform(this.slideshow.getCurrentSlideIndex(), {
					scaleFactor: initialScale
				})
				this.slideshow.setSlideTransform(transform, transformOrigin)

				// Call the `callback()`.
				callback()
			}, { once: true })
		}

		// Update the state: reset the `scale`.
		this.slideshow.setState({
			scale: initialScale,
			// ...this.getSlidePanAndZoomInitialState()
		})
	}

	resetExitPanAndZoomModeTimer() {
		if (this.exitPanAndZoomModeTimer) {
			clearTimeout(this.exitPanAndZoomModeTimer)
			this.exitPanAndZoomModeTimer = undefined
		}
	}

	getCurrentSlideOffsetInPanAndZoomMode = ({ forUseWithDefaultOrigin }) => {
		let offsetX = 0
		let offsetY = 0

		// debug('Side offset + Drag offset', this.drag.getSlideOffsetPlusDragOffsetX(), this.drag.getSlideOffsetPlusDragOffsetY())
		offsetX += this.slideshow.drag.getSlideOffsetPlusDragOffsetX()
		offsetY += this.slideshow.drag.getSlideOffsetPlusDragOffsetY()

		const [dx, dy] = this.slideshow.scale.getScaleOriginOffset()
		// debug('Scale origin offset', dx, dy)
		offsetX += dx
		offsetY += dy

		if (this.slideshow.pinchZoom.isInInteractivePhaseOfPinchZoomMode()) {
			const [dx, dy] = this.slideshow.pinchZoom.getAdditionalOffsetForInteractivePhaseOfPinchZoom()
			// debug('Interactive zoom origin offset X', dx, dy)
			offsetX += dx
			offsetY += dy
		}

		if (this.slideshow.scale.isScalingAtCustomOrigin() && forUseWithDefaultOrigin) {
			const { scale } = this.slideshow.getState()
			const [dx, dy] = this.slideshow.scale.getAdditionalOffsetForScalingAtCustomOrigin(scale)
			// debug('Scale origin offset (for new scale)', dx, dy)
			offsetX += dx
			offsetY += dy
		}

		return [
			offsetX,
			offsetY
		]
	}
}

// // `4` would've worked as `SCALE_PRECISION`
// // but `BounceAnimation` animation scaling is a bit subtle at times
// // so set it to `10` instead.
// const SCALE_PRECISION = 10

// const TRANSFORM_ORIGIN_PRECISION = 4

// Plays a "bounce" animation.
class BounceAnimation {
	constructor(slideshow, transform, transformOrigin, callback) {
		this.slideshow = slideshow
		this.transform = transform
		this.transformOrigin = transformOrigin
		this.callback = callback
		this.transformScale = parseFloat(transform.match(/scale\(([\d\.]+)\)/)[1])
		this.scaleAnimationFactor = 0.75 * (1 + 0.8 * ((2000 - slideshow.getSlideshowWidth()) / 2000))
		this.bounceAnimationInitialScale = 1 - (0.04 * this.scaleAnimationFactor)
	}

	getTransform(scale) {
		// Scales `scale()` factor in `transform`.
		return this.transform.replace(/scale\([\d\.]+\)/, `scale(${formatScaleFactor(this.transformScale * scale)})`)
	}

	getInitialTransform() {
		return this.getTransform(this.bounceAnimationInitialScale)
	}

	playBounceAnimation(setTimer) {
		// Play "bounce" animation on the slide.
		// const BOUNCE_ANIMATION_EASING = 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
		const KEYFRAMES = [
			{
				duration: 140,
				scale: 1 + (0.01 * this.scaleAnimationFactor)
			},
			{
				duration: 180,
				scale: 1
			}
		]

		const animateKeyframes = (keyframes, callback) => {
			if (keyframes.length === 0) {
				return callback()
			}
			const keyframe = keyframes[0]
			this.slideshow.setSlideTransition(`transform ${ms(keyframe.duration)}`) // ${BOUNCE_ANIMATION_EASING}`)
			this.slideshow.setSlideTransform(this.getTransform(keyframe.scale), this.transformOrigin)
			// getSlideDOMNode().classList.add('Slideshow-Slide--bounce')
			setTimer(setTimeout(() => {
				setTimer()
				animateKeyframes(keyframes.slice(1), callback)
			}, keyframe.duration))
		}

		return new Promise((resolve) => {
			animateKeyframes(KEYFRAMES, resolve)
		})
	}
}
