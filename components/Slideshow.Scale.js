// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import { px, ms } from 'web-browser-style'

import {
	getSlideMaxInitialWidth,
	getSlideMaxInitialHeight,
	getSlideshowWidth,
	getSlideshowHeight,
	getMaxAvailableSlideWidth,
	getMaxAvailableSlideHeight
} from './Slideshow.Size.js'

export default class SlideshowScale {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props

		// Set `this.scaleOriginOffsetX` and `this.scaleOriginOffsetY` to `0`.
		this.resetScaleOriginOffset()
	}

	reset = () => {
		const callback = ignoreSubsequentCalls(() => {
			this.resetDynamicScaleValue()
		})

		this.resetScaleAnimationIfRunning(callback)
		this.resetLatestScaleTime()
		this.slideshow.pinchZoom.resetIfActive(callback)
	}

	resetScaleAnimationIfRunning(callback) {
		if (this.isAnimatingScale) {
			this.slideshow.setSlideTransition(undefined)
			this.resetScaleAnimation()
			callback()
		}
	}

	resetDynamicScaleValue() {
		this.dynamicScaleValue = undefined
	}

	// Should be called with `this.slideshow.setSlideTransition()`.
	resetScaleAnimation() {
		this.isAnimatingScale = undefined
		this.animateScaleStartedAt = undefined

		if (this.finishScaleAnimationTimeout) {
			clearTimeout(this.finishScaleAnimationTimeout)
			this.finishScaleAnimationTimeout = undefined
		}
	}

	resetScaleOrigin = () => {
		this.resetScaleOriginPoint()
		this.resetScaleOriginOffset()

		this.slideshow.pinchZoom.onResetScaleOrigin()
	}

	resetScaleOriginPoint() {
		this.scaleOriginCoordinatesRelativeToSlideSize = undefined
		this.scaleOriginX = undefined
		this.scaleOriginY = undefined
	}

	resetScaleOriginOffset() {
		this.scaleOriginOffsetX = 0
		this.scaleOriginOffsetY = 0
	}

	getFunctions() {
		return {
			scale: {
				onScaleUp: this.onScaleUp,
				onScaleDown: this.onScaleDown,
				onScaleToggle: this.onScaleToggle,
				getScaleOrigin: this.getScaleOrigin,
				setScaleOrigin: this.setScaleOrigin,
				isScalingAtCustomOrigin: this.isScalingAtCustomOrigin,
				setCustomScaleOrigin: this.setCustomScaleOrigin,
				getScaleOriginOffset: this.getScaleOriginOffset,
				setScaleOriginOffset: this.setScaleOriginOffset,
				setDynamicScaleValue: this.setDynamicScaleValue,
				startDynamicScaling: this.startDynamicScaling,
				stopDynamicScaling: this.stopDynamicScaling,
				getConstrainedScaleForCurrentSlide: this.getConstrainedScaleForCurrentSlide,
				resetScaleOrigin: this.resetScaleOrigin,
				stopScaleAnimation: this.stopScaleAnimation,
				getAdditionalOffsetForScalingAtCustomOrigin: this.getAdditionalOffsetForScalingAtCustomOrigin,
				getCustomScaleOriginCoordinatesRelativeToSlideSize: this.getCustomScaleOriginCoordinatesRelativeToSlideSize,
				updateBoxShadowForDynamicScale: this.updateBoxShadowForDynamicScale,
				resetBoxShadowChangesForDynamicScale: this.resetBoxShadowChangesForDynamicScale,
				getInitialScaleForCurrentSlide: this.getInitialScaleForCurrentSlide,
				willNoLongerFitTheScreenAfterScalingUp: this.willNoLongerFitTheScreenAfterScalingUp,
				getLatestScaleTime: this.getLatestScaleTime,
				resetLatestScaleTime: this.resetLatestScaleTime
			}
		}
	}

	addEventListeners() {
		this.slideshow.onCleanUp(this.reset)

		this.slideshow.addEventListener('slideChange', this.reset)

		this.slideshow.addEventListener('stateChangeImmediate', ({ newState, prevState }) => {
			const { scale } = newState
			const { scale: prevScale } = prevState
			// On change scale.
			if (scale !== prevScale) {
				this.onScaleChangesSavedInState()
			}
		})

		// Reset fixed origin.
		this.slideshow.addEventListener('slideChange', () => {
			this.resetScaleOrigin()
		})
	}

	getScaledUpScaleValue(scale, scaleStep, { restrict = true } = {}) {
		scale *= 1 + scaleStep
		if (restrict) {
			return Math.min(scale, this.getSlideMaxScale(this.slideshow.getCurrentSlide()))
		}
		return scale
	}

	getScaledDownScaleValue(scale, scaleStep, { minScale } = {}) {
		scale /= 1 + scaleStep
		if (minScale) {
			return Math.max(
				scale,
				minScale === true ? this.getMinScaleForCurrentSlide() : minScale
			)
		}
		return scale
	}

	getToggledScaleValue(scale) {
		const slide = this.slideshow.getCurrentSlide()
		// Compensates math precision (at least it is meant to do that).
		return scale > 0.99 && scale < 1.01 ? this.getSlideMaxScale(slide) : 1
	}

	onScaleUp = (event, { scaleFactor = 1 } = {}) => {
		const { onScaleUp } = this.props
		if (onScaleUp) {
			if (onScaleUp({ event, scaleFactor }) === false) {
				return
			}
		}
		this.scaleUp(scaleFactor)
	}

	onScaleDown = (event, { scaleFactor = 1 } = {}) => {
		const { onScaleDown } = this.props
		if (onScaleDown) {
			if (onScaleDown({ event }) === false) {
				return
			}
		}
		this.scaleDown(scaleFactor)
	}

	onScaleToggle = () => {
		this.scaleToggle()
	}

	// While scaling via a mouse wheel, this function doesn't do anything.
	//
	// While scaling via keyboard keys, this function shifts the slide around,
	// if required, in such a way that it stays within the viewport bounds
	// while being enlarged unless it's too big to fit into the viewport bounds.
	//
	setCustomScaleOrigin = (event) => {
		if (this.isScalingAtCustomOrigin()) {
			// Scaling in "Pan and Zoom" mode is currently in progress.
			// Don't change the scale origin while it's in progress.
			// Can only change the scale origin when it starts, not when it's in progress.
			return
		}

		// If zooming via a mouse wheel.
		if (event.type === 'wheel') {
			// Ignore for mouse "wheel" events because in such cases
			// the user has the control over the mouse cursor position
			// so we assume that the user places the mouse cursor wherever
			// it's convenient for them, and that the program shouldn't
			// attempt to be "overly smart" in such cases because
			// the user supposedly knows what they're doing and why did they
			// put the mouse cursor at the exact position on screen while scaling the slide.
			this.setScaleOrigin(event.clientX, event.clientY)
		}
		// If zooming via a keyboard.
		else {
			// Returns the coordinates of the center of the slide.
			const getSlideCenterCoordinates = () => {
				const { i } = this.slideshow.getState()
				const { x, y, width, height } = this.slideshow.getSlideCoordinates(i)
				return [
					x + width / 2,
					y + height / 2
				]
			}

			// Returns the coordinates of the center of the screen.
			const getScreenCenterCoordinates = () => {
				return [
					this.slideshow.getSlideshowWidth() / 2,
					this.slideshow.getSlideshowHeight() / 2
				]
			}

			// // By default, zoom relative to the center of the slide.
			// // But if slideshow is in fullscreen mode,
			// // if the center of the screen is inside the slide,
			// // then scale the slide relative to the center of the screen.
			//
			// originX = getSlideCenterCoordinates()[0]
			// originY = getSlideCenterCoordinates()[1]
			//
			// const { getSlideDOMNode, inline } = this.props
			//
			// if (!inline) {
			// 	const [screenCenterX, screenCenterY] = getScreenCenterCoordinates()
			// 	const marginInsideSlide = Math.min(slideshowWidth, slideshowHeight) * 0.1
			// 	if (
			// 		x < screenCenterX - marginInsideSlide &&
			// 		x + width > screenCenterX + marginInsideSlide &&
			// 		y < screenCenterY - marginInsideSlide &&
			// 		y + height > screenCenterY + marginInsideSlide
			// 	) {
			// 		originX = screenCenterX
			// 		originY = screenCenterY
			// 	}
			// }
			//
			// this.setScaleOrigin(originX, originY)

			const [screenCenterX, screenCenterY] = getScreenCenterCoordinates()
			this.setScaleOrigin(screenCenterX, screenCenterY)
		}
	}

	getScaleOrigin = () => {
		// Just in case someone calls this function when it's not supposed to be called.
		if (this.scaleOriginX === undefined) {
			console.error('`getScaleOrigin()` called when there\'s no scale origin')
		}

		return [
			this.scaleOriginX,
			this.scaleOriginY
		]
	}

	setScaleOrigin = (originX, originY) => {
		// The `if` block situation shouldn't happen.
		if (this.isScalingAtCustomOrigin()) {
			throw new Error('Slide scale origin has already been set')
		}

		// // The `if` block situation shouldn't happen.
		// // Even if it happens, not re-fixing the origin while scale animation is playing
		// // results in a smoother scaling experience (no slide coordinates jitter).
		// if (this.isScalingAtCustomOrigin()) {
		// 	console.error('Slide scale origin has already been set')
		// 	return
		// }

		const { scale } = this.slideshow.getState()

		// By default, when scaling using no specific "origin" point,
		// the "origin" for the scale transform is "center center".
		this.initialScaleOriginCoordinatesRelativeToSlideSize = { x: 0.5, y: 0.5 }
		this.initialScaleAtInitialScaleOrigin = scale

		this.scaleOriginCoordinatesRelativeToSlideSize = this.slideshow.getCoordinatesRelativeToSlideSize(originX, originY)
		this.scaleOriginX = originX
		this.scaleOriginY = originY
	}

	getCustomScaleOriginCoordinatesRelativeToSlideSize = () => {
		return [
			this.scaleOriginCoordinatesRelativeToSlideSize.x,
			this.scaleOriginCoordinatesRelativeToSlideSize.y
		]
	}

	updateScaleOriginOffsetForNewScale(newScale) {
		const [offsetX, offsetY] = this.getAdditionalOffsetForScalingAtCustomOrigin(newScale)
		this.scaleOriginOffsetX += offsetX
		this.scaleOriginOffsetY += offsetY
	}

	getScaleOriginOffset = () => {
		// Just in case someone calls this function when it's not supposed to be called.
		if (this.scaleOriginOffsetX === undefined) {
			console.error('`getScaleOriginOffset()` called when there\'s no scale origin offset')
		}

		return [
			this.scaleOriginOffsetX,
			this.scaleOriginOffsetY
		]
	}

	setScaleOriginOffset = (offsetX, offsetY) => {
		this.scaleOriginOffsetX = offsetX
		this.scaleOriginOffsetY = offsetY
	}

	// Initially, the slide is displayed scaled at some scale with the "origin" of the
	// scaling transform being "center center", for example.
	// Then, the user scales the slide via a mouse wheel while pointing at an arbitrary
	// "origin" point. As they're doing that, the slide is being scaled in real time on screen,
	// and the scale transformation is applied relative to the origin point of the mouse cursor.
	// As soon as the user releases the mouse wheel, the program has to re-calculate
	// the slide's transform so that it's relative to the initial "center center" origin
	// rather than the mouse cursor origin.
	// This function does such recalculation.
	getAdditionalOffsetForScalingAtCustomOrigin = (newScaleAtCustomScaleOrigin) => {
		// const debug = CONSOLE

		const slide = this.slideshow.getCurrentSlide()

		const {
			scaleOriginCoordinatesRelativeToSlideSize,
			initialScaleOriginCoordinatesRelativeToSlideSize,
			initialScaleAtInitialScaleOrigin
		} = this

		const nonScaledWidth = this.slideshow.getSlideInitialWidth(slide)
		const nonScaledHeight = this.slideshow.getSlideInitialHeight(slide)

		// The math for calculating appropriate offset X / Y
		// for conversion between two arbitrary "origins" is:
		//
		// const newWidth = nonScaledWidth * newScale
		// const initialWidth = nonScaledWidth * prevScale
		//
		// `newOriginXRelative` is a "relative" coordinate of the new "origin" relative
		// to the previous width of the slide: `0.5` means "at the middle of the slide".
		//
		// `initialOriginXRelative` is a "relative" coordinate of the initial "origin" relative
		// to the previous width of the slide: `0.5` means "at the middle of the slide".
		//
		// offsetX = -1 * (newWidth - initialWidth) * (newOriginXRelative - initialOriginXRelative)

		// debug('New Scale', newScaleAtCustomScaleOrigin)
		// debug('New Scale Origin Ratio', scaleOriginCoordinatesRelativeToSlideSize)
		// debug('Initial Scale', initialScaleAtInitialScaleOrigin)
		// debug('Initial Scale Origin Ratio', initialScaleOriginCoordinatesRelativeToSlideSize)

		// `initialScaleOriginCoordinatesRelativeToSlideSize` is by design always "center center": `{ x: 0.5, y: 0.5 }`.

		const offsetX = nonScaledWidth * (initialScaleAtInitialScaleOrigin - newScaleAtCustomScaleOrigin) * (scaleOriginCoordinatesRelativeToSlideSize.x - initialScaleOriginCoordinatesRelativeToSlideSize.x)
		const offsetY = nonScaledHeight * (initialScaleAtInitialScaleOrigin - newScaleAtCustomScaleOrigin) * (scaleOriginCoordinatesRelativeToSlideSize.y - initialScaleOriginCoordinatesRelativeToSlideSize.y)

		return [offsetX, offsetY]
	}

	// By default, all slides are scaled at the default "origin" point
	// which is the center of the slide — "50% 50%". The exceptions are:
	// * When scaling a slide in "Pan and Zoom" mode: in that case,
	//   the slide is scaled with the "origin" being at the mouse cursor point.
	// * When scaling a slide using "pinch-zoom" gesture: in that case,
	//   the slide is scaled with the "origin" being between the two touches.
	isScalingAtCustomOrigin = () => {
		return this.scaleOriginCoordinatesRelativeToSlideSize !== undefined
	}

	// Returns the maximum `scale` for a `slide` in order for it to still fit the screen.
	getSlideMaxScale(slide) {
		const fullScreenWidthScale = this.slideshow.getMaxAvailableSlideWidth() / this.slideshow.getSlideInitialWidth(slide)
		const fullScreenHeightScale = this.slideshow.getMaxAvailableSlideHeight() / this.slideshow.getSlideInitialHeight(slide)
		return Math.min(fullScreenWidthScale, fullScreenHeightScale)
	}

	// Won't scale down past the original 1:1 size.
	// (for non-vector images)
	getMinScaleForCurrentSlide() {
		const {
			minScaledSlideRatio,
			initialSlideIndex,
			imageElementCoords,
			minSlideScaleFactorRelativeToThumbnailSize
		} = this.props

		const { i } = this.slideshow.getState()
		const slide = this.slideshow.getCurrentSlide()
		if (i === initialSlideIndex) {
			if (imageElementCoords) {
				const slideScaleFactorRelativeToThumbnail = this.slideshow.getSlideInitialWidth(slide) / imageElementCoords.width
				return Math.min(minSlideScaleFactorRelativeToThumbnailSize / slideScaleFactorRelativeToThumbnail, 1)
			}
		}

		// if (this.getViewerForSlide().isScaleDownAllowed) {
		// 	if (!this.getViewerForSlide().isScaleDownAllowed(this.getCurrentSlide())) {
		// 		return 1
		// 	}
		// }

		const slideWidthRatio = this.slideshow.getSlideInitialWidth(slide) / this.slideshow.getMaxAvailableSlideWidth()
		const slideHeightRatio = this.slideshow.getSlideInitialHeight(slide) / this.slideshow.getMaxAvailableSlideHeight()

		// Averaged ratio turned out to work better than "min" ratio.
		// const slideRatio = Math.min(slideWidthRatio, slideHeightRatio)
		const slideRatio = (slideWidthRatio + slideHeightRatio) / 2
		return minScaledSlideRatio / slideRatio
	}

	// getFullScreenScaleAdjustmentFactor(slide = this.getCurrentSlide()) {
	// 	if (this.shouldShowCloseButton()) {
	// 		if (this.getViewerForSlide(slide).hasCloseButtonClickingIssues &&
	// 			this.getViewerForSlide(slide).hasCloseButtonClickingIssues(slide)) {
	// 			// `this.closeButton.current` is not available while at slideshow initialization time.
	// 			// const closeButtonRect = this.closeButton.current.getBoundingClientRect()
	// 			// return 1 - 2 * (closeButtonRect.top + closeButtonRect.height) / this.getSlideshowHeight()
	// 			if (this.isSmallScreen()) {
	// 				return 0.9
	// 			} else {
	// 				return 0.95
	// 			}
	// 		}
	// 	}
	// 	return 1
	// }

	startDynamicScaling = () => {
		const { scale } = this.slideshow.getState()
		this.dynamicScaleValue = scale
	}

	endDynamicScaling() {
		const { scale } = this.slideshow.getState()
		// Origin is fixed in "Pan and Zoom" mode,
		// and also when "touch-zooming".
		if (this.isScalingAtCustomOrigin()) {
			this.updateScaleOriginOffsetForNewScale(this.dynamicScaleValue)
		}
		if (this.dynamicScaleValue === scale) {
			// No need to call `.setState()`.
			// Skip it and just directly call the "on change" callback.
			// The callback is called just so that the behavior is uniform in both cases:
			// that it always calls `this.onScaleChangesSavedInState()`.
			this.onScaleChangesSavedInState()
		} else {
			this.slideshow.setState({
				scale: this.dynamicScaleValue
			})
		}
	}

	animateScale(scale) {
		const { scale: currentScale } = this.slideshow.getState()
		if (scale === currentScale) {
			return
		}
		const { scaleAnimationDuration } = this.props
		if (this.isAnimatingScale) {
			clearTimeout(this.finishScaleAnimationTimeout)
		} else {
			this.isAnimatingScale = true
			const { getSlideDOMNode } = this.props
			getSlideDOMNode().style.transition = `transform ${ms(scaleAnimationDuration)}, box-shadow ${ms(scaleAnimationDuration)}`
		}
		this.animateScaleStartedAt = Date.now()
		this.finishScaleAnimationTimeout = setTimeout(this.finishScaleAnimation, scaleAnimationDuration)
		this.setDynamicScaleValue(scale)
	}

	stopDynamicScaling = ({ shouldApplyScaleValue }) => {
		if (shouldApplyScaleValue) {
			this.endDynamicScaling()
		} else {
			// No need to apply the final dynamic scale value.
			// Skip doing that and just directly call the "on change" callback.
			// The callback is called just so that the behavior is uniform in both cases:
			// that it always calls `this.onScaleChangesSavedInState()`.
			this.onScaleChangesSavedInState()
		}
	}

	/**
	 * Stops zoom animation somewhere at arbitrary time.
	 */
	stopScaleAnimation = ({ shouldApplyScaleValue } = {}) => {
		if (this.isAnimatingScale) {
			const { getSlideDOMNode } = this.props
			const slide = this.slideshow.getCurrentSlide()
			// Get current scale of the slide.
			// Getting `scale` from `transform` in real time would return a matrix.
			// https://stackoverflow.com/questions/5603615/get-the-scale-value-of-an-element
			// const scale = getSlideDOMNode().style.transform
			const scale = getSlideDOMNode().getBoundingClientRect().width / this.slideshow.getSlideInitialWidth(slide)
			const { onScaleChange } = this.props
			// Apply the current scale in slideshow state.
			if (onScaleChange) {
				onScaleChange(scale)
			}
			this.dynamicScaleValue = scale
			// Mark scale animation as finished.
			this.finishScaleAnimation({ shouldApplyScaleValue })
			return scale
		}
	}

	finishScaleAnimation = ({ shouldApplyScaleValue = true } = {}) => {
		clearTimeout(this.finishScaleAnimationTimeout)
		this.finishScaleAnimationTimeout = undefined

		if (shouldApplyScaleValue) {
			// Reset slide's `transition` so that it doesn't play CSS transform scale animation
			// when CSS transform scale will be updated from `slideshow.state.scale` to `1`.
			this.slideshow.setSlideTransition(undefined)
		}

		this.stopDynamicScaling({ shouldApplyScaleValue })
	}

	// Resets any "dynamic" scaling that is applied to the slide.
	//
	// Scaling a slide has two phases:
	// * "Static" — when the slide is re-rendered via React's `setState({ scale })`.
	// * "Dynamic" — when the slide is zoomed by directly updating its DOM style
	//               without calling React's `setState({ scale })`.
	//
	resetDynamicScaling = () => {
		// Reset slide CSS transform.
		// `this.slideshow.resetSlideTransform()` should be called before `this.resetBoxShadowChangesForDynamicScale()`
		// because `this.resetBoxShadowChangesForDynamicScale()` resets `this.originalBoxShadow`
		// and `this.originalBoxShadow` is used in `resetSlideTransform()`
		// that is called from `this.slideshow.resetSlideTransform()`.
		this.slideshow.resetSlideTransform()
		this.resetBoxShadowChangesForDynamicScale()
		this.resetDynamicScaleValue()
		this.resetScaleOriginPoint()
	}

	onScaleChangesSavedInState = () => {
		const callback = ignoreSubsequentCalls(this.resetDynamicScaling)

		if (this.isAnimatingScale) {
			this.resetScaleAnimation()
			callback()
		}

		this.slideshow.pinchZoom.onScaleChangesSavedInState(callback)
	}

	resetBoxShadowChangesForDynamicScale = () => {
		// Reset `box-shadow`.
		const { getSlideDOMNode } = this.props
		getSlideDOMNode().style.boxShadow = this.originalBoxShadow
		this.originalBoxShadow = undefined
	}

	setDynamicScaleValue = (scale) => {
		const { onScaleChange } = this.props
		if (onScaleChange) {
			onScaleChange(scale)
		}
		this.dynamicScaleValue = scale
		this.slideshow.updateSlideTransform({
			scaleFactor: this.getScaleFactor(scale)
		})
		this.updateBoxShadowForDynamicScale(scale)
	}

	updateBoxShadowForDynamicScale = (scale) => {
		const { getSlideDOMNode } = this.props
		let boxShadow = this.originalBoxShadow
		if (!boxShadow) {
			boxShadow = this.originalBoxShadow = getBoxShadow(getSlideDOMNode())
		}
		if (boxShadow) {
			// Scaling of the `box-shadow` is inverted: when a slide is being scaled up,
			// the `box-shadow` is being scaled down so that those two scales neutralize one another
			// and the perceived `box-shadow` remains constant on screen.
			// That's because when a slide gets `transform: scale` applied to it,
			// so does its `box-shadow`.
			const boxShadowCounterScale = 1 / this.getScaleFactor(scale)
			getSlideDOMNode().style.boxShadow = scaleBoxShadow(boxShadow, boxShadowCounterScale)
		}
	}

	getZoomedInScale(scaleFactor, { restrict } = {}) {
		const { scaleStep, shouldRestrictMaxScale } = this.props
		const { scale } = this.slideshow.getState()
		return this.getScaledUpScaleValue(
			this.dynamicScaleValue || scale,
			scaleStep * scaleFactor,
			{
				restrict: restrict === false
					? false
					: (shouldRestrictMaxScale ? shouldRestrictMaxScale() : true)
			}
		)
	}

	getZoomedOutScale(scaleFactor) {
		const { scaleStep, getMinScaleForSlide } = this.props
		const { scale } = this.slideshow.getState()

		return this.getScaledDownScaleValue(
			this.dynamicScaleValue || scale,
			scaleStep * scaleFactor,
			{
				minScale: getMinScaleForSlide
					? getMinScaleForSlide(this.slideshow.getCurrentSlide())
					: true
			}
		)
	}

	willNoLongerFitTheScreenAfterScalingUp = (scaleFactor) => {
		const slide = this.slideshow.getCurrentSlide()
		// Adding `0.01`, because, for example, zoomed-in scale sometimes is
		// `1.0000000000000002` instead of `1` due to some precision factors.
		return this.getZoomedInScale(scaleFactor, { restrict: false }) > this.getSlideMaxScale(slide) + 0.01
	}

	getLatestScaleTime = () => {
		return this.latestScaleTime
	}

	resetLatestScaleTime = () => {
		this.latestScaleTime = undefined
	}

	onScaleWillChange() {
		this.slideshow.drag.stopDragInertialMovement()
		this.latestScaleTime = Date.now()
	}

	scaleUp = (scaleFactor) => {
		this.onScaleWillChange()
		this.animateScale(this.getZoomedInScale(scaleFactor))
	}

	scaleDown = (scaleFactor) => {
		this.onScaleWillChange()
		this.animateScale(this.getZoomedOutScale(scaleFactor))
	}

	scaleToggle = () => {
		this.onScaleWillChange()
		const { scale } = this.slideshow.getState()
		this.setState({
			scale: this.getToggledScaleValue(scale)
		})
	}

	getScaleFactor(scale) {
		const { scale: currentScale } = this.slideshow.getState()
		return scale / currentScale
	}

	getInitialScaleForCurrentSlide = () => {
		const slide = this.slideshow.getCurrentSlide()
		return getInitialScaleForSlide(slide, { props: this.props, isCurrentSlide: true })
	}

	// Limits `preferredScale` so that it doesn't get smaller than
	// the "min" acceptable scale and that it also doesn't exceed
	// the "max" possible scale while still fitting the screen.
	getConstrainedScaleForCurrentSlide = (preferredScale) => {
		return Math.min(
			Math.max(preferredScale, this.getMinScaleForCurrentSlide()),
			this.getSlideMaxScale(this.slideshow.getCurrentSlide())
		)
	}
}

const BOX_SHADOW_SPLIT_REGEXP = /,(?![^\(]*\))/

function scaleBoxShadow(boxShadow, scale) {
	return boxShadow.split(BOX_SHADOW_SPLIT_REGEXP).map((shadow) => {
		let colorEndsAt
		const closingBracketIndex = shadow.indexOf(')')
		if (closingBracketIndex >= 0) {
			colorEndsAt = closingBracketIndex
		} else {
			colorEndsAt = shadow.indexOf(' ') - 1
		}
		const color = shadow.slice(0, colorEndsAt + 1)
		const shadowValues = shadow.slice(colorEndsAt + 1 + ' '.length)
		const values = shadowValues.split(' ')
		let [xOffset, yOffset, blurRadius] = values.slice(0, 3).map(parseFloat).map(_ => _ * scale).map(_ => px(_))
		return `${color} ${xOffset} ${yOffset} ${blurRadius} ${values.slice(3).join(' ')}`
	}).join(', ')
}

function getBoxShadow(element) {
	const boxShadow = getComputedStyle(element).boxShadow
	if (boxShadow !== 'none') {
		return boxShadow
	}
}

/**
 * Returns a preferred initial scale for a slide depending on the slideshow element size.
 * @param  {object} slide
 * @return {number}
 */
export function getInitialScaleForSlide(slide, { props, isCurrentSlide }) {
	// This feature was used for video slides when the native `<video/>` player didn't handle
	// very low width of the player by screwing up the playback controls.
	// Chrome web browser seems to have fixed the native `<video/>` player to be "responsive" since then,
	// so this workaround seems no longer required.
	// const scale = this._getInitialScaleForSlide(slide)
	const scale = 1

	const {
		imageElementCoords,
		minSlideScaleFactorRelativeToThumbnailSize
	} = props

	if (isCurrentSlide) {
		if (imageElementCoords) {
			// If a slide's size is the same (or nearly the same) as its thumbnail size,
			// then artificially enlarge such slide, so that the user isn't confused
			// on whether they have clicked the thumbnail or not (in "hover" picture mode).
			// (unless the slide becomes too large to fit on the screen).
			const slideWidth = getSlideMaxInitialWidth(slide, props)
			const slideHeight = getSlideMaxInitialHeight(slide, props)
			const slideScaleFactorRelativeToThumbnail = slideWidth / imageElementCoords.width
			if (slideScaleFactorRelativeToThumbnail < minSlideScaleFactorRelativeToThumbnailSize) {
				const enlargeBy = minSlideScaleFactorRelativeToThumbnailSize / slideScaleFactorRelativeToThumbnail
				const enlargedWidth = slideWidth * enlargeBy
				const enlargedHeight = slideHeight * enlargeBy
				if (
					enlargedWidth <= getMaxAvailableSlideWidth(props) &&
					enlargedHeight <= getMaxAvailableSlideHeight(props)
				) {
					return Math.max(scale, enlargeBy)
				}
			}
		}
	}

	return scale
}

/**
 * Returns an initial scale for a slide.
 * If the corresponding viewer has `minInitialSizeRatioRelativeToMaxSizeAvailable` property defined,
 * the initial scale of the slide is gonna be smaller than `1`, if applicable.
 * This feature was used for video slides when the native `<video/>` player didn't handle
 * very low width of the player by screwing up the playback controls.
 * Chrome web browser seems to have fixed the native `<video/>` player to be "responsive" since then,
 * so this workaround seems no longer required.
 * @param  {Slide} slide
 * @return {number}
 */
// _getInitialScaleForSlide(slide) {
// 	const viewer = this.slideshow.getViewerForSlide(slide)
//
// 	const minInitialSizeRatioRelativeToMaxSizeAvailable = viewer.minInitialSizeRatioRelativeToMaxSizeAvailable
// 	if (!minInitialSizeRatioRelativeToMaxSizeAvailable) {
// 		return 1
// 	}
//
// 	// Maximum possible dimensions for a slide that fits into the viewport's width.
// 	const maxAvailableSlideWidth = this.slideshow.getMaxAvailableSlideWidth()
// 	const maxAvailableSlideHeight = this.slideshow.getMaxAvailableSlideHeight()
//
// 	// Maximum possible dimensions for this `slide` so that it fits into the viewport.
// 	const maxWidth = this.slideshow.getSlideInitialWidth(slide)
// 	const maxHeight = this.slideshow.getSlideInitialHeight(slide)
//
// 	// Calculate the slide's scale ratio so that it fits into the viewport.
// 	const widthRatio = maxWidth / maxAvailableSlideWidth
// 	const heightRatio = maxHeight / maxAvailableSlideHeight
// 	const ratio = Math.min(widthRatio, heightRatio)
//
// 	// Sometimes a slide is disproportionately long by one of the dimensions
// 	// resulting in it being disproportionately short by the other dimension.
// 	// Such cases could be worked around by setting the minimum allowed
// 	// ratio of a slide by any of the dimensions via
// 	// `minInitialSizeRatioRelativeToMaxSizeAvailable` property on a viewer.
// 	//
// 	// If the scale ratio required to fit the slide into the viewport as a whole
// 	// is too low then attempt make it larger until both of the slide's dimensions
// 	// start to not fit into the viewport.
// 	//
// 	if (ratio < minInitialSizeRatioRelativeToMaxSizeAvailable) {
// 		const minPreferredScale = minInitialSizeRatioRelativeToMaxSizeAvailable / ratio
// 		const maxScaleAtWhichAtLeastOneDimensionStillFits = 1 / Math.max(widthRatio, heightRatio)
// 		return Math.min(minPreferredScale, maxScaleAtWhichAtLeastOneDimensionStillFits)
// 	}
//
// 	// Otherwise, the slide fits into the viewport
// 	// so no initial scaling is required.
// 	return 1
// }

function ignoreSubsequentCalls(func) {
	let hasBeenCalled
	return () => {
		if (!hasBeenCalled) {
			hasBeenCalled = true
			func()
		}
	}
}