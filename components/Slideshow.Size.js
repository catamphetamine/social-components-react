import { getViewportWidth, getViewportHeightWithScrollbar } from 'web-browser-window'

import { getViewerForSlide } from './Slideshow.Viewer.js'

export default class SlideshowSize {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
	}

	getFunctions() {
		return {
			getSlideshowWidth: this.getSlideshowWidth,
			getSlideshowHeight: this.getSlideshowHeight,

			getMaxAvailableSlideWidth: this.getMaxAvailableSlideWidth,
			getMaxAvailableSlideHeight: this.getMaxAvailableSlideHeight,

			getSlideInitialWidth: this.getSlideMaxInitialWidth,
			getSlideInitialHeight: this.getSlideMaxInitialHeight,

			getSlideMaxWidthToFit: this.getSlideMaxWidthToFit,
			getSlideMaxHeightToFit: this.getSlideMaxHeightToFit,

			getMargin: this.getMargin
		}
	}

	getExtraMargin = () => {
		return getExtraMargin(this.props)
	}

	getSlideshowWidth = () => {
		return getSlideshowWidth(this.props)
	}

	getSlideshowHeight = () => {
		return getSlideshowHeight(this.props)
	}

	/**
	 * Returns a maximum possible width for a slide that fits into the viewport's width.
	 * Doesn't account for slide scale.
	 * @return {number}
	 */
	getMaxAvailableSlideWidth = () => {
		return getMaxAvailableSlideWidth(this.props)
	}

	/**
	 * Returns a maximum possible height for a slide that fits into the viewport's height.
	 * Doesn't account for slide scale.
	 * @return {number}
	 */
	getMaxAvailableSlideHeight = () => {
		return getMaxAvailableSlideHeight(this.props)
	}

	shouldUpscaleSmallSlides() {
		return shouldUpscaleSmallSlides(this.props)
	}

	/**
	 * Returns a maximum possible width for a `slide` so that it fits into the viewport.
	 * If upscaling slides is not allowed then it will account for that too.
	 * Doesn't account for slide scale.
	 * @param  {Slide} slide
	 * @return {number}
	 */
	getSlideMaxInitialWidth = (slide) => {
		return getSlideMaxInitialWidth(slide, this.props)
	}

	/**
	 * Returns a maximum possible height for a `slide` so that it fits into the viewport.
	 * If upscaling slides is not allowed then it will account for that too.
	 * Doesn't account for slide scale.
	 * @param  {Slide} slide
	 * @return {number}
	 */
	getSlideMaxInitialHeight = (slide) => {
		return getSlideMaxInitialHeight(slide, this.props)
	}

	getSlideMaxWidthToFit = (slide) => {
		return getSlideMaxWidthToFit(slide, this.props)
	}

	getSlideMaxHeightToFit = (slide) => {
		return getSlideMaxHeightToFit(slide, this.props)
	}

	getSlideAspectRatio(slide) {
		return getSlideAspectRatio(slide, this.props)
	}

	getSlideMaxAvailableSize(slide) {
		return getSlideMaxAvailableSize(slide, this.props)
	}

	getMargin = (edge) => {
		return getMargin(edge, this.props)
	}

	/**
	 * Scale buttons won't be shown if a slide is large enough
	 * to be considered a "max size" slide.
	 * @param  {Boolean} precise — The slide must be at least as large as one of the slideshow's dimensions.
	 * @return {Boolean} [isMaxSizeSlide]
	 */
	isMaxSizeSlide = ({ precise = true } = {}) => {
		const { isRendered, fullScreenFitPrecisionFactor } = this.props
		// No definite answer (`true` or `false`) could be
		// given until slideshow dimensions are known.
		if (!isRendered) {
			return
		}
		const fitFactor = precise ? 1 : fullScreenFitPrecisionFactor
		const slide = this.slideshow.getCurrentSlide()
		const maxSize = this.getSlideMaxAvailableSize(slide)
		return maxSize.width >= this.getMaxAvailableSlideWidth() * fitFactor ||
			maxSize.height >= this.getMaxAvailableSlideHeight() * fitFactor
	}
}

export function getSlideshowWidth(props) {
	const {
		isRendered,
		getWidth,
		inline
	} = props

	if (!inline) {
		// This won't reflect page zoom in iOS Safari,
		// but there isn't supposed to be any page zoom on mobile devices.
		return getViewportWidth()
	}

	if (isRendered() && getWidth) {
		return getWidth()
	}

	throw new Error('Slideshow not rendered')
}

export function getSlideshowHeight(props) {
	const {
		isRendered,
		getHeight,
		inline
	} = props

	if (!inline) {
		// There aren't supposed to be any horizontal scrollbars,
		// and there isn't supposed to be any page zoom on mobile devices,
		// so `getViewportHeightIncludingScaleAndScrollbar()`
		// will behave same as `getViewportHeight()`.
		// The regular `getViewportHeight()` won't work with iOS Safari's
		// auto-hide/show top/bottom bars feature.
		return getViewportHeightWithScrollbar()
	}

	if (isRendered() && getHeight) {
		return getHeight()
	}

	throw new Error('Slideshow not rendered')
}

function getMargin(edge, props) {
	const { inline, margin: marginRatio, minMargin } = props
	if (inline) {
		return 0
	}
	const extraMargin = edge ? getExtraMargin(props)[edge] || 0 : 0
	return Math.max(
		marginRatio * Math.min(
			getSlideshowWidth(props),
			getSlideshowHeight(props)
		),
		minMargin + extraMargin
	)
}

function getExtraMargin(props) {
	const {
		headerHeight,
		footerHeight
	} = props
	return {
		top: headerHeight,
		bottom: footerHeight
	}
}

function shouldUpscaleSmallSlides(props) {
	const { inline } = props
	return inline
}

export function getMaxAvailableSlideWidth(props) {
	return getSlideshowWidth(props) - getMargin('left', props) - getMargin('right', props)
}

export function getMaxAvailableSlideHeight(props) {
	return getSlideshowHeight(props) - getMargin('top', props) - getMargin('bottom', props)
}

function getSlideAspectRatio(slide, props) {
	const { viewers } = props
	return getViewerForSlide(slide, viewers).getAspectRatio(slide)
}

function getSlideMaxAvailableSize(slide, props) {
	const { viewers } = props
	return getViewerForSlide(slide, viewers).getMaxSize(slide)
}

function getSlideMaxWidthToFit(slide, props) {
	return Math.min(
		getMaxAvailableSlideHeight(props) * getSlideAspectRatio(slide, props),
		getMaxAvailableSlideWidth(props)
	)
}

export function getSlideMaxInitialWidth(slide, props) {
	return Math.min(
		getSlideMaxWidthToFit(slide, props),
		shouldUpscaleSmallSlides(props) ? Number.MAX_VALUE : getSlideMaxAvailableSize(slide, props).width
	)
}

function getSlideMaxHeightToFit(slide, props) {
	return getSlideMaxWidthToFit(slide, props) / getSlideAspectRatio(slide, props)
}

export function getSlideMaxInitialHeight(slide, props) {
	return getSlideMaxInitialWidth(slide, props) / getSlideAspectRatio(slide, props)
}