import { getFitSize } from './Picture.js'

import { px } from 'web-browser-style'

export default class SlideshowOpenPictureInHoverMode {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
	}

	resetSlideOffsetState() {
		this.slideshow.setState({
			slideWithCustomOffsetIndex: undefined,
			slideWithCustomOffsetOriginX: undefined,
			slideWithCustomOffsetOriginY: undefined
		})
	}

	cleanUp = () => {
		if (this.resetSlideOffset) {
			this.resetSlideOffset()
			this.resetSlideOffset = undefined
		}
		if (this.isSlideOffsetApplied()) {
			this.resetSlideOffsetState()
		}
	}

	isSlideOffsetApplied() {
		const { slideWithCustomOffsetIndex } = this.slideshow.getState()
		return slideWithCustomOffsetIndex !== undefined
	}

	getSlideSize = () => {
		return getFitSize(
			this.slideshow.getCurrentSlide().picture,
			this.slideshow.getMaxAvailableSlideWidth(),
			this.slideshow.getMaxAvailableSlideHeight()
		)
	}

	applySlideOffset = () => {
		const { getSlideDOMNode } = this.props

		// this.slideshow.onResize(() => {
		// 	// // Reset slide offset on window resize.
		// 	// getSlideDOMNode().style.transform = 'none'
		// 	// this.slideshow.setState(NO_SLIDE_OFFSET_STATE)
		// })

		return this.calculateAndApplySlideOffset(getSlideDOMNode())
	}

	/**
	 * @return {number[]} `[x, y]`
	 */
	updateSlideOffset() {
		const { initialSlideIndex, imageElementCoords } = this.props
		const { x, y, width, height } = imageElementCoords
		const originX = x + width / 2
		const originY = y + height / 2
		this.slideshow.setState({
			slideWithCustomOffsetIndex: initialSlideIndex,
			slideWithCustomOffsetOriginX: originX,
			slideWithCustomOffsetOriginY: originY
		})
		return { originX, originY }
	}

	/**
	 * @return {number[]} `[offsetX, offsetY]`
	 */
	calculateAndApplySlideOffset(slideDOMNode) {
		const { originX, originY } = this.updateSlideOffset()
		const slideCoords = slideDOMNode.getBoundingClientRect()
		const [slideOffsetX, slideOffsetY] = calculateSlideOffset(
			originX,
			originY,
			slideCoords.x,
			slideCoords.y,
			slideCoords.width,
			slideCoords.height,
			this.slideshow.getSlideshowWidth(),
			this.slideshow.getSlideshowHeight(),
			this.slideshow.getMargin
		)
		slideDOMNode.style.transform = `translateX(${px(slideOffsetX)}) translateY(${px(slideOffsetY)})`
		this.resetSlideOffset = () => {
			slideDOMNode.style.transform = 'none'
		}
		return [slideOffsetX, slideOffsetY]
	}
}

function calculateSlideOffset(
	originX,
	originY,
	slideXWhenCentered,
	slideYWhenCentered,
	slideWidth,
	slideHeight,
	slideshowWidth,
	slideshowHeight,
	getMargin
) {
	const [slideX, slideY] = calculateSlideCoordinates(
		originX,
		originY,
		slideWidth,
		slideHeight,
		slideshowWidth,
		slideshowHeight,
		getMargin
	)
	// Calculating slide coordinates like this results
	// in a buggy behavior in iOS Safari and Chrome,
	// presumably because their `getViewportHeight()`
	// returns some incorrect values due to the
	// appearing/disappearing top/bottom panels,
	// or maybe their fullscreen flex align center
	// positioning is different from `getViewportHeight() / 2`
	// because of the same reason.
	// const slideXWhenCentered = (slideshowWidth - slideWidth) / 2
	// const slideYWhenCentered = (slideshowHeight - slideHeight) / 2
	const slideOffsetX = slideX - slideXWhenCentered
	const slideOffsetY = slideY - slideYWhenCentered
	// // Round coordinates. // upto 4 decimal place.
	// // Small numbers could be printed as `1.2345e-50` unless rounded.
	return [
		slideOffsetX,
		slideOffsetY
	]
}

export function calculateSlideCoordinates(
	originX,
	originY,
	slideWidth,
	slideHeight,
	slideshowWidth,
	slideshowHeight,
	getMargin
) {
	let slideX = originX - slideWidth / 2
	let slideY = originY - slideHeight / 2
	if (slideX < getMargin('left')) {
		slideX = getMargin('left')
	}
	if (slideX + slideWidth > slideshowWidth - getMargin('right')) {
		slideX = (slideshowWidth - getMargin('right')) - slideWidth
	}
	if (slideY < getMargin('top')) {
		slideY = getMargin('top')
	}
	if (slideY + slideHeight > slideshowHeight - getMargin('bottom')) {
		slideY = (slideshowHeight - getMargin('bottom')) - slideHeight
	}
	return [slideX, slideY]
}

export function transformInitialProps(props) {
	// Get `imageElement`.
	let { imageElement } = props
	if (imageElement) {
		if (imageElement.tagName.toLowerCase() !== 'img') {
			imageElement = imageElement.querySelector('img')
		}
	}
	// All pictures (including animated GIFs) are opened above their thumbnails.
	const { initialSlideIndex, slides, openPictureInHoverMode } = props
	return {
		...props,
		imageElement,
		imageElementCoords: imageElement && imageElement.getBoundingClientRect(),
		openPictureInHoverMode: openPictureInHoverMode && imageElement && slides[initialSlideIndex].type === 'picture'
	}
}