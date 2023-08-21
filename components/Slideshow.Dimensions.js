export default class SlideshowDimensions {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
	}

	getFunctions() {
		return {
			getSlideCoordinates: this.getSlideCoordinates,
			getCoordinatesRelativeToSlideSize: this.getCoordinatesRelativeToSlideSize,
			getBaseOffsetForSlide: this.getBaseOffsetForSlide
		}
	}

	getSlideCoordinates = (j, {
		scaleFactor,
		whenExitsPanAndZoomMode = false,
		relativeToDefaultOrigin = true,
		validate = false
	} = {}) => {
		// const debug = CONSOLE
		// debug('### Get Slide Coordinates')

		let { scale } = this.slideshow.getState()
		if (scaleFactor !== undefined) {
			// debug('Scale factor', scaleFactor)
			scale *= scaleFactor
		}
		// debug('Scale', scale)

		const slide = this.slideshow.getSlide(j)
		const width = this.slideshow.getSlideInitialWidth(slide) * scale
		const height = this.slideshow.getSlideInitialHeight(slide) * scale
		// debug('Default width', this.slideshow.getSlideInitialWidth(slide))
		// debug('Width', width)

		const inPanAndZoomMode = this.slideshow.isCurrentSlide(j) && this.slideshow.panAndZoomMode.isPanAndZoomMode() && !whenExitsPanAndZoomMode

		let offsetX = 0
		let offsetY = 0

		if (inPanAndZoomMode) {
			const [dx, dy] = this.slideshow.panAndZoomMode.getCurrentSlideOffsetInPanAndZoomMode({
				forUseWithDefaultOrigin: relativeToDefaultOrigin
			})
			offsetX += dx
			offsetY += dy
		} else {
			const [dx, dy] = this.getBaseOffsetForSlide(j, {
				scaleFactor,
				whenExitsPanAndZoomMode
			})
			offsetX += dx
			offsetY += dy
			// debug('Default offset', offsetX, offsetY)
		}

		const result = {
			x: (this.slideshow.getSlideshowWidth() - width) / 2 + offsetX,
			y: (this.slideshow.getSlideshowHeight() - height) / 2 + offsetY,
			width,
			height,
			offsetX,
			offsetY
		}

		// debug('### Slide coordinates:',
		// 	'x', result.x + ',',
		// 	'y', result.y + ',',
		// 	'width', width + ',',
		// 	'height', height + ',',
		// 	'offsetX', offsetX + ',',
		// 	'offsetY', offsetY
		// )

		if (validate) {
			this.validateSlideCoordinates(result)
		}

		return result
	}

	/**
	 * Just debugging `getSlideCoordinates()` function.
	 * @param  {object} rect — `getSlideCoordinates()` function result.
	 */
	validateSlideCoordinates(rect) {
		// const debug = CONSOLE
		const { getSlideDOMNode } = this.props
		const rect2 = getSlideDOMNode().getBoundingClientRect()
		function differs(a, b) {
			return Math.abs(a - b) > 1
		}
		if (differs(rect.x, rect2.x) || differs(rect.y, rect2.y) || differs(rect.width, rect2.width) || differs(rect.height, rect2.height)) {
			// debug('% Calculated:', rect)
			// debug('% DOM:', rect2)
			throw new Error('different coordinates')
		}
	}

	getCoordinatesRelativeToSlideSize = (x, y) => {
		const { i } = this.slideshow.getState()
		const {
			x: slideTopLeftX,
			y: slideTopLeftY,
			width,
			height
		} = this.getSlideCoordinates(i)
		return {
			x: (x - slideTopLeftX) / width,
			y: (y - slideTopLeftY) / height
		}
	}

	// Returns "base" offset for a slide.
	// * Pass `scaleFactor` parameter to find out the "base" offset of a slide
	//   as it should be after it finishes its scale animation.
	// * Pass `whenExitsPanAndZoomMode` to find out the "base" offset of a slide
	//   as it should be after it finishes its animation of exiting "Pan and Zoom" mode.
	getBaseOffsetForSlide = (i, { scaleFactor, whenExitsPanAndZoomMode } = {}) => {
		const { slideWithCustomOffsetIndex } = this.slideshow.getState()

		if (slideWithCustomOffsetIndex === i) {
			const {
				scale,
				slideWithCustomOffsetOriginX,
				slideWithCustomOffsetOriginY
			} = this.slideshow.getState()

			// When not calculating the "base" offset of the slide for "Pan and Zoom" mode,
			// when the slide size doesn't exceed the screen size (minus the margin)
			// but at the same time it doesn't fit entirely on the screen because of its "custom" offset,
			// it will attempt to reposition the slide so that it fits entirely on the screen.
			let canRepositionTheSlide = true
			const inPanAndZoomMode = this.slideshow.isCurrentSlide(i) && this.slideshow.panAndZoomMode.isPanAndZoomMode() && !whenExitsPanAndZoomMode
			if (inPanAndZoomMode) {
				canRepositionTheSlide = false
			}

			if (canRepositionTheSlide) {
				const slide = this.slideshow.getSlide(i)
				const scale_ = scale * (scaleFactor || 1)
				if (this.wouldFit(slide, { scale: scale_ })) {
					return this.getOffsetForSlideSoThatItFitsBetter(slide, {
						scale: scale_,
						preferredOriginX: slideWithCustomOffsetOriginX,
						preferredOriginY: slideWithCustomOffsetOriginY
					})
				}
			}

			// Calculate slideshow center point coordinates.
			// Slideshow center is the default "origin" for rendering the center of the slide.
			const [defaultOriginX, defaultOriginY] = this.getDefaultOriginForAnySlide()

			return [
				slideWithCustomOffsetOriginX - defaultOriginX,
				slideWithCustomOffsetOriginY - defaultOriginY
			]
		}

		return [0, 0]
	}

	getDefaultOriginForAnySlide() {
		// Calculate slideshow center point coordinates.
		// Slideshow center is the default "origin" for rendering the center of the slide.
		const originX = this.slideshow.getSlideshowWidth() / 2
		const originY = this.slideshow.getSlideshowHeight() / 2

		return [originX, originY]
	}

	wouldFit(slide, { scale }) {
		// `roundToTwoFractionalDigits()` fixes weird number precision anomalies
		// when it returns `false` in cases when `scaledWidth` is `1021.7777777777778`
		// and `maxFittingSizeScaledWidth` is `1021.7777777777777`.

		const scaledWidth = roundToTwoFractionalDigits(scale * this.slideshow.getSlideInitialWidth(slide))
		const scaledHeight = roundToTwoFractionalDigits(scale * this.slideshow.getSlideInitialHeight(slide))

		// Accounts for margins.
		const maxFittingSizeScaledWidth = roundToTwoFractionalDigits(this.slideshow.getSlideMaxWidthToFit(slide))
		const maxFittingSizeScaledHeight = roundToTwoFractionalDigits(this.slideshow.getSlideMaxHeightToFit(slide))

		// See if it fits horizontally and vertically. Accounts for margins.
		const fitsHorizontallyBeingScaled = scaledWidth <= maxFittingSizeScaledWidth
		const fitsVerticallyBeingScaled = scaledHeight <= maxFittingSizeScaledHeight

		return fitsHorizontallyBeingScaled && fitsVerticallyBeingScaled
	}

	/**
	 * Returns the offset X / Y that could be set on a `slide` scaled at `scale`
	 * in order for it to fit better on the screen (also accounts for screen margins).
	 * @param  {object} slide — Slide.
	 * @param  {number} options.scale — Slide scale.
	 * @param  {number} options.preferredOriginX — X coordinate of the point at which the center of the slide would be preferred to be placed.
	 * @param  {number} options.preferredOriginY — Y coordinate of the point at which the center of the slide would be preferred to be placed.
	 * @return {number[]} [offsetX, offsetY]
	 */
	getOffsetForSlideSoThatItFitsBetter = (slide, { scale, preferredOriginX, preferredOriginY }) => {
		const scaledWidth = scale * this.slideshow.getSlideInitialWidth(slide)
		const scaledHeight = scale * this.slideshow.getSlideInitialHeight(slide)

		// Accounts for margins.
		const maxFittingSizeScaledWidth = this.slideshow.getSlideMaxWidthToFit(slide)
		const maxFittingSizeScaledHeight = this.slideshow.getSlideMaxHeightToFit(slide)

		const maxFittingScaleX = this.slideshow.getMaxAvailableSlideWidth() / maxFittingSizeScaledWidth
		const maxFittingScaleY = this.slideshow.getMaxAvailableSlideHeight() / maxFittingSizeScaledHeight

		// Calculate slideshow center point coordinates.
		// Slideshow center is the default "origin" for rendering the center of the slide.
		const [defaultOriginX, defaultOriginY] = this.getDefaultOriginForAnySlide()

		// Suppose the slide is in a "landscape" mode (width > height).
		//
		// Offset `x: 0` means "place the slide at the origin".
		// Offset `preferredOriginX - defaultOriginX` means "place the slide at the preferred origin".
		// As the slide gets scaled, while it still fits into the screen, its offset
		// changes linearly from `preferredOriginX - defaultOriginX` to `0`.
		// It becomes `0` when the slide becomes as large as the available width or height.
		// Past that scale, offset for that axis is `0`.
		//
		// The corresponding offset `y` would also linearly change from
		// `preferredOriginY - defaultOriginY` to some non-zero value
		// because the offset `y` "freezes" when offset `x` does.
		// Because offset `x` gets to `0` faster than offset `y`,
		// offset `y` freezes at some non-zero value corresponding
		// to the maximum fitting size of the slide.

		const calculateOffsetXWhenFits = (scaledWidth) => {
			let offsetX = preferredOriginX - defaultOriginX

			let deltaX = 0
			// Calculate the coordinates of left and right edges of the slide.
			const left = preferredOriginX - scaledWidth / 2
			const right = preferredOriginX + scaledWidth / 2
			// If the left edge of the slide bleeds onto the left margin,
			// shift the slide a bit to the right so that it doesn't bleed onto the left margin.
			if (left < this.slideshow.getMargin('left')) {
				deltaX = this.slideshow.getMargin('left') - left
			}
			// If the right edge of the slide bleeds onto the right margin,
			// shift the slide a bit to the left so that it doesn't bleed onto the right margin.
			else if (right > this.slideshow.getSlideshowWidth() - this.slideshow.getMargin('right')) {
				deltaX = this.slideshow.getSlideshowWidth() - this.slideshow.getMargin('right') - right
			}
			offsetX += deltaX

			return offsetX
		}

		const calculateOffsetYWhenFits = (scaledHeight) => {
			let offsetY = preferredOriginY - defaultOriginY

			let deltaY = 0
			// Calculate the coordinates of top and bottom edges of the slide.
			const top = preferredOriginY - scaledHeight / 2
			const bottom = preferredOriginY + scaledHeight / 2
			// If the top edge of the slide bleeds onto the top margin,
			// shift the slide a bit lower so that it doesn't bleed onto the top margin.
			if (top < this.slideshow.getMargin('top')) {
				deltaY = this.slideshow.getMargin('top') - top
			}
			// If the bottom edge of the slide bleeds onto the bottom margin,
			// shift the slide a bit higher so that it doesn't bleed onto the bottom margin.
			else if (bottom > this.slideshow.getSlideshowHeight() - this.slideshow.getMargin('bottom')) {
				deltaY = this.slideshow.getSlideshowHeight() - this.slideshow.getMargin('bottom') - bottom
			}
			offsetY += deltaY

			return offsetY
		}

		if (this.wouldFit(slide, { scale })) {
			return [
				calculateOffsetXWhenFits(scaledWidth),
				calculateOffsetYWhenFits(scaledHeight)
			]
		}

		return [
			preferredOriginX - defaultOriginX,
			preferredOriginY - defaultOriginY
		]
	}

	// wasInsideSlide(event) {
	// 	const { x, y } = this.getClickXYInSlideCoordinates(event)
	// 	return x >= 0 && x <= 1 && y >= 0 && y <= 1
	// }

	// getClickXYInSlideCoordinates(event) {
	// 	const { scale } = this.slideshow.getState()
	//
	// 	const deltaWidth = this.getSlideshowWidth() - this.getCurrentSlideMaxWidth() * scale
	// 	const deltaHeight = this.getSlideshowHeight() - this.getCurrentSlideMaxHeight() * scale
	//
	// 	// Calculate normalized (from 0 to 1) click position relative to the slide.
	// 	const x = (event.clientX - deltaWidth / 2) / (this.getCurrentSlideMaxWidth() * scale)
	// 	const y = (event.clientY - deltaHeight / 2) / (this.getCurrentSlideMaxHeight() * scale)
	//
	// 	return { x, y }
	// }
}

// https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
// "I found this on MDN. Their way avoids the problem with 1.005 that was mentioned."
function roundToTwoFractionalDigits(number) {
	return +(Math.round(number + 'e+2')  + 'e-2')
}