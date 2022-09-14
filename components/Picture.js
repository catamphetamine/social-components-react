import React, { useState, useRef, useCallback, useEffect, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { ActivityIndicator, FadeInOut } from 'react-responsive-ui'

import { picture } from './PropTypes.js'

import useMount from '../hooks/useMount.js'

import getMinSize from 'social-components/utility/picture/getMinSize.js'

import XIcon from '../icons/x.svg'

import './Picture.css'

// When no picture is available for display.
export const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const DEV_MODE_PAGE_LOADED_AT = typeof window === 'undefined' ? undefined : Date.now()
const DEV_MODE_WAIT_FOR_STYLES_TO_LOAD_MAX_TIME = 1000

// Picture border width.
// Could also be read from the CSS variable:
// `parseInt(getComputedStyle(containerRef.current).getPropertyValue('--Picture-borderWidth'))`.
//
// Perhaps the reason why it's not passed as a React property is because it's also "hardcoded" in CSS.
// In CSS, border width CSS variable is used to calculate `<Picture/>` styles properly.
//
export const BORDER_WIDTH = 1

/**
 * A `<Picture/>` is "responsive"
 * showing the size that suits most based on
 * its actual display size (which could be set in "rem"s, for example)
 * with device pixel ratio being taken into account.
 * Refreshes itself on window resize.
 * On server it renders an empty picture.
 * (because there's no way of getting the device pixel ratio on server).
 */
function Picture({
	picture,
	border,
	fit,
	width,
	height,
	maxWidth,
	maxHeight,
	useSmallestSize,
	component: Component,
	componentProps,
	showLoadingPlaceholder,
	showLoadingIndicator,
	loadingIndicatorFadeInDuration,
	loadingIndicatorFadeOutDuration,
	// pixelRatioMultiplier,
	blur,
	style,
	className,
	children,
	imageRef,
	...rest
}, ref) {
	if (useSmallestSize && !width && !height) {
		width = getMinSize(picture).width
		height = getMinSize(picture).height
	}

	const withBorder = border && !picture.transparentBackground

	// `initialImageSize` will be `undefined`
	// if the target picture size hasn't been provided.
	// In that case, the appropriate image size will be determined
	// after the page has loaded, in a `useEffect()` hook.
	const initialImageSize = useRef(getInitialImageSize(
		picture,
		width,
		height,
		fit,
		useSmallestSize
	))

	const containerRef = useRef()

  const internalImageRef = useRef()

  const setImageRef = useCallback((element) => {
    internalImageRef.current = element
    if (imageRef) {
      if (typeof imageRef === 'function') {
        imageRef(element)
      } else {
        imageRef.current = element
      }
    }
  }, [imageRef])

	const cancelLoadingImageSize = useRef()

	const [isMounted, onMount] = useMount()

	const [size, setSize] = useState(initialImageSize.current)
	const [imageStatus, setImageStatus] = useState('LOADING')

	useEffect(() => {
		if (!window.interactiveResize) {
			window.interactiveResize = new InteractiveResize()
		}

		// When the DOM node has been mounted,
		// its width in pixels becomes known,
		// so an appropriate size can now be picked.
		//
		// This only works when styles are included "statically" on a page.
		// (i.e. via `<link rel="stylesheet" href="..."/>`)
		//
		// It won't work though when loading styles dynamically
		// (via javascript): by the time the component mounts,
		// the styles haven't yet been loaded, so `getWidth()`
		// may return the full window width for a `<div/>`
		// even though the `<div/>`'s max width should be less than that.
		//
		// For example, on a 4K monitor, with a small thumbnail `<Picture/>`,
		// it would still load the full-sized 4K image because the `<Picture/>`
		// size is not set up via `width` and `height` HTML attributes,
		// but is instead set up via CSS `width` and `height` properties
		// which haven't been applied yet because the CSS stylesheet hasn't loaded yet.
		//
		// There seems to be no way around this issue.

		const onFinished = () => {
			window.interactiveResize.add(renderAppropriateSize)
		}

		let imageLoadDevModeTimer

		// If the target image size is known beforehand.
		if (size) {
			loadImage(size)
			onFinished()
		} else {
			const render = () => {
				renderAppropriateSize()
				onFinished()
			}
			// Measure the container's size and determine the appropriate image size
			// for that container size.
			if (process.env.NODE_ENV === 'production') {
				render()
			} else {
				const elapsed = Date.now() - DEV_MODE_PAGE_LOADED_AT
				if (elapsed < DEV_MODE_WAIT_FOR_STYLES_TO_LOAD_MAX_TIME) {
					imageLoadDevModeTimer = setTimeout(
						() => {
							if (isMounted()) {
								render()
							}
						},
						DEV_MODE_WAIT_FOR_STYLES_TO_LOAD_MAX_TIME - elapsed
					)
				} else {
					render()
				}
			}
		}

		return () => {
			clearTimeout(imageLoadDevModeTimer)
			window.interactiveResize.remove(renderAppropriateSize)
		}
	}, [])

	useEffect(() => {
		if (isMounted()) {
			renderAppropriateSize({ reloadImage: true })
		}
	}, [picture])

	useImperativeHandle(ref, () => ({
		focus() {
			if (containerRef.current.focus) {
				return containerRef.current.focus()
			}
		},
		getDOMNode() {
			return containerRef.current
		}
	}))

	function addBorder(dimension) {
		if (withBorder) {
			return dimension + 2 * BORDER_WIDTH
		}
		return dimension
	}

	function excludeBorder(dimension) {
		if (withBorder) {
			return dimension - 2 * BORDER_WIDTH
		}
		return dimension
	}

	function getMaxWidth() {
		if (maxWidth) {
			if (maxHeight) {
				return Math.min(maxWidth, maxHeight * getImageAspectRatio())
			}
			return maxWidth
		} else {
			return maxHeight * getImageAspectRatio()
		}
	}

	function getContainerStyle() {
		if (isExactTargetSizeProvided(width, height)) {
			return {
				width: addBorder(width || (height * getImageAspectRatio())) + 'px',
				height: addBorder(height || (width / getImageAspectRatio())) + 'px'
			}
		}
		if (maxWidth || maxHeight) {
			let _maxWidth = getMaxWidth()
			if (fit === 'scale-down') {
				_maxWidth = Math.min(_maxWidth, picture.width)
			}
			return {
				width: '100%',
				maxWidth: addBorder(_maxWidth) + 'px'
			}
		}
	}

	function calculateBlurRadius(blurFactor) {
		let w
		let h
		if (isExactTargetSizeProvided(width, height)) {
			w = width
			h = height
		}
		else if (maxWidth || maxHeight) {
			w = maxWidth
			h = maxHeight
			const scale = maxWidth ? picture.width / maxWidth : picture.height / maxHeight
			if (scale < 1) {
				if (w) {
					w *= scale
				}
				if (h) {
					h *= scale
				}
			}
		}
		else {
			if (!containerRef.current) {
				return 0
			}
			w = getWidth()
			h = getHeight()
		}
		return Math.round(Math.min(w || h, h || w) * blurFactor)
	}

	function retryImageLoad(event) {
		event.stopPropagation()
		renderAppropriateSize({ reloadImage: true })
	}

	function getAppropriateImageSize() {
		if (useSmallestSize) {
			return getMinSize(picture)
		}
		return getPreferredSize(
			picture,
			getPreferredImageWidth() // * pixelRatioMultiplier
		)
	}

	function getPreferredImageWidth() {
		if (fit === 'cover') {
			return excludeBorder(Math.max(getWidth(), getHeight() * getImageAspectRatio()))
		}
		return excludeBorder(getWidth())
	}

	function renderAppropriateSize({ reloadImage } = {}) {
		const appropriateSize = getAppropriateImageSize()
		if (appropriateSize) {
			if (
				reloadImage ||
				// If there was no image rendered before.
				!size ||
				// If the appropriate size is bigger than the currently rendered one.
				appropriateSize.width > size.width
			) {
				setSize(appropriateSize)
				loadImage(appropriateSize)
			}
		}
	}

	function loadImage(newSize) {
		if (cancelLoadingImageSize.current) {
			cancelLoadingImageSize.current()
		}
		let wasCancelled
		setImageStatus('LOADING')
		preloadImage(newSize.url).then(
			() => {
				if (wasCancelled) {
					return
				}
				cancelLoadingImageSize.current = undefined
				if (isMounted()) {
					setImageStatus('READY')
				}
			},
			(error) => {
				console.error(error)
				if (wasCancelled) {
					return
				}
				cancelLoadingImageSize.current = undefined
				if (isMounted()) {
					setImageStatus('ERROR')
				}
			}
		)
		cancelLoadingImageSize.current = () => wasCancelled = true
	}

	// `offsetWidth` and `offsetHeight` include border width.
	function getWidth() {
		return containerRef.current.offsetWidth
	}

	function getHeight() {
		return containerRef.current.offsetHeight
	}

	// When a thumbnail is shown, aspect ratio is more precise
	// when calculated using the thumbnail dimensions
	// rather than the original image dimensions
	// because width and height in pixels are rounded when
	// generating a thumbnail, so thumbnail's aspect ratio
	// should be calculated from thumbnail's width and height.
	function getImageAspectRatio() {
		return getAspectRatio(size || picture)
	}

	onMount()

	const imageStyle = fit === 'cover' ? { height: '100%', objectFit: fit } : undefined

	return (
		<Component
			{...rest}
			{...componentProps}
			ref={containerRef}
			style={style ? { ...style, ...getContainerStyle() } : getContainerStyle()}
			className={classNames(className, 'Picture', {
				'Picture--withBorder': withBorder,
				'Picture--nonTransparentBackground': showLoadingPlaceholder && !picture.transparentBackground
			})}>

			{/* Placeholder must stretch the parent element vertically
			    for maintaining the aspect ratio of the picture.
			    Otherwise `.Picture`'s height would be `0`
			    until the image file header has been parsed
			    and that would result in "jumpiness" of the layout
			    and would also cause bugs in a `virtual-scroller`.
			    https://gitlab.com/catamphetamine/virtual-scroller#images
			*/}
			{/* `<span/>` is used instead of a `<div/>`
			    because a `<div/>` isn't supposed to be inside a `<button/>`.
			*/}
			{!isExactTargetSizeProvided(width, height) &&
				<AspectRatioStretcher aspectRatio={getImageAspectRatio()}/>
			}

			{/* With the currently used CSS, when a `<Picture/>` is rendered
					in a `display: flex` container, it won't stretch that container horizontally.
					That's a side effect of the `<img/>` element being `position: absolute`.
					As a result, the `<Picture/>` element might get shrinked horizontally
					resulting in the picture appear smaller than it should be, or even zero-width.

			    To work around such cases, a special "horizontal stretcher" element is used.
			    If the `<img/>` was rendered without `position: absolute`,
			    then it itself would stretch such container. But because the `<img/>` is
			    rendered with `position: absolute`, it doesn't stretch the container.
			*/}
			{!isExactTargetSizeProvided(width, height) &&
				<div style={FULL_WIDTH_STRETCHER_STYLE}/>
			}

			{/* "Loading" status indicator. */}
			{/* Image "status" element is stacked below the `<img/>`.
			    This way, as the image loads "progressively",
			    it hides the "loading" status by obstructing it itself.
			*/}
			{/* `<span/>` is used instead of a `<div/>`
			    because a `<div/>` isn't supposed to be found inside a `<button/>`.
			*/}
			{imageStatus === 'LOADING' && showLoadingIndicator &&
				<span className="Picture-status">
					<FadeInOut
						show
						fadeInInitially
						fadeInDuration={loadingIndicatorFadeInDuration}
						fadeOutDuration={loadingIndicatorFadeOutDuration}>
						<ActivityIndicator className="Picture-loadingIndicator"/>
					</FadeInOut>
				</span>
			}

			{/* "Error" status indicator. */}
			{/* Image "status" element is stacked below the `<img/>`.
			    This way, as the image loads "progressively",
			    it hides the "loading" status by obstructing it itself.
			*/}
			{/* `<span/>` is used instead of a `<div/>`
			    because a `<div/>` isn't supposed to be found inside a `<button/>`.
			*/}
			{imageStatus === 'ERROR' &&
				<span className="Picture-status">
					<XIcon
						onClick={retryImageLoad}
						title="Retry"
						className="Picture-loadingError"
						data-src={size && size.url}
					/>
				</span>
			}

			{/* Render the image. */}
			{/* `<img/>` is rendered with `position: absolute`
			    in order to make it appear of the exact size of the container.

			    By default, an `<img/>` doesn't know its own size until the image has started loading.
			    That would have a side effect of the page's content "jumping" due to the `<img/>` elements
			    changing their height from a random unknown one to an exact height in pixels.
			    By making such `<img/>`s `position: absolute`, they don't interfere with the content height
			    at all.
			*/}
			{imageStatus === 'READY' &&
				<img
					ref={setImageRef}
					src={typeof window === 'undefined' ? TRANSPARENT_PIXEL : (size ? size.url : TRANSPARENT_PIXEL)}
					style={blur ? addBlur(imageStyle, calculateBlurRadius(blur)) : imageStyle}
					className={classNames('Picture-image', {
						'Picture-image--blurred': blur
					})}
				/>
			}

			{/* Render any additional content. */}
			{children}
		</Component>
	)
}

Picture = React.forwardRef(Picture)

Picture.propTypes = {
	// Container component. Is `<div/>` by default.
	component: PropTypes.elementType.isRequired,
	componentProps: PropTypes.object,

	// When a `<Picture/>` is a preview for a `<Video/>`
	// then the `<Video/>` may supply its own `aspectRatio`
	// so that there's no jump in width or height when a user clicks the preview
	// and the `<Picture/>` is replaced by a `<Video/>`
	// when the `<Video/>` is sized as `maxWidth`/`maxHeight`.
	aspectRatio: PropTypes.number,

	maxWidth: PropTypes.number,
	maxHeight: PropTypes.number,

	width: PropTypes.number,
	height: PropTypes.number,

	// // `<img/>` fade in duration.
	// fadeInDuration: PropTypes.number.isRequired,

	// Any "child" content will be displayed if no picture is present.
	children: PropTypes.node,

	// Can be used to obtain the `<img/>` element.
	imageRef: PropTypes.object,

	// The image sizing algorithm.
	fit: PropTypes.oneOf([
		'cover',
		'scale-down'
	]),

	// Blurs the `<img/>`.
	blur: PropTypes.number,

	// If `picture` is absent then `children` are used.
	picture: picture,

	// If `true` then will only show the smallest size ever.
	useSmallestSize: PropTypes.bool,

	// // Is a small hack for `<Slideshow/>` scaling.
	// pixelRatioMultiplier: PropTypes.number.isRequired,

	// While the image is loading, don't show the image itself,
	// and instead show a "loading" background color rectangle.
	// Is `true` by default.
	showLoadingPlaceholder: PropTypes.bool,

	// While the image is loading, don't show the image itself,
	// and instead show a "loading" indicator.
	showLoadingIndicator: PropTypes.bool,

	loadingIndicatorFadeInDuration: PropTypes.number.isRequired,
	loadingIndicatorFadeOutDuration: PropTypes.number.isRequired,

	// Set to `true` to show a border around the image.
	border: PropTypes.bool
}

Picture.defaultProps = {
	component: 'div',
	// fadeInDuration: 0,
	showLoadingPlaceholder: true,
	loadingIndicatorFadeInDuration: 3000,
	loadingIndicatorFadeOutDuration: 300,
	// pixelRatioMultiplier: 1
}

export default Picture

export function getPreferredSize(picture, width, options = {}) {
	const maxSize = {
		type: picture.type,
		width: picture.width,
		height: picture.height,
		url: picture.url
	}
	if (picture.sizes) {
		return _getPreferredSize(
			picture.sizes.concat(maxSize),
			width,
			options
		)
	}
	return maxSize
}

// `sizes` must be sorted from smallest to largest.
function _getPreferredSize(sizes, width, options = {}) {
	if (!width) {
		return sizes[0]
	}
	let pixelRatio = 1
	if (typeof window !== 'undefined' && window.devicePixelRatio) {
		pixelRatio = window.devicePixelRatio
	}
	width *= pixelRatio
	width = Math.floor(width)
	let preferredSize
	for (const size of sizes) {
		// if (size.width > maxWidth) {
		// 	return preferredSize || sizes[0]
		// }
		if (size.width === width) {
			return size
		}
		if (size.width > width) {
			// // Prefer larger size unless it's too oversized.
			// if (saveBandwidth && preferredSize) {
			// 	if ((width - preferredSize.width) / (size.width - width) < 0.35) {
			// 		return preferredSize
			// 	}
			// }
			// 	const aspectRatio = sizes[sizes.length - 1].width / sizes[sizes.length - 1].height
			// 	//
			// 	const w1 = preferredSize.width
			// 	const h1 = preferredSize.height
			// 	const dw1 = width - w1
			// 	const dh1 = dw1 / aspectRatio
			// 	//
			// 	const w2 = size.width
			// 	const h2 = size.height
			// 	const dw2 = w2 - width
			// 	const dh2 = dw2 / aspectRatio
			// 	//
			// 	const dS1 = dw1 * h1 + dh1 * w1 + dw1 * dh1
			// 	const dS2 = dw2 * h2 + dh2 * w2 + dw2 * dh2
			// 	//
			// 	if (dS2 / dS1 > 10) {
			// 		return preferredSize
			// 	}
			return size
		}
		preferredSize = size
	}
	return preferredSize
}

// // Self-test.
// const testSizes = [
// 	{ width: 200, height: 163, type: 'image/jpeg' },
// 	{ width: 248, height: 203, type: 'image/gif' }
// ]

// These tests are non-deterministic because they're using `window.devicePixelRatio`.
// if (_getPreferredSize(testSizes, 220) !== testSizes[1] ||
// 	_getPreferredSize(testSizes, 200) !== testSizes[0]) {
// 	console.error('Picture.getPreferredSize() test didn\'t pass')
// }

class InteractiveResize {
	subscribers = new Set()
	constructor() {
		window.addEventListener('resize', this.onResize)
	}
	add(subscriber) {
		this.subscribers.add(subscriber)
	}
	remove(subscriber) {
		this.subscribers.delete(subscriber)
	}
	onResize = () => {
		clearTimeout(this.debounceTimer)
		this.debounceTimer = setTimeout(this.resize, 500)
	}
	resize = () => {
		this.debounceTimer = undefined
		for (const subscriber of this.subscribers) {
			subscriber()
		}
	}
	destroy() {
		for (const subscriber of this.subscribers) {
			this.unregister(subscriber)
		}
		window.removeEventListener('resize', this.onResize)
	}
}

// Preloads an image before displaying it.
export function preloadImage(url) {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = resolve
		// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Image_loading_errors
		image.onerror = (event) => {
			// // Log the error to `sentry.io`.
			// setTimeout(() => {
			// 	console.log(event)
			// 	throw new Error(event)
			// }, 0)
			if (event.path && event.path[0]) {
				console.error(`Image not found: ${event.path[0].src}`)
			}
			const error = new Error('IMAGE_NOT_FOUND')
			error.url = url
			error.event = event
			reject(error)
		}
		image.src = url
	})
}

const SVG_FILE_URL = /\.svg/i

export function getAspectRatio(picture) {
	return picture.width / picture.height
}

export function isVector({ type }) {
	return type === 'image/svg+xml' // || (!size && SVG_FILE_URL.test(picture.url))
}

function addBlur(style, radius) {
	return {
		...style,
		// https://caniuse.com/#feat=css-filters
		filter: `blur(${radius}px)`,
		// Works around the white edges bug.
		// https://stackoverflow.com/questions/28870932/how-to-remove-white-border-from-blur-background-image
		// For some reason it will still add a white inner shadow
		// if the `<img/>` has a `border` — seems to be a bug in a web browser.
		width: `calc(100% + ${getBlurMargin(radius)}px)`,
		height: `calc(100% + ${getBlurMargin(radius)}px)`,
		marginLeft: `-${getBlurMargin(radius) / 2}px`,
		marginTop: `-${getBlurMargin(radius) / 2}px`
	}
}

function getBlurMargin(blurRadius) {
	return 4 * blurRadius
}

function getInitialImageSize(picture, width, height, fit, useSmallestSize) {
	let initialSize
	if (useSmallestSize) {
		return getMinSize(picture)
	}
	if (isExactTargetSizeProvided(width, height)) {
		const aspectRatio = getAspectRatio(picture)
		width = width || aspectRatio * height
		height = height || width / aspectRatio
		let imageWidth = width
		switch (fit) {
			case 'cover':
				// If `width`/`height` aren't proportional
				// then choose the largest proportional `width`.
				if (height > width / aspectRatio) {
					imageWidth = aspectRatio * height
				}
				break
		}
		return getPreferredSize(picture, imageWidth)
	}
}

function isExactTargetSizeProvided(width, height) {
	return width !== undefined || height !== undefined
}

export function getFitSize(picture, availableWidth, availableHeight) {
	if (availableWidth > picture.width) {
		availableWidth = picture.width
	}
	if (availableHeight > picture.height) {
		availableHeight = picture.height
	}
	const aspectRatio = getAspectRatio(picture)
	const maxWidth = availableHeight * aspectRatio
	if (availableWidth > maxWidth) {
		return [maxWidth, availableHeight]
	} else {
		const maxHeight = availableWidth / aspectRatio
		return [availableWidth, maxHeight]
	}
}

const FULL_WIDTH_STRETCHER_STYLE = {
	width: '100vw',
	maxWidth: '100%'
}

function AspectRatioStretcher({ aspectRatio }) {
	return (
		<span style={{
			display: 'block',
			width: '100%',
			paddingBottom: 100 / aspectRatio + '%'
		}}/>
	)
}

AspectRatioStretcher.propTypes = {
	aspectRatio: PropTypes.number.isRequired
};