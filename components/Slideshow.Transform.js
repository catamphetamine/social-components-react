import { px, percent, scaleFactor as formatScaleFactor } from 'web-browser-style'

export default class SlideshowTransform {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
	}

	getFunctions() {
		return {
			setSlideTransition: this.setSlideTransition,
			setSlideTransform: this.setSlideTransform,
			getSlideTransform: this.getSlideTransform,
			updateSlideTransform: this.updateSlideTransform,
			resetSlideTransform: this.resetSlideTransform,
			getSlideshowPanTransform: this.getSlideshowPanTransform
		}
	}

	addEventListeners() {
		// Reset slide transition resetter.
		this.slideshow.onCleanUp(this.resetSlideTransitionResetTimer)
		this.slideshow.addEventListener('slideChange', this.resetSlideTransitionResetTimer)
	}

	resetSlideTransitionResetTimer = () => {
		if (this.resetSlideTransitionTimer) {
			clearTimeout(this.resetSlideTransitionTimer)
		}
	}

	setSlideTransition = (transition) => {
		this.resetSlideTransitionResetTimer()
		const { getSlideDOMNode } = this.props
		// When resetting CSS transition, sets it to "initial".
		// Setting `undefined` didn't work.
		// Setting "none" also resulted in a weird CSS value.
		getSlideDOMNode().style.transition = transition || 'initial'
	}

	setSlideTransform = (transform, transformOrigin) => {
		const { getSlideDOMNode } = this.props
		getSlideDOMNode().style.transform = transform
		getSlideDOMNode().style.transformOrigin = transformOrigin
	}

	getSlideTransform = (j, { scaleFactor, whenExitsPanAndZoomMode } = {}) => {
		// const debug = CONSOLE
		// debug('### Get Slide Transform')
		// debug('# Slide', j)
		// debug('# Scale Factor', scaleFactor)

		const DEFAULT_SCALE_ORIGIN_COORDINATES_RELATIVE_TO_SLIDE_SIZE = [0.5, 0.5]

		const isPanAndZoomMode = this.slideshow.isCurrentSlide(j) && this.slideshow.panAndZoomMode.isPanAndZoomMode() && !whenExitsPanAndZoomMode
		const isPanAndZoomModeAndScalingAtCustomOrigin = isPanAndZoomMode && this.slideshow.scale.isScalingAtCustomOrigin()

		const [
			originXRelative,
			originYRelative
		] = isPanAndZoomModeAndScalingAtCustomOrigin
			? this.slideshow.scale.getCustomScaleOriginCoordinatesRelativeToSlideSize()
			: DEFAULT_SCALE_ORIGIN_COORDINATES_RELATIVE_TO_SLIDE_SIZE

		const transformOrigin = [originXRelative, originYRelative].map(_ => percent(_)).join(' ')

		let { offsetX, offsetY } = this.slideshow.getSlideCoordinates(j, {
			whenExitsPanAndZoomMode,
			relativeToDefaultOrigin: !isPanAndZoomModeAndScalingAtCustomOrigin,
			scaleFactor
		})

		// While `scale` transition is playing, it's sub-pixel anyway,
		// so `translateX` and `translateY` can be sub-pixel too.
		// Presumably this would result in a slightly higher positioning precision.
		// Maybe noticeable, maybe not. Didn't test this specific case.
		let transform = `translateX(${px(offsetX)}) translateY(${px(offsetY)})`

		if (scaleFactor !== undefined) {
			transform += ` scale(${formatScaleFactor(scaleFactor)})`
		}

		// debug('### Transform', transform)
		// debug('### Transform Origin', transformOrigin)

		return {
			transform,
			transformOrigin
		}
	}

	updateSlideTransform = ({ scaleFactor } = {}) => {
		const {
			transform,
			transformOrigin
		} = this.getSlideTransform(this.slideshow.getCurrentSlideIndex(), { scaleFactor })

		this.setSlideTransform(transform, transformOrigin)
	}

	resetSlideTransform = () => {
		this.updateSlideTransform()
	}

	getSlideshowPanTransform = ({ slideIndex }) => {
		let offsetX = -1 * this.slideshow.getSlideshowWidth() * slideIndex
		let offsetY = 0
		if (!this.slideshow.panAndZoomMode.isPanAndZoomMode()) {
			// If `Slideshow.Drag` module has been initialized,
			// add drag offset to the offset value.
			offsetX += this.slideshow.drag.getDragOffsetX()
			offsetY += this.slideshow.drag.getDragOffsetY()
		}
		return `translate(${px(offsetX)}, ${px(offsetY)})`
	}
}