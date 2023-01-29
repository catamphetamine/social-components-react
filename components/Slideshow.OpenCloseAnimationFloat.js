// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import { px, scaleFactor, ms } from 'web-browser-style'

// For expand animation, in `PostAttachment.js`, in `onClick`,
// after `setIsLoading(false)` (still before opening the slideshow):
// import { openTransition } from './Slideshow.OpenCloseAnimationFade'
// await openTransition(attachment.picture, thumbnailElement.current)

import { getFitSize, getPreferredSize, TRANSPARENT_PIXEL } from './Picture.js'
import { calculateSlideCoordinates } from './Slideshow.OpenPictureInHoverMode.js'

import triggerDomElementRender from '../utility/triggerDomElementRender.js'

const OPEN_ANIMATION_LOGARITHM_FACTOR = 5
const OPEN_ANIMATION_PIXELS_PER_SECOND = 2500 // `getViewportWidth()` doesn't play with mobile devices: too slow.

const ANIMATION_MIN_DURATION = 120

// This is a workaround for browsers not playing a CSS transition.
const CSS_TRANSITION_DELAY = 30

const SCALE_PRECISION = 3

export default class SlideshowOpenCloseAnimationFloat {
	constructor(slideshow) {
		this.slideshow = slideshow
		slideshow.onCleanUp(this.cleanUp)
	}

	cleanUp = () => {
		clearTimeout(this.openingAnimationTimeout)
		clearTimeout(this.closingAnimationTimeout)
	}

	/**
	 * Can be called when slideshow opens.
	 * @return {Promise}
	 */
	onOpen(slideElement, {
		imageElement: thumbnailElement
	}) {
		const slide = this.slideshow.getCurrentSlide()
		// const [slideWidth, slideHeight] = this.getSlideSize()
		const slideCoords = slideElement.getBoundingClientRect()
		const slideX = slideCoords.x
		const slideY = slideCoords.y
		const slideWidth = slideCoords.width
		const slideHeight = slideCoords.height
		const {
			animationDuration,
			promise,
			timeout
		} = openTransition(
			getPreferredSize(slide.picture, slideWidth).url,
			thumbnailElement,
			slideX,
			slideY,
			slideWidth,
			slideHeight,
			this.slideshow.getSlideshowWidth(),
			this.slideshow.getSlideshowHeight(),
			this.slideshow.getMargin,
			this.slideshow.getContainerDOMNode()
		)
		this.openingAnimationTimeout = timeout
		slideElement.style.opacity = 0
		return {
			animationDuration,
			promise: promise.then(() => {
				// { clearThumbnailOverlay }
				// clearThumbnailImageOverlay.current = clearThumbnailOverlay
				slideElement.style.opacity = 1
			})
		}
	}

	/**
	 * Can be called when slideshow closes.
	 * @return {Promise}
	 */
	onClose(slideElement, {
		imageElement: thumbnailElement,
		slideImage
	}) {
		const {
			animationDuration,
			promise,
			timeout
		} = closeTransition(
			thumbnailElement,
			slideElement,
			slideImage,
			this.slideshow.size.getSlideMaxWidth(this.slideshow.getCurrentSlide()),
			this.slideshow.size.getSlideMaxHeight(this.slideshow.getCurrentSlide()),
			this.slideshow.getContainerDOMNode()
		)
		this.closingAnimationTimeout = timeout
		slideElement.style.opacity = 0
		return {
			animationDuration,
			promise
		}
	}

	getSlideSize = () => {
		return getFitSize(
			this.slideshow.getCurrentSlide().picture,
			this.slideshow.getMaxSlideWidth(),
			this.slideshow.getMaxSlideHeight()
		)
	}
}

/**
 * Zooms in on opening an image in Slideshow.
 * @param  {String} expandedPictureUrl
 * // @param  {object} picture
 * @param  {Element} thumbnailElement
 * // @param  {Element} [expandedImageElement] — Will be hidden until the animation finishes.
 * @param  {Element} containerDOMNode — The container DOM element of the Slideshow. Floating `<img/>` elements will be added to it and then removed from it.
 * @return {Promise}
 */
function openTransition(
	// picture,
	expandedPictureUrl,
	thumbnailElement,
	// expandedImageElement,
	slideX,
	slideY,
	slideWidth,
	slideHeight,
	slideshowWidth,
	slideshowHeight,
	getMargin,
	containerDOMNode
) {
	const imageElementCoords = thumbnailElement.getBoundingClientRect()
	const thumbnailWidth = thumbnailElement.width
	const thumbnailHeight = thumbnailElement.height
	const thumbnailX = imageElementCoords.left
	const thumbnailY = imageElementCoords.top

	// Calculating slide coordinates like this results
	// in a buggy behavior in iOS Safari and Chrome,
	// presumably because their `getViewportHeight()`
	// returns some incorrect values due to the
	// appearing/disappearing top/bottom panels,
	// or maybe their fullscreen flex align center
	// positioning is different from `getViewportHeight() / 2`
	// because of the same reason.
	// const [slideX, slideY] = calculateSlideCoordinates(
	// 	imageElementCoords,
	// 	slideWidth,
	// 	slideHeight,
	// 	slideshowWidth,
	// 	slideshowHeight,
	// 	getMargin
	// )

	// const travelDistanceTopLeft = calculateDistance(
	// 	thumbnailX,
	// 	thumbnailY,
	// 	slideX,
	// 	slideY
	// )

	// const travelDistanceTopRight = calculateDistance(
	// 	thumbnailX + thumbnailWidth,
	// 	thumbnailY,
	// 	slideX + slideWidth,
	// 	slideY
	// )

	// const travelDistanceBottomLeft = calculateDistance(
	// 	thumbnailX,
	// 	thumbnailY + thumbnailHeight,
	// 	slideX,
	// 	slideY + slideHeight
	// )

	// const travelDistanceBottomRight = calculateDistance(
	// 	thumbnailX + thumbnailWidth,
	// 	thumbnailY + thumbnailHeight,
	// 	slideX + slideWidth,
	// 	slideY + slideHeight
	// )

	// const travelDistance = (
	// 	travelDistanceTopLeft +
	// 	travelDistanceTopRight +
	// 	travelDistanceBottomLeft +
	// 	travelDistanceBottomRight
	// ) / 4

	// let animationDuration = travelDistance / OPEN_ANIMATION_PIXELS_PER_SECOND
	// animationDuration = ANIMATION_MIN_DURATION + 1000 * Math.log(1 + animationDuration * OPEN_ANIMATION_LOGARITHM_FACTOR) / OPEN_ANIMATION_LOGARITHM_FACTOR

	let animationDuration = Math.max(slideWidth - thumbnailWidth, slideHeight - thumbnailHeight) / OPEN_ANIMATION_PIXELS_PER_SECOND
	animationDuration = ANIMATION_MIN_DURATION + 1000 * Math.log(1 + animationDuration * 1) / 1
	// Round intervals like "123.456789ms" to "123ms".
	animationDuration = Math.round(animationDuration)

	// Create `addElement()` and `removeElement()` functions.
	let containerElement = containerDOMNode
	if (!containerElement) {
		console.error('[Slideshow.OpenCloseAnimationFloat] Slideshow container DOM Element not found. Using `<body/>` instead.')
		containerElement = document.body
	}
	const addElement = (element) => prependElement(containerElement, element)
	const removeElement = (element) => containerElement.removeChild(element)

	// thumbnailElement.style.opacity = 0.25

	// thumbnailElement.parentNode.style.position = 'relative'

	// const thumbnailImagePlaceholder = document.createElement('div')
	// // "position: fixed" gets in the way of floating headers.
	// // thumbnailImagePlaceholder.style.position = 'fixed'
	// // thumbnailImagePlaceholder.style.left = px(thumbnailX)
	// // thumbnailImagePlaceholder.style.top = px(thumbnailY)
	// thumbnailImagePlaceholder.style.position = 'absolute'
	// thumbnailImagePlaceholder.style.left = '0'
	// thumbnailImagePlaceholder.style.top = '0'
	// thumbnailImagePlaceholder.style.width = px(thumbnailWidth)
	// thumbnailImagePlaceholder.style.height = px(thumbnailHeight)
	// thumbnailImagePlaceholder.style.backgroundColor = 'var(--Picture-borderColor--focus)'
	// thumbnailImagePlaceholder.style.opacity = 0.35
	// thumbnailElement.parentNode.appendChild(thumbnailImagePlaceholder)

	// A copy of thumbnail image is created and animated
	// along with the expanded image, because without it
	// the sudden transition between the thumbnail and
	// the scaled down expanded image would be noticeable
	// with the thumbnail being more blurry and the
	// scaled down expanded image being more sharp.
	const thumbnailImageCopy = document.createElement('img')
	thumbnailImageCopy.width = thumbnailWidth
	thumbnailImageCopy.height = thumbnailHeight
	thumbnailImageCopy.src = thumbnailElement.src
	thumbnailImageCopy.style.transform = getTranslateXY(thumbnailX, thumbnailY)
	thumbnailImageCopy.style.transformOrigin = 'top left'
	// `position: fixed` was used when appending this DOM Element to `<body/>`.
	// Not this DOM Element is prepended to the slideshow container DOM Element instead.
	// expandedImage.style.position = 'fixed'
	thumbnailImageCopy.style.position = 'absolute'
	thumbnailImageCopy.style.left = '0'
	thumbnailImageCopy.style.top = '0'
	thumbnailImageCopy.style.transition = `transform ${ms(animationDuration)}`

	addElement(thumbnailImageCopy)

	// if (expandedImageElement) {
	// 	expandedImageElement.style.opacity = 0
	// }

	// A copy of the current slide image is created
	// and animated, because it's animated along with
	// the copy of the thumbnail image.
	// If the current slide image was animated directly
	// then it would be unobvious how to set up the correct
	// `z-index`es so that the expanded image is shown
	// above the thumbnail image copy.
	// By creating a copy of the current slide image
	// `z-index`es are automatically correct
	// (both elements are appended to `<body/>`).
	const expandedImage = document.createElement('img')
	expandedImage.width = slideWidth
	expandedImage.height = slideHeight
	expandedImage.src = expandedPictureUrl // expandedPictureSize.url
	expandedImage.style.transform =
		getScaleXY(
			thumbnailWidth / slideWidth,
			thumbnailHeight / slideHeight
		) + ' ' +
		getTranslateXY(
			thumbnailX * (slideWidth / thumbnailWidth),
			thumbnailY * (slideHeight / thumbnailHeight)
		)
	expandedImage.style.transformOrigin = 'top left'
	// `position: fixed` was used when appending this DOM Element to `<body/>`.
	// Not this DOM Element is prepended to the slideshow container DOM Element instead.
	// expandedImage.style.position = 'fixed'
	expandedImage.style.position = 'absolute'
	expandedImage.style.left = '0'
	expandedImage.style.top = '0'
	// `z-index: var(--Slideshow-zIndex)` was used when appending this DOM Element to `<body/>`.
	// Not this DOM Element is prepended to the slideshow container DOM Element instead.
	// expandedImage.style.zIndex = 'var(--Slideshow-zIndex)'
	expandedImage.style.opacity = 0
	expandedImage.style.boxShadow = 'var(--Slideshow-Slide-boxShadow)'
	expandedImage.style.transition = `transform ${ms(animationDuration)}, box-shadow ${ms(animationDuration)}, opacity ${ms(ANIMATION_MIN_DURATION)}`

	addElement(expandedImage)

	// Run CSS transitions.
	triggerDomElementRender(expandedImage)
	triggerDomElementRender(thumbnailImageCopy)
	expandedImage.style.opacity = 1
	expandedImage.style.transform = getTranslateXY(slideX, slideY)
	thumbnailImageCopy.style.transform =
		getScaleXY(
			slideWidth / thumbnailWidth,
			slideHeight / thumbnailHeight
		) + ' ' +
		getTranslateXY(
			slideX * (thumbnailWidth / slideWidth),
			slideY * (thumbnailHeight / slideHeight)
		)
	let timeout
	const promise = new Promise((resolve) => {
		timeout = setTimeout(() => {
			removeElement(thumbnailImageCopy)
			// if (expandedImageElement) {
				removeElement(expandedImage)
			// }
			resolve()
			// resolve({
			// 	clearThumbnailOverlay: () => thumbnailElement.parentNode.removeChild(thumbnailImagePlaceholder)
			// })
		}, animationDuration)
	})

	return {
		animationDuration,
		promise,
		timeout
	}
}

/**
 * Zooms out on closing an image in Slideshow.
 * @param  {Element} thumbnailElement — The `<img/>` element the user clicked on to open the slideshow.
 * @param  {Element} slideElement — Slideshow `<Picture/>` DOM element.
 * @param  {Element} slideImage — The `<img/>` element inside `slideElement`.
 * @param  {number} maxSlideWidth — The maximum width of a non-zoomed-in slide.
 * @param  {number} maxSlideHeight — The maximum height of a non-zoomed-in slide.
 * @param  {Element} containerDOMNode — The container DOM element of the Slideshow. Floating `<img/>` elements will be added to it and then removed from it.
 * @return {Promise}
 */
function closeTransition(
	thumbnailElement,
	slideElement,
	slideImage,
	maxSlideWidth,
	maxSlideHeight,
	containerDOMNode
) {
	const imageElementCoords = thumbnailElement.getBoundingClientRect()
	const thumbnailWidth = thumbnailElement.width
	const thumbnailHeight = thumbnailElement.height
	const thumbnailX = imageElementCoords.left
	const thumbnailY = imageElementCoords.top

	const slideCoords = slideElement.getBoundingClientRect()
	const slideWidth = slideCoords.width
	const slideHeight = slideCoords.height
	const slideX = slideCoords.left
	const slideY = slideCoords.top

	const fromWidth = Math.min(maxSlideWidth, slideWidth)
	const fromHeight = Math.min(maxSlideHeight, slideHeight)

	const pixelDifference = Math.max(
		fromWidth - thumbnailWidth,
		fromHeight - thumbnailHeight
	)
	let animationDuration = pixelDifference / OPEN_ANIMATION_PIXELS_PER_SECOND
	animationDuration = ANIMATION_MIN_DURATION + 1000 * Math.log(1 + animationDuration * 1) / 1
	// Round intervals like "123.456789ms" to "123ms".
	animationDuration = Math.round(animationDuration)

	// Create `addElement()` and `removeElement()` functions.
	let containerElement = containerDOMNode
	if (!containerElement) {
		console.error('[Slideshow.OpenCloseAnimationFloat] Slideshow container DOM Element not found. Using `<body/>` instead.')
		containerElement = document.body
	}
	const addElement = (element) => prependElement(containerElement, element)
	const removeElement = (element) => containerElement.removeChild(element)

	const thumbnailImageCopy = document.createElement('img')
	thumbnailImageCopy.width = thumbnailWidth
	thumbnailImageCopy.height = thumbnailHeight
	thumbnailImageCopy.src = thumbnailElement.src
	thumbnailImageCopy.style.transform =
		getScaleXY(
			slideWidth / thumbnailWidth,
			slideHeight / thumbnailHeight
		) + ' ' +
		getTranslateXY(
			slideX * (thumbnailWidth / slideWidth),
			slideY * (thumbnailHeight / slideHeight)
		)
	thumbnailImageCopy.style.transformOrigin = 'top left'
	// `position: fixed` was used when appending this DOM Element to `<body/>`.
	// Not this DOM Element is prepended to the slideshow container DOM Element instead.
	// thumbnailImageCopy.style.position = 'fixed'
	thumbnailImageCopy.style.position = 'absolute'
	thumbnailImageCopy.style.left = '0'
	thumbnailImageCopy.style.top = '0'
	thumbnailImageCopy.style.transition = `transform ${ms(animationDuration)}`

	addElement(thumbnailImageCopy)

	const expandedImage = document.createElement('img')
	expandedImage.width = slideWidth
	expandedImage.height = slideHeight
	expandedImage.src = slideImage ? slideImage.src : TRANSPARENT_PIXEL
	expandedImage.style.transform = getTranslateXY(slideX, slideY)
	expandedImage.style.transformOrigin = 'top left'
	// `position: fixed` was used when appending this DOM Element to `<body/>`.
	// Not this DOM Element is prepended to the slideshow container DOM Element instead.
	// expandedImage.style.position = 'fixed'
	expandedImage.style.position = 'absolute'
	expandedImage.style.left = '0'
	expandedImage.style.top = '0'
	// `z-index: var(--Slideshow-zIndex)` was used when appending this DOM Element to `<body/>`.
	// Not this DOM Element is prepended to the slideshow container DOM Element instead.
	// expandedImage.style.zIndex = 'var(--Slideshow-zIndex)'
	expandedImage.style.opacity = 1
	// `backgroundColor` is required for transparent PNGs
	// and also for cases when `slideImage` is not defined.
	expandedImage.style.backgroundColor = 'var(--Slideshow-Slide-backgroundColor)'
	expandedImage.style.boxShadow = 'var(--Slideshow-Slide-boxShadow)'
	expandedImage.style.transition = `transform ${ms(animationDuration)}, box-shadow ${ms(animationDuration)}, opacity ${ms(ANIMATION_MIN_DURATION)}`

	addElement(expandedImage)

	// Run CSS transitions.
	triggerDomElementRender(expandedImage)
	triggerDomElementRender(thumbnailImageCopy)
	expandedImage.style.opacity = 0
	expandedImage.style.transform =
		getScaleXY(
			thumbnailWidth / slideWidth,
			thumbnailHeight / slideHeight
		) + ' ' +
		getTranslateXY(
			thumbnailX * (slideWidth / thumbnailWidth),
			thumbnailY * (slideHeight / thumbnailHeight)
		)
	thumbnailImageCopy.style.transform = getTranslateXY(thumbnailX, thumbnailY)

	let timeout
	const promise = new Promise((resolve) => {
		timeout = setTimeout(() => {
			removeElement(thumbnailImageCopy)
			removeElement(expandedImage)
			resolve()
		}, animationDuration)
	})

	return {
		animationDuration,
		promise,
		timeout
	}
}

function calculateDistance(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1))
}

function getScaleXY(scaleX, scaleY) {
	return `scaleX(${scaleFactor(scaleX)}) scaleY(${scaleFactor(scaleY)})`
}

function getTranslateXY(translateX, translateY) {
	return `translateX(${px(translateX)}) translateY(${px(translateY)})`
}

function prependElement(container, element) {
	if (container.firstChild) {
		container.insertBefore(element, container.firstChild)
	} else {
		container.appendChild(element)
	}
}
