import { getViewportWidth, getViewportHeightWithScrollbar } from 'web-browser-window'

export default class SlideshowSize {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props

		this.extraMargin = {
			top: props.headerHeight,
			bottom: props.footerHeight
		}

		if (slideshow) {
			slideshow.getSlideshowWidth = this.getSlideshowWidth
			slideshow.getSlideshowHeight = this.getSlideshowHeight

			slideshow.getMaxAvailableSlideWidth = this.getMaxAvailableSlideWidth
			slideshow.getMaxAvailableSlideHeight = this.getMaxAvailableSlideHeight

			slideshow.getSlideInitialWidth = this.getSlideMaxInitialWidth
			slideshow.getSlideInitialHeight = this.getSlideMaxInitialHeight

			slideshow.getMargin = this.getMargin
		}
	}

	/**
	 * Returns a maximum possible width for a slide that fits into the viewport's width.
	 * Doesn't account for slide scale.
	 * @return {number}
	 */
	getMaxAvailableSlideWidth = () => {
		return this.getSlideshowWidth() - this.getMargin('left') - this.getMargin('right')
	}

	/**
	 * Returns a maximum possible height for a slide that fits into the viewport's height.
	 * Doesn't account for slide scale.
	 * @return {number}
	 */
	getMaxAvailableSlideHeight = () => {
		return this.getSlideshowHeight() - this.getMargin('top') - this.getMargin('bottom')
	}

	getSlideshowWidth = () => {
		const {
			isRendered,
			getWidth,
			inline
		} = this.props
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

	getSlideshowHeight = () => {
		const {
			isRendered,
			getHeight,
			inline
		} = this.props
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

	shouldUpscaleSmallSlides() {
		const { inline } = this.props
		return inline
	}

	/**
	 * Returns a maximum possible width for a `slide` so that it fits into the viewport.
	 * If upscaling slides is not allowed then it will account for that too.
	 * Doesn't account for slide scale.
	 * @param  {Slide} slide
	 * @return {number}
	 */
	getSlideMaxInitialWidth = (slide) => {
		return Math.min(
			this.getMaxAvailableSlideHeight() * this.getSlideAspectRatio(slide),
			this.getMaxAvailableSlideWidth(),
			this.shouldUpscaleSmallSlides() ? Number.MAX_VALUE : this.getSlideMaxAvailableSize(slide).width
		)
	}

	/**
	 * Returns a maximum possible height for a `slide` so that it fits into the viewport.
	 * If upscaling slides is not allowed then it will account for that too.
	 * Doesn't account for slide scale.
	 * @param  {Slide} slide
	 * @return {number}
	 */
	getSlideMaxInitialHeight = (slide) => {
		return this.getSlideMaxInitialWidth(slide) / this.getSlideAspectRatio(slide)
	}

	getSlideAspectRatio(slide) {
		return this.slideshow.getPluginForSlide(slide).getAspectRatio(slide)
	}

	getSlideMaxAvailableSize(slide) {
		return this.slideshow.getPluginForSlide(slide).getMaxSize(slide)
	}

	getMargin = (edge) => {
		const { inline, margin: marginRatio, minMargin } = this.props
		if (inline) {
			return 0
		}
		const extraMargin = edge ? this.extraMargin[edge] || 0 : 0
		return Math.max(
			marginRatio * Math.min(
				this.getSlideshowWidth(),
				this.getSlideshowHeight()
			),
			minMargin + extraMargin
		)
	}

	/**
	 * Scale buttons won't be shown if a slide is large enough
	 * to be considered a "max size" slide.
	 * @param  {Boolean} precise — The slide must be at least as large as one of the slideshow's dimensions.
	 * @return {Boolean} [isMaxSizeSlide]
	 */
	isMaxSizeSlide(precise = true) {
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

	/**
	 * Fits the slide on screen (also introduces some margins).
	 * @param  {object} slide — Slide.
	 * @param  {number} scale — Slide scale.
	 * @param  {number} originX — "Gravitate to origin" X.
	 * @param  {number} originY — "Gravitate to origin" Y.
	 * @return {number[]} [offsetX, offsetY]
	 */
	getFittedSlideOffset = (slide, scale, originX, originY) => {
		const scaledWidth = scale * this.getSlideMaxInitialWidth(slide)
		const scaledHeight = scale * this.getSlideMaxInitialHeight(slide)
		const shouldOffsetX = scaledWidth < this.getMaxAvailableSlideWidth()
		const shouldOffsetY = scaledHeight < this.getMaxAvailableSlideHeight()
		// const originX = this.getSlideshowWidth() / 2 + initialOffsetX
		// const originY = this.getSlideshowHeight() / 2 + initialOffsetY
		let offsetX = 0
		let offsetY = 0
		if (shouldOffsetX) {
			let deltaX = 0
			const left = originX - scaledWidth / 2
			const right = originX + scaledWidth / 2
			if (left < this.getMargin('left')) {
				deltaX = this.getMargin('left') - left
			}
			if (right > this.getSlideshowWidth() - this.getMargin('right')) {
				deltaX = this.getSlideshowWidth() - this.getMargin('right') - right
			}
			const targetOffsetX = originX - this.getSlideshowWidth() / 2
			offsetX = targetOffsetX + deltaX
		}
		if (shouldOffsetY) {
			let deltaY = 0
			const top = originY - scaledHeight / 2
			const bottom = originY + scaledHeight / 2
			if (top < this.getMargin('top')) {
				deltaY = this.getMargin('top') - top
			}
			if (bottom > this.getSlideshowHeight() - this.getMargin('bottom')) {
				deltaY = this.getSlideshowHeight() - this.getMargin('bottom') - bottom
			}
			const targetOffsetY = originY - this.getSlideshowHeight() / 2
			offsetY = targetOffsetY + deltaY
		}
		return [
			offsetX,
			offsetY
		]
	}
}