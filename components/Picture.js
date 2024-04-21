import React, { useState, useMemo, useRef, useCallback, useLayoutEffect, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
// import { ActivityIndicator } from 'react-responsive-ui'
import { FadeInOut } from 'react-responsive-ui'
import { isEqual } from 'lodash-es'

import { px } from 'web-browser-style'

import LoadingEllipsis from './LoadingEllipsis.js'

import { picture } from './PropTypes.js'

import useIsMounted from '../hooks/useIsMounted.js'
import useEffectSkipMount from '../hooks/useEffectSkipMount.js'

import { getPictureMinSize } from 'social-components/attachment'

import XIcon from '../icons/x-light.svg'

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
	useSmallestSizeExactDimensions,
	component: Component,
	componentProps,
	showLoadingPlaceholder,
	showLoadingIndicator,
	loadingIndicatorFadeInDuration,
	loadingIndicatorFadeOutDuration,
	preload,
	preloadVisibilityMarginHorizontal,
	preloadVisibilityMarginVertical,
	// pixelRatioMultiplier,
	blur,
	style,
	className,
	children,
	imageRef,
	ErrorIndicator = XIcon,
	LoadingIndicator = LoadingEllipsis,
	// LoadingIndicator = ActivityIndicator,
	...rest
}, ref) {
	if (useSmallestSize && useSmallestSizeExactDimensions) {
		width = getPictureMinSize(picture).width
		height = getPictureMinSize(picture).height
	}

	const withBorder = border && !picture.transparentBackground

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

	const isMounted = useIsMounted()

	const imageLoadDevModeTimer = useRef()

	// `initialPictureSize` will be `undefined` when both:
	// * No `width` or `height` are provided.
	// * No `useSmallestSize` flag was passed.
	//
	// In that case, the appropriate picture size will be determined
	// after the page has rendered and the picture element could be measured.
	//
	const initialPictureSize = useMemo(() => {
		return getInitialPictureSize(picture, {
			width,
			height,
			fit,
			useSmallestSize
		})
	}, [])

	const [selectedPictureSize, setSelectedPictureSize] = useState(initialPictureSize)
	const [imageStatus, setStatus] = useState(preload ? 'LOADING' : 'READY')
	// const [recreateIntersectionObserverFlag, setRecreateIntersectionObserverFlag] = useState({})

	// When a thumbnail is shown, aspect ratio is more precise
	// when calculated using the thumbnail dimensions
	// rather than the original image dimensions
	// because width and height in pixels are rounded when
	// generating a thumbnail, so thumbnail's aspect ratio
	// should be calculated from thumbnail's width and height.
	const getImageAspectRatio = useCallback(() => {
		// If new `picture` property is passed, it should start showing new size immediately.
		// That's required by `onRenderedContentDidChange()` call in `PostContent.js`:
		// after `fixAttachmentPictureSizes` feature has changed attachments' pictures,
		// it should be able to re-measure those re-rendered pictures in its `useLayoutEffect()`.
		// If the aspect ratio was read from `selectedPictureSize` rather than `picture` property,
		// there'd be a delay and `onRenderedContentDidChange()` wouldn't get the correct measurements.
		//
		// Yes, `getAspectRatio()` function would've been more precise if it read the measurements from
		// `selectedPictureSize` rather than from `picture` because of the pixels count rounding
		// when producing thumbnails from a full-sized picture.
		// And something like that could be implemented by checking if `selectedPictureSize`
		// is included in `[picture, ...picture.sizes]` array.
		// But that approach would also mean that the image height would "jump" between renders
		// because the aspect ratio of the full-size image would be slightly different
		// from the aspect ratio of one of its smaller thumbnails.
		//
		// `virtual-scroller` wouldn't like such unexpected size changes.
		// That could be worked around if every `<Picture/>` in a `<Post/>`
		// received an `onRenderedContentDidChange()` property and then called it
		// in `useLayoutEffect()` with `selectedPictureSize` dependency.
		// That would mean adding `onRenderedContentDidChange()` property to:
		// * <Picture/>
		// * <PostAttachments/>
		// * <PostAttachmentThumbnail/>
		//
		// But the fact that the `<Picture/>` size would "jump" by a pixel
		// in general doesn't look right: having the `<Picture/>` size constant
		// regardless of the currently rendered size seems like a more correct solution.
		//
		// So in summary, aspect ratio is always the one of the full-size image.
		//
		// With one exception: when `useSmallestSize` flag is `true`,
		// because in that case only the smallest size of the picture will ever be rendered.
		//
		const aspectRatioSourceSize = useSmallestSize ? getPictureMinSize(picture) : picture
		return getAspectRatio(aspectRatioSourceSize)
	}, [
		picture
	])

	const excludeBorder = useCallback((dimension) => {
		if (withBorder) {
			return dimension - 2 * BORDER_WIDTH
		}
		return dimension
	}, [withBorder])

	// `offsetWidth` and `offsetHeight` include border width.
	const getWidth = useCallback(() => {
		return containerRef.current.offsetWidth
	}, [])

	const getHeight = useCallback(() => {
		return containerRef.current.offsetHeight
	}, [])

	const getPreferredImageWidth = useCallback(() => {
		if (fit === 'cover') {
			return excludeBorder(Math.max(getWidth(), getHeight() * getImageAspectRatio()))
		}
		return excludeBorder(getWidth())
	}, [
		fit,
		getWidth,
		getHeight,
		getImageAspectRatio,
		excludeBorder
	])

	const loadPictureSize_ = useCallback((pictureSize) => {
		if (cancelLoadingImageSize.current) {
			cancelLoadingImageSize.current()
		}
		let wasCancelled
		setStatus(preload ? 'LOADING' : 'READY')
		preloadImage(pictureSize.url).then(
			() => {
				if (wasCancelled) {
					return
				}
				cancelLoadingImageSize.current = undefined
				if (isMounted()) {
					if (preload) {
						setStatus('READY')
					}
				}
			},
			(error) => {
				console.error(error)
				if (wasCancelled) {
					return
				}
				cancelLoadingImageSize.current = undefined
				if (isMounted()) {
					setStatus('ERROR')
				}
			}
		)
		cancelLoadingImageSize.current = () => {
			wasCancelled = true
		}
	}, [
		preload,
		setStatus,
		isMounted
	])

	const loadAndRenderInitialPictureSize = useCallback(() => {
		loadPictureSize_(initialPictureSize)
		shouldUpdatePictureSizeOnWindowResize.current = true
	}, [
		loadPictureSize_,
		initialPictureSize
	])

	const loadAndRenderAppropriatePictureSize_ = useCallback(({
		forceReloadImage,
		onSizeChange
	} = {}) => {
		function getAppropriateImageSize() {
			if (useSmallestSize) {
				return getPictureMinSize(picture)
			}
			return getPreferredSize(
				picture,
				getPreferredImageWidth() // * pixelRatioMultiplier
			)
		}
		const appropriateSize = getAppropriateImageSize()
		if (appropriateSize) {
			if (
				forceReloadImage ||
				// If there was no image rendered before.
				!selectedPictureSize ||
				// If the size is different from the currently rendered one.
				// For example, a given `<Picture/>` element could be reused by React
				// with another `picture` property (and all other properties).
				// "Deep equality" check is used here instead of a simple `===` one
				// because the `picture` object can be parsed from an HTTP response from a server,
				// in which case the `picture` object reference will change even though the picture
				// itself stayed the same.
				!isEqual(selectedPictureSize, appropriateSize)
				// If the size got smaller, it doesn't necessarily mean that a bigger image
				// could be reused for it. Or maybe it does? I guess it does.
				// But the `!isEqual(size, appropriateSize)` check above already handles that.
				// // If the appropriate size is bigger than the currently rendered one.
				// appropriateSize.width > selectedPictureSize.width
			) {
				setSelectedPictureSize(appropriateSize)
				loadPictureSize_(appropriateSize)
				if (onSizeChange) {
					onSizeChange()
				}
			}
		}
	}, [
		picture,
		selectedPictureSize,
		setSelectedPictureSize,
		loadPictureSize_,
		useSmallestSize,
		getPreferredImageWidth
	])

	const shouldUpdatePictureSizeOnWindowResize = useRef(false)

	// `loadAndRenderAppropriatePictureSize_()` function might change if properties change.
	// Maybe there is some way to re-recreate `InteractiveResize` when it changes,
	// but in that case some window resize events might be lost (for example, debounced ones),
	// so a simpler approach is just calling the latest version of this function from a "ref".
	const interactiveResizeUpdatePictureSize = useRef()
	interactiveResizeUpdatePictureSize.current = loadAndRenderAppropriatePictureSize_

	const interactiveResize = useMemo(() => {
		return new InteractiveResize()
	}, [])

	const addInteractiveResizeListeners = () => {
		// Refresh the picture size on window resize.
		interactiveResize.add(() => {
			// A `<Picture/>` might become unmounted after a window resize event is received.
			// An example is using `virtual-scroller` to show a list of comments.
			// So check if the `<Picture/>` is still mounted before refreshing it.
			if (isMounted()) {
				if (shouldUpdatePictureSizeOnWindowResize.current) {
					interactiveResizeUpdatePictureSize.current()
				}
			}
		})
		// When I didn't know that `rootMargin` could specify units like `%` or `vw`,
		// I implemented a workaround to specify such values:
		// * It parsed such values and computed `px` values for them
		// * On each resize, it would re-compute the `px` values
		//   and re-create the `IntersectionObserver`s.
		//
		// Later, I found out that `IntersectionObserver`'s `rootMargin` does support
		// those units without any workarounds, so this `recreateIntersectionObserverFlag`
		// workaround was commented out.
		//
		// // Refreshes the `IntersectionObserver`'s `rootMargin`.
		// interactiveResize.add(() => {
		// 	if (isMounted()) {
		// 		setRecreateIntersectionObserverFlag({})
		// 	}
		// })
	}

	const loadAndRenderAppropriatePictureSize = useCallback(({
		forceReloadImage
	} = {}) => {
		loadAndRenderAppropriatePictureSize_({
			forceReloadImage,
			onSizeChange: () => {
				shouldUpdatePictureSizeOnWindowResize.current = true
			}
		})
	}, [
		loadAndRenderAppropriatePictureSize_
	])

	const loadAndRenderInitially = useCallback(() => {
		// If the target image size is known beforehand.
		if (initialPictureSize) {
			loadAndRenderInitialPictureSize()
		} else {
			const render = () => {
				loadAndRenderAppropriatePictureSize()
			}
			// Measure the container's size and determine the appropriate image size
			// for that container size.
			if (process.env.NODE_ENV === 'production') {
				render()
			} else {
				// When the DOM node has been mounted,
				// its width in pixels becomes known,
				// so an appropriate size can now be picked.
				//
				// But that only works when styles are included "statically" on a page.
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
				//
				// A workaround that is used here is to detect "development" mode
				// and then wait for the styles to load, after which re-calculate
				// the appropriate picture size.
				//
				const elapsed = Date.now() - DEV_MODE_PAGE_LOADED_AT
				if (elapsed < DEV_MODE_WAIT_FOR_STYLES_TO_LOAD_MAX_TIME) {
					imageLoadDevModeTimer.current = setTimeout(
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
	}, [
		initialPictureSize,
		loadAndRenderInitialPictureSize,
		loadAndRenderAppropriatePictureSize
	])

	const preloadIntersectionObserverDestroy = useRef()

	const wasIntersectionObserverTriggeredBeforeMount = useRef(false)

	const createIntersectionObserver = () => {
		if (preloadIntersectionObserverDestroy.current) {
			preloadIntersectionObserverDestroy.current()
		}

		// Every modern browser except Internet Explorer supports `IntersectionObserver`s.
		// https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
		// https://caniuse.com/#search=IntersectionObserver
		const preloadIntersectionObserver = new IntersectionObserver((entries, observer) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					const element = entry.target
					observer.unobserve(element)
					// `IntersectionObserver` is created at component render time, before mount.
					// If this listener gets triggered before the component is mounted,
					// then defer calling `loadAndRenderInitially()` until the component has mounted.
					if (isMounted()) {
						loadAndRenderInitially()
					} else {
						wasIntersectionObserverTriggeredBeforeMount.current = true
					}
				}
			}
		}, {
			// "rootMargin" option is incorrectly named.
			// In reality, it's "root area expansion", i.e. how far should the viewport area
			// be expanded relative to the actual viewport area.
			// Values order: "top right bottom left", relative to the viewport area.
			// Available units are `px` or `%`, where `%` means
			// "percentage of the scrollable container's width/height".
			// https://jsbin.com/xanolip/edit?html,css,js,output
			rootMargin: `${preloadVisibilityMarginVertical} ${preloadVisibilityMarginHorizontal} ${preloadVisibilityMarginVertical} ${preloadVisibilityMarginHorizontal}`
		})

		preloadIntersectionObserverDestroy.current = () => {
			preloadIntersectionObserver.disconnect()
		}

		return preloadIntersectionObserver
	}

	const preloadIntersectionObserver = useMemo(() => {
		if (preload && typeof window !== 'undefined') {
			return createIntersectionObserver({
				preloadVisibilityMarginVertical,
				preloadVisibilityMarginHorizontal,
				isMounted,
				loadAndRenderInitially
			})
		}
	}, [
		preload,
		preloadVisibilityMarginVertical,
		preloadVisibilityMarginHorizontal,
		isMounted,
		loadAndRenderInitially,
		// recreateIntersectionObserverFlag
	])

	// Using `useLayoutEffect()` here so that it starts showing
	// the image without an unnecessary delay.
	// Initially, if `preload` flag is set to `true`, which is a default,
	// it doesn't show the image right away and instead preloads it first
	// when it becomes almost visible.
	useLayoutEffect(() => {
		if (preloadIntersectionObserver) {
			preloadIntersectionObserver.observe(containerRef.current)
		}
		addInteractiveResizeListeners()
		interactiveResize.start()
		return () => {
			if (preloadIntersectionObserver) {
				preloadIntersectionObserver.unobserve(containerRef.current)
			}
			interactiveResize.stop()
		}
	}, [
		preloadIntersectionObserver
	])

	useLayoutEffect(() => {
		if (!preload || (preload && wasIntersectionObserverTriggeredBeforeMount.current)) {
			loadAndRenderInitially()
		}

		return () => {
			clearTimeout(imageLoadDevModeTimer.current)
			interactiveResize.stop()
			if (preloadIntersectionObserverDestroy.current) {
				preloadIntersectionObserverDestroy.current()
			}
		}
	}, [])

	const prevPicture = useRef(picture)

	useEffectSkipMount(() => {
		// Sometimes an application might supply the same picture object structure
		// but having a different "object reference".
		// For example, consider an application that reads image data object from a file.
		// It might reload the image data from the file periodically ("refresh")
		// and it shouldn't re-fetch the image if it actualy stays the same.
		const isDifferentPicture = !isEqual(picture, prevPicture.current)
		prevPicture.current = picture
		if (isDifferentPicture) {
			loadAndRenderAppropriatePictureSize()
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

	const addBorder = useCallback((dimension) => {
		if (withBorder) {
			return dimension + 2 * BORDER_WIDTH
		}
		return dimension
	}, [
		withBorder
	])

	const containerStyle = useMemo(() => {
		if (isExactTargetSizeProvided(width, height)) {
			return {
				width: px(addBorder(width || (height * getImageAspectRatio()))),
				height: px(addBorder(height || (width / getImageAspectRatio())))
			}
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

		if (maxWidth || maxHeight) {
			let _maxWidth = getMaxWidth()
			if (fit === 'scale-down') {
				_maxWidth = Math.min(_maxWidth, picture.width)
			}
			return {
				width: '100%',
				maxWidth: px(addBorder(_maxWidth))
			}
		}
	}, [
		fit,
		width,
		height,
		maxWidth,
		maxHeight,
		getImageAspectRatio,
		addBorder,
		picture
	])

	const combinedContainerStyle = useMemo(() => {
		if (style) {
			return {
				...style,
				...containerStyle
			}
		}
		return containerStyle
	}, [
		style,
		containerStyle
	])

	const calculateBlurRadius = useCallback((blurFactor) => {
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
	}, [
		getWidth,
		getHeight,
		width,
		height,
		maxWidth,
		maxHeight,
		picture
	])

	const retryImageLoad = useCallback((event) => {
		event.stopPropagation()
		loadAndRenderAppropriatePictureSize({ forceReloadImage: true })
	}, [
		loadAndRenderAppropriatePictureSize
	])

	const imageStyle = useMemo(() => {
		if (fit === 'cover') {
			return {
				height: '100%',
				objectFit: fit
			}
		}
	}, [
		fit
	])

	// When new `picture` property is passed to the same `<Picture/>` element,
	// it will wait for a `useEffect()` to trigger, where it will call
	// `loadAndRenderAppropriatePictureSize()` function which will choose an
	// appropriate size for the picture, and then it will update the
	// `selectedPictureSize` state variable. Until that whole process is finished,
	// the `selectedPictureSize` will belong to an old `picture`.
	// But `getAspectRatio()` will already return the aspect ratio for the new `picture`.
	// So in order for those two to not visibly conflict with one another,
	// the old `selectedPictureSize` shouldn't be rendered until a new one is chosen.
	//
	const doesSelectedPictureSizeBelongToThePicture = selectedPictureSize && (picture.url === selectedPictureSize.url || picture.sizes && picture.sizes.includes(selectedPictureSize))

	return (
		<Component
			{...rest}
			{...componentProps}
			ref={containerRef}
			style={combinedContainerStyle}
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
			{/* `<span/>` is used instead of a `<div/>`
			    because a `<div/>` isn't supposed to be inside a `<button/>`.
			*/}
			{!isExactTargetSizeProvided(width, height) &&
				<span style={FULL_WIDTH_STRETCHER_STYLE}/>
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
						<LoadingIndicator className="Picture-loadingIndicator"/>
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
					{/* `data-src` attribute here is just for debugging:
					    it answers the question "What exact image URL didn't load?". */}
					<ErrorIndicator
						onClick={retryImageLoad}
						title="Retry"
						className="Picture-loadingError"
						data-src={selectedPictureSize && selectedPictureSize.url}
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
			{doesSelectedPictureSizeBelongToThePicture && imageStatus === 'READY' &&
				<img
					ref={setImageRef}
					src={typeof window === 'undefined' ? TRANSPARENT_PIXEL : (selectedPictureSize ? selectedPictureSize.url : TRANSPARENT_PIXEL)}
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

	// If `true` then, when using `useSmallestSize={true}` property,
	// will show the image at the exact width and height of the smallest size.
	useSmallestSizeExactDimensions: PropTypes.bool,

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

	// The `preload` flag controls whether it should preload the image before showing it.
	//
	// * When `preload` is `true` (default), it will show a "loading" placeholder
	//   until it loads the image. If the image couldn't be loaded, it will show a
	//   "not found" placeholder.
	//
	// * When `preload` if `false`, it will show the image immediately but it will
	//   still check if the image exists and will show a "not found" placeholder
	//   if the image couldn't be loaded.
	//
	preload: PropTypes.bool,
	preloadVisibilityMarginHorizontal: PropTypes.string.isRequired,
	preloadVisibilityMarginVertical: PropTypes.string.isRequired,

	// Set to `true` to show a border around the image.
	border: PropTypes.bool
}

Picture.defaultProps = {
	component: 'div',
	// fadeInDuration: 0,
	showLoadingPlaceholder: true,
	loadingIndicatorFadeInDuration: 3000,
	loadingIndicatorFadeOutDuration: 300,
	preload: true,
	// The margins at which image preload will be set off
	// when the `<Picture/>` element becomes visible on screen
	// to the extend of these margins.
	// The syntax is the same as for the CSS `margin` property.
	// Available units are `px` or `%`, where `%` means
	// "percentage of the scrollable container's width/height".
	preloadVisibilityMarginHorizontal: '100%',
	preloadVisibilityMarginVertical: '100%'
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

const WINDOW_RESIZE_LISTENER_DEBOUNCE_INTERVAL = 500

class InteractiveResize {
	subscribers = new Set()
	constructor() {}
	add(subscriber) {
		this.subscribers.add(subscriber)
	}
	remove(subscriber) {
		this.subscribers.delete(subscriber)
	}
	onResize = () => {
		clearTimeout(this.debounceTimer)
		this.debounceTimer = setTimeout(this.resizeTriggered, WINDOW_RESIZE_LISTENER_DEBOUNCE_INTERVAL)
	}
	resizeTriggered = () => {
		this.debounceTimer = undefined
		for (const subscriber of this.subscribers) {
			subscriber()
		}
	}
	start() {
		window.addEventListener('resize', this.onResize)
	}
	stop() {
		this.subscribers = new Set()
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
		filter: `blur(${px(radius)})`,
		// Works around the white edges bug.
		// https://stackoverflow.com/questions/28870932/how-to-remove-white-border-from-blur-background-image
		// For some reason it will still add a white inner shadow
		// if the `<img/>` has a `border` — seems to be a bug in a web browser.
		width: `calc(100% + ${px(getBlurMargin(radius))})`,
		height: `calc(100% + ${px(getBlurMargin(radius))})`,
		marginLeft: `-${px(getBlurMargin(radius) / 2)}`,
		marginTop: `-${px(getBlurMargin(radius) / 2)}`
	}
}

function getBlurMargin(blurRadius) {
	return 4 * blurRadius
}

function getInitialPictureSize(picture, { width, height, fit, useSmallestSize }) {
	let initialSize
	if (useSmallestSize) {
		return getPictureMinSize(picture)
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
	display: 'block',
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