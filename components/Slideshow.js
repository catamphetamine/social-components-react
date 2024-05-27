import React, { useRef, useState, useCallback, useMemo, useEffect, useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import FocusLock from 'react-focus-lock'

import { ms } from 'web-browser-style'

// // `body-scroll-lock` has been modified a bit, see the info in the header of the file.
// import {
// 	disableBodyScroll,
// 	enableBodyScroll,
// 	clearAllBodyScrollLocks
// } from '../utility/body-scroll-lock.js'

import { isTouchDevice } from '../hooks/useDeviceInfo.js'

import SlideshowCore from './Slideshow.Core.js'
import SlideshowSize from './Slideshow.Size.js'
import SlideshowControls from './Slideshow.Controls.js'
import SlideshowThumbnails from './Slideshow.Thumbnails.js'
import { roundScale, getPanAndZoomModeButtonClassName } from './Slideshow.PanAndZoomModeControls.js'
import SlideshowPropTypes, { defaultProps as SlideshowDefaultProps, SlideshowStateTypes } from './Slideshow.PropTypes.js'
import { hasViewerForSlide, getViewerForSlide } from './Slideshow.Viewer.js'

import PictureViewer from './Slideshow.Viewer.Picture.js'
import VideoViewer from './Slideshow.Viewer.Video.js'

import './Slideshow.css'
import './Slideshow.Drag.css'
import './Slideshow.Scale.css'
import './Slideshow.Viewer.Picture.css'
import './Slideshow.Viewer.Video.css'

const VIEWERS = [
	PictureViewer,
	VideoViewer
]

export default function SlideshowWrapper(props) {
	props = {
		// It adds default props both to `SlideshowWrapper` and `SlideshowComponent`
		// because `window.SlideshowProps` are used in `preloadPictureSlide()` in `Slideshow.Picture.js`.
		...SlideshowDefaultProps,
		viewers: VIEWERS,
		...props
	}
	props = {
		...props,
		// Add `headerHeight` and `footerHeight` properties
		// that are used both in `<Slideshow/>` and in `SlideshowSize`.
		headerHeight: props.header && props.header.offsetHeight,
		footerHeight: props.footer && props.footer.offsetHeight
	}
	// `window.SlideshowProps` are used in `preloadPictureSlide()` in `Slideshow.Picture.js`.
	// To preload a picture slide, it should know the exact size of the picture
	// that will be loaded when the slideshow opens, not larger, not smaller.
	// `SlideshowSize` should be available before the slideshow is rendered,
	// because that's when a picture slide is preloaded.
	// `SlideshowSize` uses some slideshow props: for example, `margin` and
	// `fullScreenFitPrecisionFactor`.
	// `undefined` is passed as the first argument to `SlideshowSize()` constructor,
	// because the `SlideshowCore` instance doesn't exist yet.
	// In fact, only `.getMaxAvailableSlideWidth()` and `.getMaxAvailableSlideHeight()`
	// are used when preloading picture slides.
	if (typeof window !== 'undefined') {
		window.SlideshowProps = props
	}
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

function SlideshowComponent(props) {
	props = {
		...SlideshowDefaultProps,
		...props
	}

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
			getContainerDOMNode: () => container.current,
			getSlideDOMNode: () => currentSlideRef.current && currentSlideContainerRef.current.firstChild,
			// getSlideElement: () => currentSlideRef.current && currentSlideRef.current.getDOMNode && currentSlideRef.current.getDOMNode(),
			onDragStart: () => container.current.classList.add('Slideshow--dragging'),
			onDragEnd: () => container.current.classList.remove('Slideshow--dragging'),
			setOverlayTransitionDuration: (duration) => container.current.style.transition = duration ? `background-color ${ms(duration)}` : null,
			setOverlayBackgroundColor: (color) => container.current.style.backgroundColor = color,
			setSlideshowPanTransitionDuration: (duration) => slidesRef.current.style.transitionDuration = ms(duration),
			setSlideshowPanTransform: (transform) => slidesRef.current.style.transform = transform,
			isRendered: () => slidesRef.current ? true : false,
			getWidth: () => slidesRef.current.clientWidth,
			getHeight: () => slidesRef.current.clientHeight,
			isOverlay: (element) => element.classList.contains('Slideshow-SlideWrapper'),
			// isSmallScreen: () => !isMediumScreenSizeOrLarger(),
			isTouchDevice,
			isButton,
			focus,
			onPanAndZoomModeChange: (isEnabled) => {
				const panAndZoomModeButton = document.querySelector('.Slideshow-PanAndZoomModeButton')
				if (panAndZoomModeButton) {
					if (isEnabled) {
						panAndZoomModeButton.classList.remove('Slideshow-PanAndZoomModeButton--hidden')
					} else {
						panAndZoomModeButton.classList.add('Slideshow-PanAndZoomModeButton--hidden')
					}
				}
			},
			onScaleChange: (scale) => {
				const panAndZoomModeButton = document.querySelector('.Slideshow-PanAndZoomModeButton')
				if (panAndZoomModeButton) {
					const roundedScale = roundScale(scale)
					panAndZoomModeButton.className = getPanAndZoomModeButtonClassName(roundedScale, slideshow.panAndZoomMode.isPanAndZoomMode())
					const scaleValue = document.querySelector('.Slideshow-PanAndZoomModeButtonScaleValue')
					if (scaleValue) {
						scaleValue.innerText = roundedScale
					}
				}
			}
		})
	}, [])

	const [slideshowState, setSlideshowState] = useState(slideshow.getState())
	slideshow.onSetState(setSlideshowState)

	// Makes plugin-specific measurements.
	const getPluginSpecificMeasurements = () => {
		let measurements = {}
		if (SlideshowThumbnails.shouldRender({
			hasBeenMeasured: true,
			showThumbnails: props.showThumbnails,
			slides: props.slides
		})) {
			measurements = {
				...measurements,
				thumbnails: SlideshowThumbnails.measure()
			}
		}
		return measurements
	}

	const hasBeenMeasuredInitially = props.inline ? false : true
	const [hasBeenMeasured, setHasBeenMeasured] = useState(hasBeenMeasuredInitially)
	const [measurements, setMeasurements] = useState(hasBeenMeasuredInitially ? getPluginSpecificMeasurements() : {})

	// Emulates `forceUpdate()`
	const [unusedState, setUnusedState] = useState()
	const forceUpdate = useCallback(() => setUnusedState({}), [])

	const prevSlideshowState = useRef(slideshowState)
	const prevSlideshowStateImmediate = useRef(slideshowState)

	// Calls `handleStateUpdate()` on state change.
	useEffect(() => {
		if (slideshowState !== prevSlideshowState.current) {
			slideshow.handleStateUpdate(slideshowState, prevSlideshowState.current)
			prevSlideshowState.current = slideshowState
		}
	}, [slideshowState])

	// Calls `handleStateUpdate()` immediately on state change.
	useLayoutEffect(() => {
		if (slideshowState !== prevSlideshowStateImmediate.current) {
			slideshow.handleStateUpdate(slideshowState, prevSlideshowStateImmediate.current, { immediate: true })
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
		if (!hasBeenMeasuredInitially) {
			// `slidesRef.current` is now available for `this.getSlideshowWidth()`.
			// Also updates container padding-right for scrollbar width compensation.
			setHasBeenMeasured(true)
			setMeasurements(getPluginSpecificMeasurements())
		}
	}, [])

	useEffect(() => {
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
		slideshow.rerender = forceUpdate
		slideshow.initialize({ container: container.current })
		const { fullScreen } = props
		if (fullScreen) {
			slideshow.enterFullscreen(container.current)
		}
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

	useOpenEffect(() => {
		slideshow.hasOpened()
	}, [hasBeenMeasured])

	return (
		<Slideshow
			slideshow={slideshow}
			slideshowState={slideshowState}
			hasBeenMeasured={hasBeenMeasured}
			measurements={measurements}
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

function Slideshow({
	slideshow,
	slideshowState,
	hasBeenMeasured,
	measurements,
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
		showScaleButtons,
		showControls: _showControls,
		highContrastControls,
		useCardsForSlidesMaxOverlayOpacity,
		paginationDotsMaxSlidesCount,
		showThumbnails,
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
		openAnimationDuration,
		closeAnimationDuration,
		openClosePhase
	} = slideshowState

	const showPagination = slideshow.shouldShowPagination()

	const overlayOpacity = slideshow.getOverlayOpacityForCurrentSlide()

	const panAndZoomMode = slideshow.panAndZoomMode.isPanAndZoomMode()

	// `react-focus-lock` doesn't focus `<video/>` when cycling the Tab key.
	// https://github.com/theKashey/react-focus-lock/issues/61

	// Safari doesn't support pointer events.
	// https://caniuse.com/#feat=pointer
	// https://webkit.org/status/#?search=pointer%20events
	// onPointerDown={slideshow.onPointerDown}
	// onPointerUp={slideshow.onPointerUp}
	// onPointerMove={slideshow.onPointerMove}
	// onPointerOut={slideshow.onPointerOut}

	// React doesn't support setting up "non-passive" listeners like "touchmove" or "wheel" ones.
	// https://github.com/facebook/react/issues/14856
	// onTouchMove={slideshow.onTouchMove}
	// onWheel={slideshow.onWheel}>

	function getValueForAnimation({
		default: defaultValue,
		animateOpen: animateOpenValue,
		animateClose: animateCloseValue
	}) {
		switch (openClosePhase) {
			case 'closed':
				if (animateOpen) {
					return animateOpenValue
				}
				return defaultValue
			case 'opening':
				return defaultValue
			case 'open':
				return defaultValue
			case 'closing':
				if (animateClose) {
					return animateCloseValue
				}
				return defaultValue
		}
	}

	const overlayOpacityForAnimation = getValueForAnimation({
		default: overlayOpacity,
		animateOpen: 0,
		animateClose: 0
	})
	const slideshowOpacityForAnimation = getValueForAnimation({
		default: 1,
		animateOpen: 0,
		animateClose: 0
	})
	const animateOpenCloseSlideAndBackgroundSeparately = getValueForAnimation({
		default: animateOpenSlideAndBackgroundSeparately,
		animateOpen: animateOpenSlideAndBackgroundSeparately,
		animateClose: animateCloseSlideAndBackgroundSeparately
	})
	const openCloseAnimationDuration = getValueForAnimation({
		default: undefined,
		animateOpen: openAnimationDuration,
		animateClose: closeAnimationDuration
	})
	const showActions = getValueForAnimation({
		default: true,
		animateOpen: false,
		animateClose: false
	})

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
					// transition: openCloseAnimationDuration ? `background-color ${ms(openCloseAnimationDuration)}` : undefined
					//
					backgroundColor: slideshow.getOverlayBackgroundColor(animateOpenCloseSlideAndBackgroundSeparately ? overlayOpacityForAnimation : overlayOpacity),
					opacity: animateOpenCloseSlideAndBackgroundSeparately ? undefined : slideshowOpacityForAnimation,
					transition: (
						openCloseAnimationDuration
							? `${animateOpenCloseSlideAndBackgroundSeparately ? 'background-color' : 'opacity'} ${ms(openCloseAnimationDuration)}`
							: undefined
							// Turns out, animating overlay opacity on slide change by a
							// keyboard key press (Left/Right/etc) doesn't look good,
							// to the point that a simple "immediate" transition looks better.
							// : (
							// 	animateOverlayOpacityDurationOnSlideChange
							// 		? `background-color ${ms(animateOverlayOpacityDurationOnSlideChange)}`
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
							transform: hasBeenMeasured ? slideshow.getSlideshowPanTransform({ slideIndex }) : undefined,
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
								{slidesShown[j] && slideshow.getViewerForSlide(slide) &&
									slideshow.getViewerForSlide(slide).render({
										slide,
										ref: j === slideIndex ? currentSlideRef : undefined,
										tabIndex: j === slideIndex ? 0 : -1,
										isCurrentSlide: j === slideIndex,
										// Auto-play a slide when a user clicks on it.
										// Also auto-play a slide when `autoPlay` property is set to `true`.
										autoPlay: autoPlay || j === slideIndexAtWhichTheSlideshowIsBeingOpened,
										// // `scale` is passed as `pixelRatioMultiplier` to `<Picture/>`.
										// scale: slideshow.getSlideScale(j),
										onClick: slideshow.onSlideClick,
										width: slideshow.getSlideInitialWidth(slide) * slideshow.getSlideScale(j),
										height: slideshow.getSlideInitialHeight(slide) * slideshow.getSlideScale(j),
										panAndZoomMode,
										className: classNames('Slideshow-Slide', {
											'Slideshow-Slide--current': j === slideIndex,
											'Slideshow-Slide--card': overlayOpacity < useCardsForSlidesMaxOverlayOpacity && !slideshow.isTransparentBackground(slideshow.getSlide(j))
										}),
										style: {
											// Scaling slides is done via a CSS transform.
											// The reason for that is having a CSS transition animation:
											// if slides were scaled by modifying their `width` and `height` directly,
											// the transition wouldn't be as smooth as it can be when using `transform: scale()`.
											//
											// For `<img/>` elements it doesn't make any difference if they're scaled
											// using `transform: scale()` or by modifying the `width` and `height` attributes.
											// Same's for `<video/>` elements.
											//
											...slideshow.getSlideTransform(j),

											// The slideshow renders the slide that is currently being viewed,
											// and it also "pre-renders" the adjacent slides for the swipe transition effect.
											//
											// Adjacent slides have `box-shadow` that does sometimes "leak"
											// onto the slide currently being on screen.
											//
											// The current slide's opacity is animated during open/close transition.
											// The opacity of the `box-shadow` of the adjacent slides should be animated too,
											// otherwise those "bleeds" of adjacent `box-shadow` would appear/disappear abruptly.
											//
											// Therefore, for a non-current slide, `transition` and `opacity` should be set.
											//
											transition: j === slideIndex ? undefined : getValueForAnimation({
												default: undefined,
												animateOpen: !isNaN(openAnimationDuration) && `opacity ${ms(openAnimationDuration)}`,
												animateClose: !isNaN(closeAnimationDuration) && `opacity ${ms(closeAnimationDuration)}`
											}),
											opacity: j === slideIndex ? undefined : getValueForAnimation({
												default: undefined,
												animateOpen: 0,
												animateClose: 0
												// 'opening': 1
											})
										}
									})
								}
							</div>
						))}
					</div>

					{SlideshowThumbnails.shouldRender({
						hasBeenMeasured,
						showThumbnails,
						slides
					}) &&
						<SlideshowThumbnails
							slideshow={slideshow}
							slides={slides}
							slideIndex={slideIndex}
							messages={messages}
							measurements={measurements.thumbnails}
						/>
					}

					<SlideshowControls
						slideshow={slideshow}
						slides={slides}
						slideIndex={slideIndex}
						scale={scale}
						messages={messages}
						panAndZoomMode={panAndZoomMode}
						showActions={showActions}
						showScaleButtons={showScaleButtons}
						showMoreControls={showMoreControls}
						showPagination={showPagination && openClosePhase !== 'closing'}
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
	height: '100%',
	// `Slideshow.OpenCloseAnimationFloat` will prepend `<img/>` elements
	// before this `<div/>`, so it should have `z-index: 1` so that those `<img/>`s
	// aren't rendered on top of the slideshow controls (for example, pagination).
	zIndex: 1
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
	if (hasViewerForSlide(slide, VIEWERS)) {
		return true
	}
}

function useOpenEffect(onOpen, [hasBeenMeasured]) {
  const hasBeenOpened = useRef(false)

	// // Uses `useLayoutEffect()` instead of `useEffect()` here because the hook below uses it.
	// // Maybe it doesn't matter but it looks more consistent this way.
	useEffect(() => {
		return () => {
			// Reset "has been opened" status so that it re-runs the "open" animation
			// next time the component is re-mounted.
			// This fixes `useEffect()` hooks running twice in React's "strict" mode.
			// https://legacy.reactjs.org/docs/strict-mode.html#ensuring-reusable-state
			if (hasBeenOpened.current) {
				hasBeenOpened.current = false
			}
		}
	}, [])

	// // Uses `useLayoutEffect()` instead of `useEffect()` here because it manipulates
	// // DOM Elements (animation), so it's better to run it immediately after the slideshow
	// // has been opened so that there's no percievable delay until the animation starts.
	// // Maybe it's not that critical though.
	useEffect(() => {
		// React runs effects on mount twice in "strict" mode.
		// https://legacy.reactjs.org/docs/strict-mode.html#ensuring-reusable-state
		// This workaround prevents the "open" animation from running twice on opening a slide:
		// `hasBeenMeasured` will be `false` when React calls this effect for the first time.
		if (!hasBeenOpened.current) {
			if (hasBeenMeasured) {
				hasBeenOpened.current = true
				onOpen()
			}
		}
	}, [hasBeenMeasured])
}