import { getFitSize } from './Picture.js'

import { px } from 'web-browser-style'

export default class SlideshowOpenPictureInHoverMode {
	constructor(slideshow) {
		this.slideshow = slideshow
	}

	static getInitialProps(props) {
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

	getSlideSize = () => {
		return getFitSize(
			this.slideshow.getCurrentSlide().picture,
			this.slideshow.getMaxSlideWidth(),
			this.slideshow.getMaxSlideHeight()
		)
	}

	applySlideOffset = () => {
		const { getSlideDOMNode } = this.slideshow.props
		this.slideshow.onSlideChange(() => {
			const { offsetSlideIndex } = this.slideshow.getState()
			if (offsetSlideIndex !== undefined) {
				this.slideshow.setState(NO_OFFSET_STATE)
			}
		}, { once: true })
		this.slideshow.onResize(() => {
			// // Reset slide offset on window resize.
			// getSlideDOMNode().style.transform = 'none'
			// this.slideshow.setState(NO_OFFSET_STATE)
		})
		return this.calculateAndApplySlideOffset(getSlideDOMNode())
	}

	/**
	 * @return {number[]} `[x, y]`
	 */
	applySlideOrigin() {
		const { initialSlideIndex, imageElementCoords } = this.slideshow.props
		const { x, y, width, height } = imageElementCoords
		const originX = x + width / 2
		const originY = y + height / 2
		this.slideshow.setState({
			offsetSlideIndex: initialSlideIndex,
			slideOriginX: originX,
			slideOriginY: originY
		})
		return [originX, originY]
	}

	/**
	 * @return {number[]} `[offsetX, offsetY]`
	 */
	calculateAndApplySlideOffset(slideDOMNode) {
		const [originX, originY] = this.applySlideOrigin()
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

const NO_OFFSET_STATE = {
	offsetSlideIndex: undefined,
	slideOriginX: undefined,
	slideOriginY: undefined
}