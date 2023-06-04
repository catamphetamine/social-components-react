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
import { createAnimationResult } from './Slideshow.OpenCloseAnimation.utility.js'

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
			cancel
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
		slideElement.style.opacity = 0
		return {
			animationDuration,
			promise: promise.then(() => {
				// { clearThumbnailOverlay }
				// clearThumbnailImageOverlay.current = clearThumbnailOverlay
				slideElement.style.opacity = 1
			}),
			cancel: () => {
				cancel()
				slideElement.style.opacity = 1
			}
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
			cancel
		} = closeTransition(
			thumbnailElement,
			slideElement,
			slideImage,
			this.slideshow.getSlideInitialWidth(this.slideshow.getCurrentSlide()),
			this.slideshow.getSlideInitialHeight(this.slideshow.getCurrentSlide()),
			this.slideshow.getContainerDOMNode()
		)
		slideElement.style.opacity = 0
		return {
			animationDuration,
			promise,
			cancel: () => {
				cancel()
				slideElement.style.opacity = 1
			}
		}
	}

	getSlideSize = () => {
		return getFitSize(
			this.slideshow.getCurrentSlide().picture,
			this.slideshow.getMaxAvailableSlideWidth(),
			this.slideshow.getMaxAvailableSlideHeight()
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

	// Create `prependElementToContainer()` and `removeElementFromContainer()` functions.
	let containerElement = containerDOMNode
	if (!containerElement) {
		console.error('[Slideshow.OpenCloseAnimationFloat] Slideshow container DOM Element not found. Using `<body/>` instead.')
		containerElement = document.body
	}

	const prependElementToContainer = (element) => {
		prependElement(containerElement, element)
	}

	const removeElementFromContainer = (element) => {
		containerElement.removeChild(element)
	}

	// const removeElementFromContainer = (element) => {
	// 	if (element.parentNode === containerElement) {
	// 		containerElement.removeChild(element)
	// 	} else {
	// 		console.error('[Slideshow.OpenCloseAnimationFloat] element not found when removing it')
	// 	}
	// }

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

	// A copy of thumbnail image is created and animated to "float" along with the expanded image.
	// The rationale is that without it, the change between the original compressed and blurry thumbnail
	// and the sharp scaled down copy of the original image — `largeImageCopy` — would be too drastic.
	// Because of that, it gradually fades out between the original thumbnail image
	// and the scaled down copy of the original image as they both "float" on the screen.
	const createThumbnailImageCopy = () => {
		const element = document.createElement('img')
		element.width = thumbnailWidth
		element.height = thumbnailHeight
		element.src = thumbnailElement.src
		element.style.transform = getTranslateXY(thumbnailX, thumbnailY)
		element.style.transformOrigin = 'top left'
		// `position: fixed` was used when appending this DOM Element to `<body/>`.
		// Not this DOM Element is prepended to the slideshow container DOM Element instead.
		// largeImageCopy.style.position = 'fixed'
		element.style.position = 'absolute'
		element.style.left = '0'
		element.style.top = '0'
		element.style.transition = `transform ${ms(animationDuration)}, opacity ${ms(animationDuration)}`
		return element
	}

	// The background thumbnail copy is added for gradual morphing between
	// the grainy low-resolution thumbnail image and the sharp high-resolution `largeImageCopy`.
	const thumbnailImageCopyBackground = createThumbnailImageCopy()

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
	const createLargeImageCopy = () => {
		const element = document.createElement('img')
		element.width = slideWidth
		element.height = slideHeight
		element.src = expandedPictureUrl // expandedPictureSize.url
		element.style.transform =
			getScaleXY(
				thumbnailWidth / slideWidth,
				thumbnailHeight / slideHeight
			) + ' ' +
			getTranslateXY(
				thumbnailX * (slideWidth / thumbnailWidth),
				thumbnailY * (slideHeight / thumbnailHeight)
			)
		element.style.transformOrigin = 'top left'
		// `position: fixed` was used when appending this DOM Element to `<body/>`.
		// Not this DOM Element is prepended to the slideshow container DOM Element instead.
		// element.style.position = 'fixed'
		element.style.position = 'absolute'
		element.style.left = '0'
		element.style.top = '0'
		// `z-index: var(--Slideshow-zIndex)` was used when appending this DOM Element to `<body/>`.
		// Not this DOM Element is prepended to the slideshow container DOM Element instead.
		// element.style.zIndex = 'var(--Slideshow-zIndex)'
		element.style.opacity = 0
		// It could animate `boxShadow` instead of animating `opacity`
		// but they say that the performance of animating `box-shadow`
		// could be low, and they suggest animating `opacity` instead.
		// https://tobiasahlin.com/blog/how-to-animate-box-shadow/
		element.style.boxShadow = 'var(--Slideshow-Slide-boxShadow)'
		element.style.transition = `transform ${ms(animationDuration)}, opacity ${ms(animationDuration)}`
		return element
	}

	const largeImageCopy = createLargeImageCopy()

	prependElementToContainer(largeImageCopy)
	prependElementToContainer(thumbnailImageCopyBackground)

	// Run CSS transitions.
	triggerDomElementRender(largeImageCopy)
	triggerDomElementRender(thumbnailImageCopyBackground)

	largeImageCopy.style.opacity = 1
	largeImageCopy.style.transform = getTranslateXY(slideX, slideY)

	const thumbnailImageCopyTransform =
		getScaleXY(
			slideWidth / thumbnailWidth,
			slideHeight / thumbnailHeight
		) + ' ' +
		getTranslateXY(
			slideX * (thumbnailWidth / slideWidth),
			slideY * (thumbnailHeight / slideHeight)
		)

	thumbnailImageCopyBackground.style.transform = thumbnailImageCopyTransform

	const cleanUp = () => {
		removeElementFromContainer(thumbnailImageCopyBackground)
		// if (expandedImageElement) {
			removeElementFromContainer(largeImageCopy)
		// }
	}

	// resolve({
	// 	clearThumbnailOverlay: () => thumbnailElement.parentNode.removeChild(thumbnailImagePlaceholder)
	// })

	return createAnimationResult({
		animationDuration,
		cleanUp
	})
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

	// Create `prependElementToContainer()` and `removeElementFromContainer()` functions.
	let containerElement = containerDOMNode
	if (!containerElement) {
		console.error('[Slideshow.OpenCloseAnimationFloat] Slideshow container DOM Element not found. Using `<body/>` instead.')
		containerElement = document.body
	}

	const prependElementToContainer = (element) => {
		prependElement(containerElement, element)
	}

	const removeElementFromContainer = (element) => {
		containerElement.removeChild(element)
	}

	// const removeElementFromContainer = (element) => {
	// 	if (element.parentNode === containerElement) {
	// 		containerElement.removeChild(element)
	// 	} else {
	// 		console.error('[Slideshow.OpenCloseAnimationFloat] element not found when removing it')
	// 	}
	// }

	const createThumbnailImageCopy = () => {
		const element = document.createElement('img')
		element.width = thumbnailWidth
		element.height = thumbnailHeight
		element.src = thumbnailElement.src
		element.style.transform =
			getScaleXY(
				slideWidth / thumbnailWidth,
				slideHeight / thumbnailHeight
			) + ' ' +
			getTranslateXY(
				slideX * (thumbnailWidth / slideWidth),
				slideY * (thumbnailHeight / slideHeight)
			)
		element.style.transformOrigin = 'top left'
		// `position: fixed` was used when appending this DOM Element to `<body/>`.
		// Not this DOM Element is prepended to the slideshow container DOM Element instead.
		// element.style.position = 'fixed'
		element.style.position = 'absolute'
		element.style.left = '0'
		element.style.top = '0'
		element.style.transition = `transform ${ms(animationDuration)}, opacity ${ms(animationDuration)}`
		return element
	}

	// The background thumbnail copy is added for gradual morphing between
	// the grainy low-resolution thumbnail image and the sharp high-resolution `largeImageCopy`.
	const thumbnailImageCopyBackground = createThumbnailImageCopy()

	const createLargeImageCopy = () => {
		const element = document.createElement('img')
		element.width = slideWidth
		element.height = slideHeight
		element.src = slideImage ? slideImage.src : TRANSPARENT_PIXEL
		element.style.transform = getTranslateXY(slideX, slideY)
		element.style.transformOrigin = 'top left'
		// `position: fixed` was used when appending this DOM Element to `<body/>`.
		// Not this DOM Element is prepended to the slideshow container DOM Element instead.
		// element.style.position = 'fixed'
		element.style.position = 'absolute'
		element.style.left = '0'
		element.style.top = '0'
		// `z-index: var(--Slideshow-zIndex)` was used when appending this DOM Element to `<body/>`.
		// Not this DOM Element is prepended to the slideshow container DOM Element instead.
		// element.style.zIndex = 'var(--Slideshow-zIndex)'
		element.style.opacity = 1
		// `backgroundColor` is required for transparent PNGs
		// and also for cases when `slideImage` is not defined.
		element.style.backgroundColor = 'var(--Slideshow-Slide-backgroundColor)'
		element.style.boxShadow = 'var(--Slideshow-Slide-boxShadow)'
		element.style.transition = `transform ${ms(animationDuration)}, opacity ${ms(animationDuration)}`
		return element
	}

	const largeImageCopy = createLargeImageCopy()

	prependElementToContainer(largeImageCopy)
	prependElementToContainer(thumbnailImageCopyBackground)

	// Run CSS transitions.
	triggerDomElementRender(largeImageCopy)
	triggerDomElementRender(thumbnailImageCopyBackground)

	largeImageCopy.style.opacity = 0

	largeImageCopy.style.transform =
		getScaleXY(
			thumbnailWidth / slideWidth,
			thumbnailHeight / slideHeight
		) + ' ' +
		getTranslateXY(
			thumbnailX * (slideWidth / thumbnailWidth),
			thumbnailY * (slideHeight / thumbnailHeight)
		)

	const thumbnailImageCopyTransform = getTranslateXY(thumbnailX, thumbnailY)

	thumbnailImageCopyBackground.style.transform = thumbnailImageCopyTransform

	const cleanUp = () => {
		removeElementFromContainer(thumbnailImageCopyBackground)
		removeElementFromContainer(largeImageCopy)
	}

	return createAnimationResult({
		animationDuration,
		cleanUp
	})
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