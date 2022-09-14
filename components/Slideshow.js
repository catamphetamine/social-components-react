import React, { useRef, useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import FocusLock from 'react-focus-lock'

// // `body-scroll-lock` has been modified a bit, see the info in the header of the file.
// import {
// 	disableBodyScroll,
// 	enableBodyScroll,
// 	clearAllBodyScrollLocks
// } from '../utility/body-scroll-lock.js'

import { isTouchDevice } from '../hooks/useDeviceInfo.js'

import SlideshowCore, { getPluginForSlide } from './Slideshow.Core.js'
import SlideshowSize from './Slideshow.Size.js'
import SlideshowControls from './Slideshow.Controls.js'
import { roundScale, getDragAndScaleModeButtonClassName } from './Slideshow.DragAndScaleModeControls.js'
import SlideshowPropTypes, { defaultProps as SlideshowDefaultProps, SlideshowStateTypes } from './Slideshow.PropTypes.js'

import PicturePlugin from './Slideshow.Picture.js'
import VideoPlugin from './Slideshow.Video.js'

import { roundPixels } from 'web-browser-window'

import './Slideshow.css'
import './Slideshow.Pan.css'
import './Slideshow.Picture.css'
import './Slideshow.Scale.css'
import './Slideshow.Video.css'

const PLUGINS = [
	VideoPlugin,
	PicturePlugin
]

export default function SlideshowWrapper(props) {
	props = {
		...props,
		// Add `headerHeight` and `footerHeight` properties
		// that are used both in `<Slideshow/>` and in `SlideshowSize`.
		headerHeight: props.header && props.header.offsetHeight,
		footerHeight: props.footer && props.footer.offsetHeight
	}
	// `window.SlideshowSize` is used in `preloadPictureSlide()` in `Slideshow.Picture.js`.
	// To preload a picture slide, it should know the exact size of the picture
	// that will be loaded when the slideshow opens, not larger, not smaller.
	// `SlideshowSize` should be available before the slideshow is rendered,
	// because that's when a picture slide is preloaded.
	// `SlideshowSize` uses some slideshow props: for example, `margin` and
	// `fullScreenFitPrecisionFactor`.
	// `undefined` is passed as the first argument to `SlideshowSize()` constructor,
	// because the `SlideshowCore` instance doesn't exist yet.
	// In fact, only `.getMaxSlideWidth()` and `.getMaxSlideHeight()`
	// are used when preloading picture slides.
	window.SlideshowSize = useMemo(() => new SlideshowSize(undefined, {
		// `inline` is supposed to be `false`.
		margin: props.margin,
		minMargin: props.minMargin
	}), [
		props.margin,
		props.minMargin
	])
	if (props.isOpen) {
		return <SlideshowComponent {...props}/>
	}
	// React would complain if "nothing was returned from render".
	return null
}

SlideshowWrapper.propTypes = {
	...SlideshowPropTypes,
	isOpen: PropTypes.bool,
	header: PropTypes.any, // `Element` is not defined on server side. // PropTypes.instanceOf(Element),
	footer: PropTypes.any // `Element` is not defined on server side. // PropTypes.instanceOf(Element),
}

SlideshowWrapper.defaultProps = {
	...SlideshowDefaultProps,
	plugins: PLUGINS
}

function SlideshowComponent(props) {
	const container = useRef()
	const slidesRef = useRef()
	const currentSlideRef = useRef()
	const currentSlideContainerRef = useRef()
	const previousButtonRef = useRef()
	const nextButtonRef = useRef()
	const closeButtonRef = useRef()

	const slide = props.slides[props.i]

	const focus = useCallback((direction = 'next') => {
		if (currentSlideRef.current.focus) {
			if (currentSlideRef.current.focus() !== false) {
				return
			}
		}
		if (!isTouchDevice()) {
			if (direction === 'next' && nextButtonRef.current) {
				return nextButtonRef.current.focus()
			} else if (direction === 'previous' && previousButtonRef.current) {
				return previousButtonRef.current.focus()
			} else if (direction === 'previous' && nextButtonRef.current) {
				return nextButtonRef.current.focus()
			} else if (closeButtonRef.current) {
				// Close button is not rendered in inline mode, for example.
				return closeButtonRef.current.focus()
			}
		}
		return container.current.focus()
	}, [])

	const slideshow = useMemo(() => {
		return new SlideshowCore({
			...props,
			getSlideDOMNode: () => currentSlideRef.current && currentSlideContainerRef.current.firstChild,
			// getSlideElement: () => currentSlideRef.current && currentSlideRef.current.getDOMNode && currentSlideRef.current.getDOMNode(),
			onPanStart: () => container.current.classList.add('Slideshow--panning'),
			onPanEnd: () => container.current.classList.remove('Slideshow--panning'),
			setOverlayTransitionDuration: (duration) => container.current.style.transition = duration ? `background-color ${duration}ms` : null,
			setOverlayBackgroundColor: (color) => container.current.style.backgroundColor = color,
			setSlideRollTransitionDuration: (duration) => slidesRef.current.style.transitionDuration = duration + 'ms',
			setSlideRollTransform: (transform) => slidesRef.current.style.transform = transform,
			isRendered: () => slidesRef.current ? true : false,
			getWidth: () => slidesRef.current.clientWidth,
			getHeight: () => slidesRef.current.clientHeight,
			isOverlay: (element) => element.classList.contains('Slideshow-SlideWrapper'),
			// isSmallScreen: () => !isMediumScreenSizeOrLarger(),
			isTouchDevice,
			isButton,
			focus,
			onDragAndScaleModeChange: (isEnabled) => {
				const dragAndScaleModeButton = document.querySelector('.Slideshow-DragAndScaleModeButton')
				if (dragAndScaleModeButton) {
					if (isEnabled) {
						dragAndScaleModeButton.classList.remove('Slideshow-DragAndScaleModeButton--hidden')
					} else {
						dragAndScaleModeButton.classList.add('Slideshow-DragAndScaleModeButton--hidden')
					}
				}
			},
			onScaleChange: (scale) => {
				const dragAndScaleModeButton = document.querySelector('.Slideshow-DragAndScaleModeButton')
				if (dragAndScaleModeButton) {
					const roundedScale = roundScale(scale)
					dragAndScaleModeButton.className = getDragAndScaleModeButtonClassName(roundedScale, slideshow.isDragAndScaleMode())
					const scaleValue = document.querySelector('.Slideshow-DragAndScaleModeButtonScaleValue')
					if (scaleValue) {
						scaleValue.innerText = roundedScale
					}
				}
			}
		})
	}, [])

	const [slideshowState, setSlideshowState] = useState(slideshow.getState())
	slideshow.onSetState(setSlideshowState)

	const [hasBeenMeasured, setHasBeenMeasured] = useState(props.inline ? false : true)

	// Uses `useLayoutEffect()` instead of `useEffect()`
	// because it manipulates DOM Elements (animation).
	useLayoutEffect(() => {
		if (!hasBeenMeasured) {
			return
		}
		slideshow.opened()
	}, [hasBeenMeasured])

	// Emulates `forceUpdate()`
	const [unusedState, setUnusedState] = useState()
	const forceUpdate = useCallback(() => setUnusedState({}), [])

	const prevSlideshowState = useRef(slideshowState)
	const prevSlideshowStateImmediate = useRef(slideshowState)

	useEffect(() => {
		if (slideshowState !== prevSlideshowState.current) {
			slideshow.handleRender(slideshowState, prevSlideshowState.current)
			prevSlideshowState.current = slideshowState
		}
	}, [slideshowState])

	useLayoutEffect(() => {
		if (slideshowState !== prevSlideshowStateImmediate.current) {
			slideshow.handleRender(slideshowState, prevSlideshowStateImmediate.current, { immediate: true })
			prevSlideshowStateImmediate.current = slideshowState
		}
	}, [slideshowState])

	// Uses `useLayoutEffect()` instead of `useEffect()`
	// because after this hook has been run an "inline"
	// slideshow re-renders now that it has access
	// to `this.getSlideshowWidth()`/`this.getSlideshowHeight()`.
	// If the slideshow was fullscreen-only then this subsequent
	// re-render wouldn't be required. But for an `inline` slideshow it would.
	useLayoutEffect(() => {
		// `slidesRef.current` is now available for `this.getSlideshowWidth()`.
		// Also updates container padding-right for scrollbar width compensation.
		setHasBeenMeasured(true)
	}, [])

	useEffect(() => {
		const { fullScreen } = props
		// Focus is now handled by `react-focus-lock`.
		// if (document.activeElement) {
		// 	this.returnFocusTo = document.activeElement
		// }
		focus()
		// if (!inline) {
		// 	// Without this in iOS Safari body content would scroll.
		// 	// https://medium.com/jsdownunder/locking-body-scroll-for-all-devices-22def9615177
		// 	const scrollBarWidth = getScrollBarWidth()
		// 	disableBodyScroll(container.current, {
		// 		// Apply the scrollbar-compensating padding immediately when setting
		// 		// body's `overflow: hidden` to prevent "jitter" ("jank") (visual lag).
		// 		// (for the `<body/>`)
		// 		reserveScrollBarGap: true,
		// 		onBodyOverflowHide: () => {
		// 			// Apply the scrollbar-compensating padding immediately when setting
		// 			// body's `overflow: hidden` to prevent "jitter" ("jank") (visual lag).
		// 			// (for the slideshow `position: fixed` layer)
		// 			if (container.current) {
		// 				container.current.style.paddingRight = scrollBarWidth + 'px'
		// 				// Render the slideshow with scrollbar-compensating padding in future re-renders.
		// 				this.containerPaddingRight = scrollBarWidth + 'px'
		// 			}
		// 		}
		// 	})
		// }
		if (fullScreen) {
			slideshow.fullscreen.enterFullscreen(container.current)
		}
		slideshow.init({ container: container.current })
		slideshow.rerender = forceUpdate
		return () => {
			// Focus is now handled by `react-focus-lock`.
			// if (this.returnFocusTo) {
			// 	this.returnFocusTo.focus()
			// }
			// if (!inline) {
			// 	// Disable `body-scroll-lock` (as per their README).
			// 	enableBodyScroll(container.current)
			// 	clearAllBodyScrollLocks()
			// }
			slideshow.cleanUp()
			// if (clearThumbnailImageOverlay.current) {
			// 	clearThumbnailImageOverlay.current()
			// }
		}
	}, [])

	return (
		<Slideshow
			slideshow={slideshow}
			slideshowState={slideshowState}
			hasBeenMeasured={hasBeenMeasured}
			container={container}
			slidesRef={slidesRef}
			currentSlideRef={currentSlideRef}
			currentSlideContainerRef={currentSlideContainerRef}
			previousButtonRef={previousButtonRef}
			nextButtonRef={nextButtonRef}
			closeButtonRef={closeButtonRef}
		/>
	)
}

SlideshowComponent.propTypes = {
	...SlideshowPropTypes,
	slides: SlideshowPropTypes.slides.isRequired
}

SlideshowComponent.defaultProps = SlideshowDefaultProps

function Slideshow({
	slideshow,
	slideshowState,
	hasBeenMeasured,
	// refs.
	container,
	slidesRef,
	currentSlideRef,
	currentSlideContainerRef,
	previousButtonRef,
	nextButtonRef,
	closeButtonRef
}) {
	const {
		inline,
		autoPlay,
		animateOpen,
		animateOpenSlideAndBackgroundSeparately,
		// overlayOpacity,
		showScaleButtons,
		showControls: _showControls,
		highContrastControls,
		useCardsForSlidesMaxOverlayOpacity,
		scaleAnimationDuration,
		paginationDotsMaxSlidesCount,
		messages,
		goToSource,
		slides
	} = slideshow.props

	const {
		scale,
		slidesShown,
		i: slideIndex,
		slideIndexAtWhichTheSlideshowIsBeingOpened,
		showMoreControls,
		animateClose,
		animateCloseSlideAndBackgroundSeparately,
		// animateOverlayOpacityDurationOnSlideChange,
		hasStartedOpening,
		hasFinishedOpening,
		hasStartedClosing,
		hasFinishedClosing,
		openAnimationDuration,
		closeAnimationDuration
	} = slideshowState

	const showPagination = slideshow.shouldShowPagination()

	const overlayOpacity = slideshow.getMaxOverlayOpacity()

	const dragAndScaleMode = slideshow.isDragAndScaleMode()

	// `react-focus-lock` doesn't focus `<video/>` when cycling the Tab key.
	// https://github.com/theKashey/react-focus-lock/issues/61

	// Safari doesn't support pointer events.
	// https://caniuse.com/#feat=pointer
	// https://webkit.org/status/#?search=pointer%20events
	// onPointerDown={slideshow.onPointerDown}
	// onPointerUp={slideshow.onPointerUp}
	// onPointerMove={slideshow.onPointerMove}
	// onPointerOut={slideshow.onPointerOut}

	// React doesn't support setting up non-passive listeners.
	// https://github.com/facebook/react/issues/14856
	// onTouchMove={slideshow.onTouchMove}
	// onWheel={slideshow.onWheel}>

	const overlayOpacityForAnimation =
		hasStartedOpening ?
			(hasFinishedOpening ?
				(hasStartedClosing && animateClose ? 0 : overlayOpacity) :
				overlayOpacity
			) :
			(animateOpen ? 0 : overlayOpacity)

	const slideshowOpacityForAnimation =
		hasStartedOpening ?
			(hasFinishedOpening ?
				(hasStartedClosing && animateClose ? 0 : 1) :
				1
			) :
			(animateOpen ? 0 : 1)

	const animateOpenCloseSlideAndBackgroundSeparately =
		hasStartedOpening ?
			(hasFinishedOpening ?
				(hasStartedClosing ? animateCloseSlideAndBackgroundSeparately : undefined) :
				animateOpenSlideAndBackgroundSeparately
			) :
			animateOpenSlideAndBackgroundSeparately

	const openCloseAnimationDuration =
		hasStartedOpening ?
			(hasFinishedOpening ?
				(hasStartedClosing && animateClose ? closeAnimationDuration : undefined) :
				openAnimationDuration
			) :
			undefined

	const showActions = _showControls && (
		hasStartedOpening ?
			(hasFinishedOpening ?
				(hasStartedClosing && animateClose ? false : true) :
				true
			) :
			(animateOpen ? false : true)
	)

	// `tabIndex={ -1 }` makes the `<div/>` focusable.
	return (
		<FocusLock
			returnFocus={FOCUS_OPTIONS}
			autoFocus={false}>
			<div
				ref={container}
				tabIndex={-1}
				style={inline ? undefined : {
					// paddingRight: slideshow.containerPaddingRight,
					// transitionDuration: slideshow.getOverlayTransitionDuration(),
					//
					// backgroundColor: slideshow.getOverlayBackgroundColor(overlayOpacityForAnimation),
					// transition: openCloseAnimationDuration ? `background-color ${openCloseAnimationDuration}ms` : undefined
					//
					backgroundColor: slideshow.getOverlayBackgroundColor(animateOpenCloseSlideAndBackgroundSeparately ? overlayOpacityForAnimation : overlayOpacity),
					opacity: animateOpenCloseSlideAndBackgroundSeparately ? undefined : slideshowOpacityForAnimation,
					transition: (
						openCloseAnimationDuration
							? `${animateOpenCloseSlideAndBackgroundSeparately ? 'background-color' : 'opacity'} ${openCloseAnimationDuration}ms`
							: undefined
							// Turns out, animating overlay opacity on slide change by a
							// keyboard key press (Left/Right/etc) doesn't look good,
							// to the point that a simple "immediate" transition looks better.
							// : (
							// 	animateOverlayOpacityDurationOnSlideChange
							// 		? `background-color ${animateOverlayOpacityDurationOnSlideChange}ms`
							// 		: undefined
							// )
					)
				}}
				className={classNames('Slideshow', {
					'Slideshow--fullscreen': !inline,
					'Slideshow--panning': slideshow.isActuallyPanning,
					'Slideshow--showPagination': showPagination,
					'Slideshow--paginationNumeric': slides.length > paginationDotsMaxSlidesCount
				})}
				onKeyDown={slideshow.onKeyDown}
				onDragStart={slideshow.onDragStart}
				onTouchStart={slideshow.onTouchStart}
				onTouchEnd={slideshow.onTouchEnd}
				onTouchCancel={slideshow.onTouchCancel}
				onMouseDown={slideshow.onPointerDown}
				onMouseUp={slideshow.onPointerUp}
				onMouseMove={slideshow.onPointerMove}
				onMouseLeave={slideshow.onPointerOut}
				onClick={slideshow.onBackgroundClick}>
				<div style={INNER_CONTAINER_STYLE}>
					<div
						ref={slidesRef}
						style={{
							// `will-change` performs the costly "Composite Layers"
							// operation at mount instead of when navigating through slides.
							// Otherwise that "Composite Layers" operation would take about
							// 30ms a couple of times sequentially causing a visual lag.
							willChange: 'transform',
							// transitionDuration: hasBeenMeasured ? slideshow.getSlideRollTransitionDuration() : undefined,
							transform: hasBeenMeasured ? slideshow.getSlideRollTransform(slideIndex) : undefined,
							opacity: hasBeenMeasured ? 1 : 0
						}}
						className="Slideshow-Slides">
						{hasBeenMeasured && slides.map((slide, j) => (
							<div
								key={j}
								ref={j === slideIndex ? currentSlideContainerRef : undefined}
								className={classNames('Slideshow-SlideWrapper', {
									'Slideshow-SlideWrapper--current': j === slideIndex
								})}>
								{slidesShown[j] && slideshow.getPluginForSlide(slide) &&
									slideshow.getPluginForSlide(slide).render({
										slide,
										ref: j === slideIndex ? currentSlideRef : undefined,
										tabIndex: j === slideIndex ? 0 : -1,
										isCurrentSlide: j === slideIndex,
										autoPlay: autoPlay || j === slideIndexAtWhichTheSlideshowIsBeingOpened,
										// // `scale` is passed as `pixelRatioMultiplier` to `<Picture/>`.
										// scale: slideshow.getSlideScale(j),
										onClick: slideshow.onSlideClick,
										width: roundPixels(slideshow.getSlideWidth(slide) * slideshow.getSlideScale(j)),
										height: roundPixels(slideshow.getSlideHeight(slide) * slideshow.getSlideScale(j)),
										dragAndScaleMode,
										className: classNames('Slideshow-Slide', {
											'Slideshow-Slide--current': j === slideIndex,
											'Slideshow-Slide--card': overlayOpacity < useCardsForSlidesMaxOverlayOpacity && !slideshow.isTransparentBackground(slideshow.getSlide(j))
										}),
										style: {
											/* Can be scaled via `style="transform: scale(...)". */
											// transition: 'transform 120ms ease-out',
											// Scaling is done via a CSS transform.
											// The reason for that is having a CSS transition animation.
											// The right way of doing scaling would be by scaling
											// `maxWidth` and `maxHeight`, but that wouldn't be
											// as performant when animating as CSS transitions.
											// For `<img/>`s it doesn't make any difference
											// whether they're scaled via a CSS transform
											// or by scaling `width` and `height`.
											// Same's for `<video/>`s.
											// transform: slideshow.getSlideScale(j) === 1 ? undefined : `scale(${slideshow.getSlideScale(j)})`
											...slideshow.getSlideTransform(j),
											// Adjacent slides have `box-shadow`.
											// If its `opacity` isn't animated during open/close
											// then the non-smoothness is noticeable.
											transition: j === slideIndex ? undefined : (
												hasStartedOpening ?
													(hasFinishedOpening ?
														(hasStartedClosing && animateClose ? `opacity ${closeAnimationDuration}ms` : undefined) :
														`opacity ${openAnimationDuration}ms`
													) :
													undefined
											),
											opacity: j === slideIndex ? undefined : (
												hasStartedOpening ?
													(hasFinishedOpening ?
														(hasStartedClosing && animateClose ? 0 : undefined) :
														1
													) :
													(animateOpen ? 0 : undefined)
											)
										}
										// shouldUpscaleSmallSlides: slideshow.shouldUpscaleSmallSlides()
									})
								}
							</div>
						))}
					</div>

					<SlideshowControls
						slideshow={slideshow}
						slides={slides}
						slideIndex={slideIndex}
						scale={scale}
						messages={messages}
						dragAndScaleMode={dragAndScaleMode}
						showActions={showActions}
						showScaleButtons={showScaleButtons}
						showMoreControls={showMoreControls}
						showPagination={showPagination && !hasStartedClosing}
						goToSource={goToSource}
						closeButtonRef={closeButtonRef}
						previousButtonRef={previousButtonRef}
						nextButtonRef={nextButtonRef}
						highContrastControls={highContrastControls}
					/>
				</div>
			</div>
		</FocusLock>
	)
}

Slideshow.propTypes = {
	slideshow: PropTypes.shape({
		props: PropTypes.shape(SlideshowPropTypes).isRequired
	}).isRequired,
	slideshowState: PropTypes.shape(SlideshowStateTypes).isRequired,
	hasBeenMeasured: PropTypes.bool,
	// refs.
	container: PropTypes.object.isRequired,
	slidesRef: PropTypes.object.isRequired,
	currentSlideRef: PropTypes.object.isRequired,
	currentSlideContainerRef: PropTypes.object.isRequired,
	previousButtonRef: PropTypes.object.isRequired,
	nextButtonRef: PropTypes.object.isRequired,
	closeButtonRef: PropTypes.object.isRequired
}

function isButton(element) {
	if (element.classList && (
		// // Previous/Next buttons are `.Slideshow-Action`s
		// // and aren't rendered inside `.Slideshow-Actions`.
		// element.classList.contains('Slideshow-Action') ||
		// element.classList.contains('Slideshow-Actions') ||
		element.classList.contains('Slideshow-Controls')
	)) {
		return true
	}
	// `<button/>` tag name didn't work on "Open external link" hyperlink
	// and also did reset dragging on Video slides (which are buttons themselves).
	// if (element.tagName === 'BUTTON') {
	// 	return true
	// }
	if (element.parentNode) {
		return isButton(element.parentNode)
	}
	return false
}

const FOCUS_OPTIONS = {
	preventScroll: true
}

const INNER_CONTAINER_STYLE = {
	position: 'relative',
	width: '100%',
	height: '100%'
}

window.Slideshow = {
	willOpen(onCancel) {
		if (this.openRequest) {
			this.openRequest.cancel()
		}
		return this.openRequest = {
			cancel() {
				this.cancelled = true
				onCancel()
			}
		}
	}
}

export function isSlideSupported(slide) {
	if (getPluginForSlide(slide, PLUGINS)) {
		return true
	}
}