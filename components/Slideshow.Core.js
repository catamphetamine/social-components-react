// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import SlideshowDimensions from './Slideshow.Dimensions.js'
import SlideshowDrag from './Slideshow.Drag.js'
import SlideshowFullscreen from './Slideshow.Fullscreen.js'
import SlideshowKeyboard from './Slideshow.Keyboard.js'
import SlideshowOpenCloseAnimation, { transformInitialProps as slideshowOpenCloseAnimationTransformInitialProps } from './Slideshow.OpenCloseAnimation.js'
import SlideshowOpenCloseAnimationFade from './Slideshow.OpenCloseAnimationFade.js'
import SlideshowOpenCloseAnimationFloat from './Slideshow.OpenCloseAnimationFloat.js'
import SlideshowOpenPictureInHoverMode, { transformInitialProps as slideshowOpenPictureInHoverModeTransformInitialProps } from './Slideshow.OpenPictureInHoverMode.js'
import SlideshowPanAndZoomMode from './Slideshow.PanAndZoomMode.js'
import SlideshowPinchZoom from './Slideshow.PinchZoom.js'
import SlideshowPointer from './Slideshow.Pointer.js'
import SlideshowResize from './Slideshow.Resize.js'
import SlideshowScale, { getInitialScaleForSlide } from './Slideshow.Scale.js'
import SlideshowSize from './Slideshow.Size.js'
import SlideshowSlides from './Slideshow.Slides.js'
import SlideshowTouch from './Slideshow.Touch.js'
import SlideshowTouches from './Slideshow.Touches.js'
import SlideshowTransform from './Slideshow.Transform.js'
import { getViewerForSlide } from './Slideshow.Viewer.js'

export default class Slideshow {
	constructor(props) {
		this.initialize_(props)
	}

	resetListeners() {
		this.listeners = {}
	}

	initialize_(props) {
		this.initializeProps(props)
		this.initializeState()
		this.resetListeners()

		this.modules = this.getModules()
		this.addModuleFunctions()

		this.lock()
	}

	initialize({ container }) {
		this.addInternalEventListeners()
		this.addModuleEventListeners()

		// Trigger "init" event listeners.
		this.init({ container })
	}

	initializeProps(props) {
		if (props.openPictureInHoverMode) {
			props = slideshowOpenPictureInHoverModeTransformInitialProps(props)
		}
		props = slideshowOpenCloseAnimationTransformInitialProps(props)
		this.props = props
	}

	initializeState() {
		this.state = getInitialState(this.props)
		setShownSlideIndexesInState(this.state, this.props, {
			currentSlideIndex: this.props.initialSlideIndex,
			didScrollThroughSlides: this.didScrollThroughSlides
		})
	}

	getModules() {
		const props = this.props

		return [
			new SlideshowDimensions(this, {
				getSlideDOMNode: props.getSlideDOMNode
			}),

			new SlideshowTransform(this, {
				getSlideDOMNode: props.getSlideDOMNode
			}),

			new SlideshowSlides(this, {
				slides: props.slides,
				initialSlideIndex: props.initialSlideIndex
			}),

			new SlideshowPinchZoom(this, {
				onPinchZoom: ({
					// zoomRatio,
					fitChange,
					followPinchZoomOrigin,
					doesFitInTheAvailableSpace,
					onStopped
				}) => {
					// Enter "Pan and Zoom" mode when the user starts pinch-zooming.
					if (!this.panAndZoomMode.isPanAndZoomMode()) {
						this.panAndZoomMode.enterPanAndZoomMode()
						//
						// The code below intended to enter "Pan and Zoom" mode only when
						// `zoomRatio` is `> 1`. But then that idea was discarded,
						// perhaps because it didn't work.
						//
						// // Comparing to `1.01` here instead of `1`
						// // to avoid any hypothetical issues related to precision factor.
						// // (not that there were any — didn't test, because DevTools doesn't have multi-touch).
						// if (zoomRatio > 1.01) {
						// 	this.panAndZoomMode.enterPanAndZoomMode()
						// }
					}

					if (this.panAndZoomMode.isPanAndZoomMode()) {
						// When the user moves their fingers, drag the slide accordingly.
						// The origin point is the point half-between the two touches.
						followPinchZoomOrigin()

						// If the slide was originally zoomed it to the point of overflowing the available screen space
						// and then is being zooming out, then listen to the event when the slide is zoomed out
						// to the point of fitting on screen, and in that case exit "Pan and Zoom" mode
						// because there's no need for it anymore since the slide now fits the screen.
						if (fitChange === 'fits') {
							this.panAndZoomMode.exitPanAndZoomMode()
							this.touch.ignoreTouchMoveEventsForCurrentTouches(true)
							return onStopped()
						}
					}
				}
			}),

			new SlideshowPanAndZoomMode(this, {
				onEnterPanAndZoomMode: () => {
					if (props.onPanAndZoomModeChange) {
						props.onPanAndZoomModeChange(true)
					}
					// Snapshot the "base" offset for the slide.
					// Any further "Pan and Scale" transforms will be applied on top
					// of this "base" offset.
					const { i, scale } = this.getState()
					const [offsetX, offsetY] = this.getBaseOffsetForSlide(i, {
						scale
					})
					this.drag.setSlideOffsetX(offsetX)
					this.drag.setSlideOffsetY(offsetY)
				},
				onExitPanAndZoomMode: () => {
					if (props.onPanAndZoomModeChange) {
						props.onPanAndZoomModeChange(false)
					}
					this.pinchZoom.stopPinchZoom({ shouldApplyScaleValue: false })
					this.drag.stopDragInertialMovement()
				},
				scaleAnimationDuration: props.scaleAnimationDuration,
				focus: props.focus
			}),

			new SlideshowResize(this, props),

			new SlideshowSize(this, {
				inline: props.inline,
				isRendered: props.isRendered,
				getWidth: props.getWidth,
				getHeight: props.getHeight,
				headerHeight: props.headerHeight,
				footerHeight: props.footerHeight,
				margin: props.margin,
				minMargin: props.minMargin,
				fullScreenFitPrecisionFactor: props.fullScreenFitPrecisionFactor,
				viewers: props.viewers
			}),

			new SlideshowFullscreen(this),

			new SlideshowOpenCloseAnimation(this, {
				initialSlideIndex: props.initialSlideIndex,
				animateOpen: props.animateOpen,
				animateOpenClose: props.animateOpenClose,
				animateCloseOnPanOut: props.animateCloseOnPanOut,
				getSlideDOMNode: props.getSlideDOMNode,
				imageElement: props.imageElement
			}, {
				openPictureInHoverMode: props.openPictureInHoverMode
					? new SlideshowOpenPictureInHoverMode(this, {
						getSlideDOMNode: props.getSlideDOMNode,
						initialSlideIndex: props.initialSlideIndex,
						imageElementCoords: props.imageElementCoords
					})
					: undefined,
				animations: {
					float: SlideshowOpenCloseAnimationFloat,
					fade: SlideshowOpenCloseAnimationFade
				},
				// animateOpenTransitionForInitialSlide: props.animateOpen === 'float' && props.openPictureInHoverMode ? new SlideshowOpenCloseAnimationFloat(this) : new SlideshowOpenCloseAnimationFade(),
				// animateCloseTransitionForInitialSlide: props.animateClose === 'float' && props.openPictureInHoverMode ? new SlideshowOpenCloseAnimationFloat(this) : new SlideshowOpenCloseAnimationFade(),
				// animateCloseTransition: props.animateClose ? new SlideshowOpenCloseAnimationFade() : undefined
			}),

			new SlideshowScale(this, {
				scaleStep: props.scaleStep,
				getSlideDOMNode: props.getSlideDOMNode,
				onScaleChange: props.onScaleChange,
				scaleAnimationDuration: props.scaleAnimationDuration,
				minScaledSlideRatio: props.minScaledSlideRatio,
				initialSlideIndex: props.initialSlideIndex,
				imageElementCoords: props.imageElementCoords,
				minSlideScaleFactorRelativeToThumbnailSize: props.minSlideScaleFactorRelativeToThumbnailSize,
				viewers: props.viewers,
				onScaleUp: ({ event, scaleFactor }) => {
					if (!this.panAndZoomMode.isPanAndZoomMode()) {
						if (this.scale.willNoLongerFitTheScreenAfterScalingUp(scaleFactor)) {
							let canEnterPanAndZoomMode;
							// When a user starts zooming in a picture or video using a mouse wheel,
							// first it zooms in until it reaches the "max size" for the current screen size.
							const MIN_INTERVAL_FOR_MOUSE_WHEEL_SCALING_TO_ENTER_PAN_AND_ZOOM_MODE = 300
							if (event.type === 'wheel') {
								if (this.scale.getLatestScaleTime()) {
									canEnterPanAndZoomMode = Date.now() - this.scale.getLatestScaleTime() >= MIN_INTERVAL_FOR_MOUSE_WHEEL_SCALING_TO_ENTER_PAN_AND_ZOOM_MODE
								} else {
									canEnterPanAndZoomMode = true
								}
							} else {
								// When zooming in via keyboard.
								canEnterPanAndZoomMode = true;
							}
							if (canEnterPanAndZoomMode) {
								this.scale.resetLatestScaleTime()
								this.panAndZoomMode.enterPanAndZoomMode()
							}
						}
					}
					if (this.panAndZoomMode.isPanAndZoomMode()) {
						this.scale.setCustomScaleOrigin(event)
					}
				},
				onScaleDown: ({ event }) => {
					if (this.panAndZoomMode.isPanAndZoomMode()) {
						this.scale.setCustomScaleOrigin(event)
					}
				},
				shouldRestrictMaxScale: () => {
					if (this.panAndZoomMode.isPanAndZoomMode()) {
						return false
					} else {
						return true
					}
				},
				getMinScaleForSlide: (slide) => {
					// When scaling a slide in "Pan & Zoom" mode,
					// it's easy for a user to scale the slide down to `0.00000001` level
					// when using a mouse with a free-spin wheel, like Logitech Master MX.
					// At those tiny scale numbers, the web browser usually freezes.
					// To prevent the web browser from freezing, a minimum slide size is introduced
					// in "Pan & Zoom" mode.
					if (this.panAndZoomMode.isPanAndZoomMode()) {
						return props.minSlideSizeWhenScaledDown / Math.max(
							this.getSlideInitialWidth(slide),
							this.getSlideInitialHeight(slide)
						)
					} else {
						return true
					}
				}
			}),

			new SlideshowDrag(this, {
				getDirection: () => {
					if (this.panAndZoomMode.isPanAndZoomMode()) {
						return 'free'
					} else {
						return 'xy'
					}
				},
				// Assume drag animation duration to be same as scale animation duration.
				animationDuration: props.scaleAnimationDuration,
				emulatePanResistanceOnFirstAndLastSlides: props.emulatePanResistanceOnFirstAndLastSlides,
				dragOffsetThreshold: props.dragOffsetThreshold,
				onDragStart: props.onDragStart,
				onDragEnd: props.onDragEnd,
				inline: props.inline,
				panSlideInAnimationDuration: props.panSlideInAnimationDuration,
				panSlideInAnimationDurationMin: props.panSlideInAnimationDurationMin,
				updateSlideshowPanOffset: ({ slideIndex }) => props.setSlideshowPanTransform(this.getSlideshowPanTransform({ slideIndex })),
				setSlideshowPanTransitionDuration: props.setSlideshowPanTransitionDuration,
				setOverlayTransitionDuration: props.setOverlayTransitionDuration,
				// updateSlideRollTransitionDuration: () => props.setSlideshowPanTransitionDuration(this.getSlideRollTransitionDuration()),
				// updateOverlayTransitionDuration: () => props.setOverlayTransitionDuration(this.getOverlayTransitionDuration()),
				setOverlayBackgroundColor: props.setOverlayBackgroundColor,
				isRendered: props.isRendered
			}),

			new SlideshowPointer(this, {
				closeOnOverlayClick: props.closeOnOverlayClick,
				isOverlay: props.isOverlay,
				inline: props.inline,
				mouseWheelScaleFactor: props.mouseWheelScaleFactor,
				isButton: props.isButton
			}),

			new SlideshowTouch(this),

			new SlideshowTouches(this, {
				isButton: props.isButton
			}),

			new SlideshowKeyboard(this, {
				getSlideDOMNode: props.getSlideDOMNode
			})
		]
	}

	addModuleEventListeners() {
		for (const mod of this.modules) {
			if (mod.addEventListeners) {
				mod.addEventListeners()
			}
		}
	}

	addModuleFunctions() {
		for (const mod of this.modules) {
			if (mod.getFunctions) {
				copyProperties(mod.getFunctions(), this)
			}
		}
	}

	addInternalEventListeners() {
		// Darken the overlay when started swiping slides.
		this.addEventListener('slideChange', ({ i }) => {
			// Pan interaction performs its own overlay opacity animation,
			// and after that animation is finished, it changes the slide.
			// The slide could also change by a keyboard key press (Left/Right/etc).
			if (this.shouldAnimateOverlayOpacityWhenPagingThrough()) {
				// Turns out, animating overlay opacity on slide change by a
				// keyboard key press (Left/Right/etc) doesn't look good,
				// to the point that a simple "immediate" transition looks better.
				// const ANIMATE_OVERLAY_OPACITY_DURATION_ON_SLIDE_CHANGE = 70
				// const animateOverlayOpacityDurationOnSlideChange = interaction === 'pan' ? undefined : ANIMATE_OVERLAY_OPACITY_DURATION_ON_SLIDE_CHANGE
				this.setState({
					overlayOpacityForCurrentSlide: this.getOverlayOpacityWhenPagingThrough(),
					// animateOverlayOpacityDurationOnSlideChange
				})
				// if (animateOverlayOpacityDurationOnSlideChange) {
				// 	let timer = setTimeout(() => {
				// 		timer = undefined
				// 		this.setState({
				// 			animateOverlayOpacityDurationOnSlideChange: undefined
				// 		})
				// 	}, animateOverlayOpacityDurationOnSlideChange)
				// 	this.setCleanUpOverlayOpacityAnimation(() => {
				// 		if (timer) {
				// 			clearTimeout(timer)
				// 		}
				// 	})
				// }
			}
		})

		// Focus slide on change slide.
		this.addEventListener('stateChange', ({ newState, prevState }) => {
			const { i } = newState
			const { i: prevIndex } = prevState
			// On change current slide.
			if (i !== prevIndex) {
				const { focus } = this.props
				focus(i > prevIndex ? 'next' : 'previous')
			}
		})

		// Reset slide state.
		this.addEventListener('slideChange', ({ i }) => {
			setShownSlideIndexesInState(this.state, this.props, {
				currentSlideIndex: i,
				didScrollThroughSlides: this.didScrollThroughSlides
			})
			// this.onHideSlide()
			this.setState({
				...getInitialSlideState(i, { props: this.props }),
				hasChangedSlide: true,
				slideIndexAtWhichTheSlideshowIsBeingOpened: undefined
			})
		})

		// // Testing "Pan and Zoom" mode.
		// this.addEventListener('init', () => enterPanAndZoomMode())
	}

	getState() {
		return this.state
	}

	setState(newState) {
		this.state = {
			...this.state,
			...newState
		}
		this._setState(this.state)
	}

	onSetState(setState) {
		this._setState = setState
	}

	init({ container }) {
		this.triggerEventListeners('init', { container })
	}

	cleanUp() {
		this.triggerEventListeners('cleanUp')

		this.resetListeners()

		clearTimeout(this.closeTimeout)
	}

	// This function should only be called in `constructor()`s.
	// The reason is that `.cleanUp()` might be called several times
	// because of React's "strict" mode (which runs hooks twice on mount)
	// so `.cleanUp()` behavior should be "idempotent".
	// Only calling `.onCleanUp()` in `constructor()`s makes
	// `.cleanUp()` behavior more "idempotent".
	//
	// The `cleanUp` argument function might be called several times
	// and it should behave the same way every such time.
	//
	onCleanUp(listener) {
		this.addEventListener('cleanUp', listener)
	}

	addEventListener(event, listener, { immediate, once } = {}) {
		listener = { listener, immediate, once }

		// Add the `listener`.
		if (!this.listeners[event]) {
			this.listeners[event] = []
		}
		this.listeners[event].push(listener)

		// Return a function that removes the event listener.
		return () => {
			this.removeEventListener(event, listener)
		}
	}

	removeEventListener(event, listener) {
		this.listeners[event] = this.listeners[event].filter(_ => _ !== listener)
	}

	triggerEventListeners(event, arg) {
		if (!this.listeners[event]) {
			return []
		}
		const removeListeners = []
		const results = []
		for (const listener of this.listeners[event]) {
			const { listener: func, once } = listener
			if (once) {
				removeListeners.push(listener)
			}
			results.push(func(arg))
		}
		if (removeListeners.length > 0) {
			this.listeners[event] = this.listeners[event].filter(_ => removeListeners.indexOf(_) < 0)
		}
		return results
	}

	hasOpened() {
		this.unlock()
		this.triggerEventListeners('open')
	}

	handleStateUpdate(newState, prevState, { immediate } = {}) {
		if (immediate) {
			this.triggerEventListeners('stateChangeImmediate', { newState, prevState })
		} else {
			this.triggerEventListeners('stateChange', { newState, prevState })
		}
	}

	// Only execute `fn` if the component is still mounted.
	// Can be used for `setTimeout()` and `Promise`s.
	ifStillMounted = (fn) => (...args) => {
		const { isRendered } = this.props
		if (isRendered()) {
			fn.apply(this, args)
		}
	}

	getOverlayOpacityForCurrentSlide() {
		const { overlayOpacityForCurrentSlide } = this.state
		return overlayOpacityForCurrentSlide
	}

	getOverlayOpacityWhenPagingThrough() {
		const { overlayOpacityWhenPagingThrough } = this.props
		if (overlayOpacityWhenPagingThrough !== undefined) {
			return overlayOpacityWhenPagingThrough
		}
		const { overlayOpacity } = this.props
		return overlayOpacity
	}

	getOverlayBackgroundColor = (opacity) => {
		return `rgba(0,0,0,${opacity})`
	}

	isTransparentBackground(slide) {
		const viewer = this.getViewerForSlide(slide)
		if (viewer && viewer.isTransparentBackground) {
			return viewer.isTransparentBackground(slide)
		}
	}

	getContainerDOMNode() {
		const { getContainerDOMNode } = this.props
		return getContainerDOMNode()
	}

	onOpenExternalLink = (event) => {
		// this.onActionClick()
		const downloadInfo = this.getViewerForSlide().download(this.getCurrentSlide())
		if (downloadInfo) {
			// downloadFile(downloadInfo.url, downloadInfo.title)
		}
	}

	onSlideClick = (event) => {
		// This block of code is intentionally placed above `this.locked` check
		// because otherwise clicks while panning wouldn't be cancelled.
		// A "click" event is emitted on mouse up
		// when a user finishes panning to next/previous slide.
		if (this.drag.hasBeenDragging() || this.shouldIgnoreClickEvent(event)) {
			// Prevent default so that the video slide doesn't play.
			event.preventDefault()
			// Stop propagation so that `onBackgroundClick` is not called.
			event.stopPropagation()
			return
		}
		if (this.locked) {
			return
		}
		this.resetAnimations()
		// Don't close the slideshow as a result of this click.
		// (because clicked inside the slide bounds, not outside it)
		event.stopPropagation()
		// Change the current slide to next or previous one.
		if (this.shouldShowNextSlideOnClick()) {
			const { closeOnSlideClick } = this.props
			if (closeOnSlideClick) {
				this.close()
			} else {
				this.showNext()
			}
			// if (x < previousNextClickRatio) {
			// 	this.showPrevious()
			// } else {
			// 	this.showNext()
			// }
		}
	}

	shouldShowNextSlideOnClick() {
		if (!this.getViewerForSlide().allowChangeSlideOnClick) {
			return false
		}
		return true
	}

	shouldAnimateOverlayOpacityWhenPagingThrough() {
		const { overlayOpacityForCurrentSlide } = this.state
		if (overlayOpacityForCurrentSlide !== this.getOverlayOpacityWhenPagingThrough()) {
			return true
		}
	}

	shouldShowShowMoreControlsButton() {
		const { showControls } = this.props
		if (!showControls) {
			return false
		}
		return true
	}

	shouldShowPreviousNextButtons() {
		const { isTouchDevice, showControls } = this.props
		if (!showControls) {
			return false
		}
		// // Don't show "Previous"/"Next" buttons.
		// // Because on touch devices the user is supposed to be able to swipe through slides
		// // and on desktop advanced users perhaps will guess to swipe slides too using a mouse.
		// // Picture slides transition to the next slide upon click.
		// // Also slide dots are clickable buttons
		// // (as a backup for those who won't guess to swipe with a mouse).
		// // It's a known bug that in iOS Safari it doesn't respond to swiping YouTube video.
		// // For such cases small screens show the single "Show controls" button.
		// return false
		// On touch devices users can just swipe, except when they can't.
		if (isTouchDevice()) {
			// It's a known bug that in iOS Safari it doesn't respond to swiping YouTube video.
			if (this.getViewerForSlide().canSwipe &&
				!this.getViewerForSlide().canSwipe(this.getCurrentSlide())) {
				// Show "Previous"/"Next" buttons because the user may not be
				// able to swipe to the next/previous slide.
			} else {
				// Normally a touch device user should swipe left/right to view previous/next slide.
				return false
			}
		}
		// // For pictures the user can just click through them.
		// if (this.shouldShowNextSlideOnClick()) {
		// 	return false
		// }
		// Commented the following code block because it's `return true` after it anyway.
		// // Users may not always have a keyboard (for example, TV users).
		// // But those users who only have a keyboard ("accessibility")
		// // should be able to switch slides using just the keyboard
		// // and they'll be able to by focusing on the previous/next buttons via the "Tab" key.
		// // Though keyboard-only users can also use "Page Up"/"Page Down" keys.
		// // (but that's not an intuitively obvious feature).
		// if (this.getViewerForSlide().capturesArrowKeys) {
		// 	if (this.getViewerForSlide().capturesArrowKeys(this.getCurrentSlide())) {
		// 		return true
		// 	}
		// }
		// Show the "Previous"/"Next" buttons.
		return true
	}

	hasHidableControls() {
		return this.shouldShowScaleButtons() ||
			this.shouldShowOpenExternalLinkButton() ||
			this.getOtherActions().length > 0
	}

	onShowMoreControls = () => {
		if (this.locked) {
			return
		}
		const { showMoreControls } = this.state
		this.setState({
			showMoreControls: !showMoreControls
		})
	}

	onRequestClose = (event) => {
		if (this.locked) {
			return
		}
		this.close()
	}

	close = ({ interaction } = {}) => {
		let closeAnimationDuration
		const results = this.triggerEventListeners('close', { interaction })
		for (const result of results) {
			if (result) {
				const { animationDuration, useLongerOpenCloseAnimation } = result
				if (animationDuration) {
					closeAnimationDuration = animationDuration
				}
				if (useLongerOpenCloseAnimation) {
					this.setState({
						useLongerOpenCloseAnimation: true
					})
				}
			}
		}

		const _close = () => {
			const { onClose } = this.props
			onClose()
		}

		if (closeAnimationDuration) {
			this.lock()
			this.closeTimeout = setTimeout(_close, closeAnimationDuration)
		} else {
			_close()
		}
	}

	lock = () => {
		this.locked = true
	}

	unlock = () => {
		this.locked = false
	}

	isLocked = () => {
		return this.locked
	}

	showPrevious = (options) => {
		const { i } = this.state
		if (this.isFirst()) {
			this.close(options)
		} else {
			this.didScrollThroughSlides = true
			this.showSlide(i - 1, options)
			return true
		}
	}

	showNext = (options) => {
		const { i } = this.state
		if (this.isLast()) {
			this.close(options)
		} else {
			this.didScrollThroughSlides = true
			this.showSlide(i + 1, options)
			return true
		}
	}

	showFirst = (options) => {
		if (!this.isFirst()) {
			this.showSlide(0, options)
		}
	}

	showLast = (options) => {
		if (!this.isLast()) {
			const { slides } = this.props
			this.showSlide(slides.length - 1, options)
		}
	}

	goToSlide = (number) => {
		const { i } = this.state
		const { slides } = this.props
		if (number > 0 && number <= slides.length) {
			this.didScrollThroughSlides = true
			this.showSlide(number - 1)
		}
	}

	onPeek = () => {
		if (!this.didScrollThroughSlides) {
			this.showPreviousNextSlides()
			this.didScrollThroughSlides = true
		}
	}

	resetAnimations = () => {
		this.drag.finishPanTransition()
	}

	isFirst = () => {
		const { i } = this.state
		return i === 0
	}

	isLast = () => {
		const { slides } = this.props
		const { i } = this.state
		return i === slides.length - 1
	}

	onShowPrevious = (event) => {
		if (this.locked) {
			return
		}
		// this.onActionClick()
		this.showPrevious()
	}

	onShowNext = (event) => {
		if (this.locked) {
			return
		}
		// this.onActionClick()
		this.showNext()
	}

	/**
	 * This is public API.
	 * Returns scale for a slide being rendered.
	 * @param  {number} slideIndex
	 * @return {number}
	 */
	getSlideScale(j) {
		const { i, scale } = this.state
		return i === j ? scale : getInitialScaleForSlide(this.getSlide(j), {
			props: this.props,
			isCurrentSlide: i === j
		})
	}

	getViewerForSlide = (slide = this.getCurrentSlide()) => {
		const { viewers } = this.props
		return getViewerForSlide(slide, viewers)
	}

	shouldShowScaleButtons() {
		// Until scaling is implemented, don't show the buttons.
		// And maybe even don't show them after scaling is implemented too.
		return false
		// const { inline } = this.props
		// return !inline && this.isMaxSizeSlide({ precise: false }) === false
	}

	shouldShowOpenExternalLinkButton() {
		if (this.getViewerForSlide().canOpenExternalLink) {
			return this.getViewerForSlide().canOpenExternalLink(this.getCurrentSlide())
		}
	}

	shouldShowCloseButton() {
		const {
			showControls,
			inline,
			slides
		} = this.props
		if (!showControls) {
			return false
		}
		// const {
		// 	showMoreControls
		// } = this.state
		if (inline) {
			return false
		}
		// If it's a single slide that closes on click then don't show the close button.
		if (slides.length === 1 && this.shouldShowNextSlideOnClick()) {
			return false
		}
		// // Don't show the "Close" button on small screens on touch devices.
		// // Because on touch devices the user is supposed to be able to
		// // swipe a slide vertically to close it.
		// if (this.isSmallScreen() && isTouchDevice()) {
		// 	// It's a known bug that in iOS Safari it doesn't respond to swiping YouTube video.
		// 	// For such cases the slideshow should show the "Close" button.
		// 	if (this.getViewerForSlide().canSwipe &&
		// 		!this.getViewerForSlide().canSwipe(this.getCurrentSlide())) {
		// 		// Show the "Close" button because the user may not be able to swipe-close the slide.
		// 	} else {
		// 		return false
		// 	}
		// }
		// // On desktops don't show the "Close" button
		// // because the user can swipe vertically to close,
		// // or they can click the overlay,
		// // or they can click through the rest of the slides.
		// if (this.isSmallScreen() && !isTouchDevice()) {
		// 	return false
		// }
		// Show the "Close" button.
		return true
	}

	// isSmallScreen() {
	// 	const { isSmallScreen } = this.props
	// 	return isSmallScreen()
	// }

	shouldShowPagination() {
		const { showPagination, showControls } = this.props
		if (showPagination) {
			return true
		}
		if (!showControls) {
			return false
		}
		return true
	}

	shouldShowMoreControls() {
		const { showControls } = this.props
		const { showMoreControls } = this.state
		if (this._shouldHideMoreControls() && !showMoreControls) {
			return false
		}
		if (!showControls) {
			return false
		}
		return true
	}

	_shouldHideMoreControls() {
		// // On "large" screens (FullHD and larger) control buttons are large too.
		// // On "medium" screens control buttons are small.
		// // Therefore, control buttons fit for both "medium" and "large" screens.
		// return this.isSmallScreen()
		// Actually, always hide more controls because it looks cleaner, even on desktops.
		return true
	}

	getOtherActions() {
		const viewer = this.getViewerForSlide()
		if (viewer.getOtherActions) {
			return viewer.getOtherActions(this.getCurrentSlide())
		}
		return []
	}
}

// function CONSOLE(...args) {
// 	console.log.apply(console, args)
// }

/**
 * Returns an initial state of the slideshow.
 * @return {object}
 */
export function getInitialState(props) {
	const {
		initialSlideIndex,
		inline,
		overlayOpacityForInitialSlide,
		slides
	} = props

	return {
		overlayOpacityForCurrentSlide: overlayOpacityForInitialSlide,
		slidesShown: new Array(slides.length),
		slideIndexAtWhichTheSlideshowIsBeingOpened: inline ? undefined : initialSlideIndex,
		openClosePhase: 'closed',
		...getInitialSlideState(initialSlideIndex, { props })
	}
}

function getInitialSlideState(i, { props }) {
	return {
		i,
		scale: getInitialScaleForSlide(props.slides[i], {
			props,
			isCurrentSlide: i === props.initialSlideIndex
		})
	}
}

function copyProperties(properties, target) {
	for (const propertyName of Object.keys(properties)) {
		if (propertyName in target) {
			throw new Error(`Property "${propertyName}" is already defined on the target`)
		}
		target[propertyName] = properties[propertyName]
	}
}

function setShownSlideIndexesInState(state, props, {
	currentSlideIndex: i,
	didScrollThroughSlides
}) {
	const { slides } = props
	const { slidesShown } = state

	// Only preload previous slide if the user already scrolled through slides.
	// Which means preload previous slides if the user has already navigated to a previous slide.
	function shouldPreloadPrevousSlide() {
		return didScrollThroughSlides
	}

	// Only preload next slide if the user already scrolled through slides
	// (which means preload previous slides if the user has already navigated to a previous slide),
	// or when viewing slideshow starting from the first slide
	// (which implies navigating through all slides in perspective).
	function shouldPreloadNextSlide() {
		const { i } = props
		return didScrollThroughSlides || i === 0
	}

	let j = 0
	while (j < slides.length) {
		// Also prefetch previous and next images for left/right scrolling.
		slidesShown[j] =
			(shouldPreloadPrevousSlide() && j === i - 1) ||
			j === i ||
			(shouldPreloadNextSlide() && j === i + 1)
		j++
	}
}