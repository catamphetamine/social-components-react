import {
	preloadImage,
	getPreferredSize,
	getFitSize
} from './Picture.js'

import {
	getMaxAvailableSlideWidth,
	getMaxAvailableSlideHeight
} from './Slideshow.Size.js'

/**
 * Preloads a picture slide.
 * `inline` property is supposed to be `false`.
 * @param  {object} slide
 * @param  {object} slideshow
 * @return {Promise}
 */
export function preloadPictureSlide(slide) {
	const props = window.SlideshowProps
	if (!props) {
		throw new Error('`window.SlideshowProps` are required when calling `preloadPictureSlide()`')
	}
	return preloadImage(getPreferredSize(
		slide.picture,
		getFitSize(
			slide.picture,
			// `inline` property is supposed to be `false`.
			getMaxAvailableSlideWidth(props),
			getMaxAvailableSlideHeight(props)
		)
	).url)
}