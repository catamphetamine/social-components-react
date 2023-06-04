// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import SlideshowSize from './Slideshow.Size.js'
import SlideshowResize from './Slideshow.Resize.js'
import SlideshowFullscreen from './Slideshow.Fullscreen.js'
import SlideshowScale from './Slideshow.Scale.js'
import SlideshowPan from './Slideshow.Pan.js'
import SlideshowPointer from './Slideshow.Pointer.js'
import SlideshowTouch from './Slideshow.Touch.js'
import SlideshowKeyboard from './Slideshow.Keyboard.js'
import SlideshowOpenCloseAnimation from './Slideshow.OpenCloseAnimation.js'
import SlideshowOpenCloseAnimationFloat from './Slideshow.OpenCloseAnimationFloat.js'
import SlideshowOpenCloseAnimationFade from './Slideshow.OpenCloseAnimationFade.js'
import SlideshowOpenPictureInHoverMode from './Slideshow.OpenPictureInHoverMode.js'

import { px, percent, scaleFactor as formatScaleFactor, ms } from 'web-browser-style'

export default class Slideshow {
	inits = []
	cleanUps = []
	onStateChangeListeners = []
	listeners = {
		slideChange: [],
		open: [],
		close: []
	}

	constructor(props) {
		if (props.openPictureInHoverMode) {
			props = SlideshowOpenPictureInHoverMode.getInitialProps(props)
		}
		props = SlideshowOpenCloseAnimation.getInitialProps(props)
		new SlideshowResize(this)
		this.size = new SlideshowSize(this, {
			inline: props.inline,
			isRendered: props.isRendered,
			getWidth: props.getWidth,
			getHeight: props.getHeight,
			headerHeight: props.headerHeight,
			footerHeight: props.footerHeight,
			margin: props.margin,
			minMargin: props.minMargin,
			fullScreenFitPrecisionFactor: props.fullScreenFitPrecisionFactor
		})
		this.fullscreen = new SlideshowFullscreen(this)
		if (props.openPictureInHoverMode) {
			this.openPictureInHoverMode = new SlideshowOpenPictureInHoverMode(this)
		}
		this.openCloseAnimation = new SlideshowOpenCloseAnimation(this)
		this.openCloseAnimationFade = new SlideshowOpenCloseAnimationFade(this)
		this.openCloseAnimationFloat = new SlideshowOpenCloseAnimationFloat(this)
		this.scale = new SlideshowScale(this)
		this.pan = new SlideshowPan(
			this,
			{
				emulatePanResistanceOnFirstAndLastSlides: props.emulatePanResistanceOnFirstAndLastSlides,
				panOffsetThreshold: props.panOffsetThreshold,
				onPanStart: props.onPanStart,
				onPanEnd: props.onPanEnd,
				inline: props.inline,
				panSlideInAnimationDuration: props.panSlideInAnimationDuration,
				panSlideInAnimationDurationMin: props.panSlideInAnimationDurationMin,
				updateSlideRollOffset: (slideIndex) => props.setSlideRollTransform(this.getSlideRollTransform(slideIndex)),
				setSlideRollTransitionDuration: props.setSlideRollTransitionDuration,
				setOverlayTransitionDuration: props.setOverlayTransitionDuration,
				// updateSlideRollTransitionDuration: () => props.setSlideRollTransitionDuration(this.getSlideRollTransitionDuration()),
				// updateOverlayTransitionDuration: () => props.setOverlayTransitionDuration(this.getOverlayTransitionDuration()),
				setOverlayBackgroundColor: props.setOverlayBackgroundColor,
				isRendered: props.isRendered
			}
		)
		this.pointer = new SlideshowPointer(
			this,
			{
				closeOnOverlayClick: props.closeOnOverlayClick,
				isOverlay: props.isOverlay,
				inline: props.inline,
				mouseWheelScaleFactor: props.mouseWheelScaleFactor
			}
		)
		this.touch = new SlideshowTouch(this)
		this.keyboard = new SlideshowKeyboard(this)
		this.props = props
		this.state = this.getInitialState()
		this.setState = (newState) => {
			this.state = {
				...this.state,
				...newState
			}
			this._setState(this.state)
		}
		this.markPicturesShown(props.initialSlideIndex)
		this.lock()
		// Darken the overlay when started swiping slides.
		this.onSlideChange((i, { interaction } = {}) => {
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
					maxOverlayOpacity: this.getOverlayOpacityWhenPagingThrough(),
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
		this.onStateChange((newState, prevState) => {
			const { i } = newState
			const { i: prevIndex } = prevState
			// On change current slide.
			if (i !== prevIndex) {
				const { focus } = this.props
				focus(i > prevIndex ? 'next' : 'previous')
			}
		})
		// Reset "Drag and Scale" mode exit timer.
		this.onCleanUp(() => {
			this.resetExitDragAndScaleModeTimer()
			// this.resetEmulateTouchScaleAnimationFrame()
		})
		this.onSlideChange(() => {
			this.resetDragAndScaleMode()
			this.resetExitDragAndScaleModeTimer()
			// this.resetEmulateTouchScaleAnimationFrame()
		})
		// Reset fixed origin.
		this.resetScaleOrigin()
		this.resetScaleOriginOffset()
		this.onSlideChange(() => {
			this.resetScaleOrigin()
			this.resetScaleOriginOffset()
		})
		// Reset slide state.
		this.onSlideChange((i) => {
			this.markPicturesShown(i)
			// this.onHideSlide()
			this.setState({
				...this.getInitialSlideState(i),
				hasChangedSlide: true,
				slideIndexAtWhichTheSlideshowIsBeingOpened: undefined
			})
		})
		// Reset slide transition resetter.
		this.onCleanUp(this.resetResetSlideTransitionTimer)
		this.onSlideChange(this.resetResetSlideTransitionTimer)
		// // Testing "Drag and Scale" mode.
		// this.onInit(() => this.enterDragAndScaleMode())
	}

	getState() {
		return this.state
	}

	/**
	 * Returns an initial state of the slideshow.
	 * @return {object}
	 */
	getInitialState() {
		const {
			initialSlideIndex,
			inline,
			overlayOpacity,
			slides
		} = this.props
		return {
			maxOverlayOpacity: overlayOpacity,
			slidesShown: new Array(slides.length),
			slideIndexAtWhichTheSlideshowIsBeingOpened: inline ? undefined : initialSlideIndex,
			...this.getInitialSlideState(initialSlideIndex),
			...this.openCloseAnimation.getInitialState()
		}
	}

	getInitialSlideState(i) {
		return {
			i,
			scale: this.scale.getInitialScaleForSlide(this.getSlide(i))
		}
	}

	onSetState(setState) {
		this._setState = setState
	}

	init(parameters) {
		for (const init of this.inits) {
			init(parameters)
		}
	}

	onInit(init) {
		this.inits.push(init)
	}

	cleanUp() {
		for (const cleanUp of this.cleanUps) {
			cleanUp()
		}
		clearTimeout(this.slideChangedTimeout)
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
	onCleanUp(cleanUp) {
		this.cleanUps.push(cleanUp)
	}

	addEventListener(event, listener, options = {}) {
		listener = { listener, options }
		this.listeners[event].push(listener)
		// Removes the event listener.
		return () => {
			this.listeners[event] = this.listeners[event].filter(_ => _ !== listener)
		}
	}

	triggerListeners() {
		const event = arguments[0]
		const args = Array.prototype.slice.call(arguments, 1)
		const removeListeners = []
		const results = []
		for (const listener of this.listeners[event]) {
			const { listener: func, options } = listener
			if (options.once) {
				removeListeners.push(listener)
			}
			results.push(func.apply(this, args))
		}
		if (removeListeners.length > 0) {
			this.listeners[event] = this.listeners[event].filter(_ => removeListeners.indexOf(_) < 0)
		}
		return results
	}

	onSlideChange(listener, options) {
		return this.addEventListener('slideChange', listener, options)
	}

	handleRender(newState, prevState, { immediate } = {}) {
		for (const listener of this.onStateChangeListeners) {
			if (immediate && listener.immediate ||
				!immediate && !listener.immediate) {
				listener.listener(newState, prevState)
			}
		}
	}

	onStateChange(listener, options) {
		this.onStateChangeListeners.push({
			...options,
			listener
		})
	}

	removeOnStateChangeListener(listener) {
		this.onStateChangeListeners = this.onStateChangeListeners.filter(_ => _ !== listener)
	}

	// Only execute `fn` if the component is still mounted.
	// Can be used for `setTimeout()` and `Promise`s.
	ifStillMounted = (fn) => (...args) => {
		const { isRendered } = this.props
		if (isRendered()) {
			fn.apply(this, args)
		}
	}

	markPicturesShown(i) {
		const { slides } = this.props
		const { slidesShown } = this.state
		let j = 0
		while (j < slides.length) {
			// Also prefetch previous and next images for left/right scrolling.
			slidesShown[j] =
				(this.shouldPreloadPrevousSlide() && j === i - 1) ||
				j === i ||
				(this.shouldPreloadNextSlide() && j === i + 1)
			j++
		}
	}

	// Only preload previous slide if the user already scrolled through slides.
	// Which means preload previous slides if the user has already navigated to a previous slide.
	shouldPreloadPrevousSlide() {
		return this.didScrollThroughSlides
	}

	// Only preload next slide if the user already scrolled through slides
	// (which means preload previous slides if the user has already navigated to a previous slide),
	// or when viewing slideshow starting from the first slide
	// (which implies navigating through all slides in perspective).
	shouldPreloadNextSlide() {
		const { i } = this.props
		return this.didScrollThroughSlides || i === 0
	}

	showPreviousNextSlides() {
		const { slides } = this.props
		const { i } = this.state
		let { slidesShown } = this.state
		// Show previous slide.
		if (i > 0) {
			if (!slidesShown[i - 1]) {
				slidesShown = slidesShown.slice()
				slidesShown[i - 1] = true
			}
		}
		// Show next slide.
		if (i < slides.length - 1) {
			if (!slidesShown[i + 1]) {
				slidesShown = slidesShown.slice()
				slidesShown[i + 1] = true
			}
		}
		this.setState({
			slidesShown
		})
	}

	showSlide = (i, options = {}) => {
		const { i: iPrevious } = this.state
		if (i === iPrevious) {
			return
		}
		const triggerSlideChanged = () => this.triggerListeners('slideChange', i, options)
		if (options.animationDuration) {
			this.slideChangedTimeout = setTimeout(triggerSlideChanged, options.animationDuration)
		} else {
			triggerSlideChanged()
		}
	}

	// onHideSlide() {
	// 	const plugin = this.getPluginForSlide(this.getCurrentSlide())
	// 	if (plugin.onHideSlide) {
	// 		plugin.onHideSlide(
	// 			this.getCurrentSlide(),
	// 			this.currentSlideRef.current,
	// 			this.props
	// 		)
	// 	}
	// }

	// onShowSlide() {
	// 	const plugin = this.getPluginForSlide(this.getCurrentSlide())
	// 	if (plugin.onShowSlide) {
	// 		plugin.onShowSlide(
	// 			this.getCurrentSlide(),
	// 			this.currentSlideRef.current,
	// 			this.props
	// 		)
	// 	}
	// }

	getScaleFactor(scale) {
		const { scale: currentScale } = this.state
		return scale / currentScale
	}

	onScaleUp = (event, scaleFactor = 1) => {
		if (this.locked) {
			return
		}
		// // Debugging multi-touch zoom.
		// // DevTools doesn't provide the means to test multi-touch.
		// if (this.emulateInteractiveZoom(event)) {
		// 	return
		// }
		// // Can be used for testing touch zoom.
		// // Isn't used in production.
		// return this.emulateInteractiveZoom(event, 'zoomIn')
		if (!this.isDragAndScaleMode()) {
			if (this.canEnterDragAndScaleMode(event)) {
				if (this.scale.willScalingUpExceedMaxSize(scaleFactor)) {
					this.enterDragAndScaleMode()
				}
			}
		}
		this.fixDragAndScaleModeOrigin(event)
		// this.onActionClick()
		this.scale.scaleUp(scaleFactor)
	}

	onScaleDown = (event, scaleFactor = 1) => {
		if (this.locked) {
			return
		}
		// // Can be used for testing touch zoom.
		// // Isn't used in production.
		// return this.emulateInteractiveZoom(event, 'zoomOut')
		this.fixDragAndScaleModeOrigin(event)
		// this.onActionClick()
		this.scale.scaleDown(scaleFactor)
	}

	/**
	 * Can be used for testing touch zoom.
	 * DevTools doesn't provide the means to test multi-touch.
	 * Isn't used in production.
	 */
	emulateInteractiveZoom(event) {
		if (!(event.type === 'wheel' && event.shiftKey)) {
			return
		}
		if (this.ignoreCurrentTouches) {
			this.ignoreCurrentTouches = undefined
		}
		if (this.isInteractivelyZooming()) {
			return console.error('Already interactively zooming')
		}
		let secondTouchCoords = [event.clientX, event.clientY]
		const firstTouchCoords = [
			secondTouchCoords[0] - Math.random() * 100,
			secondTouchCoords[1] - Math.random() * 100
		]
		const getDistance = () => Math.sqrt(
			(secondTouchCoords[0] - firstTouchCoords[0]) * (secondTouchCoords[0] - firstTouchCoords[0]) +
			(secondTouchCoords[1] - firstTouchCoords[1]) * (secondTouchCoords[1] - firstTouchCoords[1])
		)
		console.log('### Start Interactive Zoom Emulation (release Shift key and move the mouse to exit interactive zoom emulation)')
		this.startInteractiveZoom(
			() => [
				firstTouchCoords[0] + (secondTouchCoords[0] - firstTouchCoords[0]) / 2,
				firstTouchCoords[1] + (secondTouchCoords[1] - firstTouchCoords[1]) / 2
			],
			getDistance
		)
		const TOUCH_ELEMENT_WIDTH = 20
		function createTouchElement(x, y) {
			const element = document.createElement('div')
			element.style.position = 'absolute'
			element.style.top = px(y - TOUCH_ELEMENT_WIDTH / 2)
			element.style.left = px(x - TOUCH_ELEMENT_WIDTH / 2)
			element.style.zIndex = 1000
			element.style.width = px(TOUCH_ELEMENT_WIDTH)
			element.style.height = px(TOUCH_ELEMENT_WIDTH)
			element.style.borderRadius = px(TOUCH_ELEMENT_WIDTH / 2)
			element.style.border = '1px solid rgba(0,0,0,0.3)'
			element.style.background = 'rgba(255,0,0,0.3)'
			document.body.appendChild(element)
			return element
		}
		const firstTouchElement = createTouchElement(firstTouchCoords[0], firstTouchCoords[1])
		const secondTouchElement = createTouchElement(secondTouchCoords[0], secondTouchCoords[1])
		this.emulateInteractiveZoomMouseMoveListener = (event) => {
			if (event.shiftKey) {
				secondTouchCoords = [event.clientX, event.clientY]
				secondTouchElement.style.top = px(secondTouchCoords[1] - TOUCH_ELEMENT_WIDTH / 2)
				secondTouchElement.style.left = px(secondTouchCoords[0] - TOUCH_ELEMENT_WIDTH / 2)
				this.updateInteractiveZoom()
			} else {
				// `resetEmulateInteractiveZoom()` could have already been called
				// in `exitDragAndScaleMode()` when pushed `Esc` to exit "Drag and Scale"
				// mode before moving a mouse with "Shift" key released.
				if (this.resetEmulateInteractiveZoom) {
					this.resetEmulateInteractiveZoom()
				}
			}
		}
		this.resetEmulateInteractiveZoom = () => {
			console.log('### End Interactive Zoom Emulation')
			this.endInteractiveZoom()
			document.removeEventListener('mousemove', this.emulateInteractiveZoomMouseMoveListener)
			document.body.removeChild(firstTouchElement)
			document.body.removeChild(secondTouchElement)
			this.emulateInteractiveZoomMouseMoveListener = undefined
			this.resetEmulateInteractiveZoom = undefined
		}
		document.addEventListener('mousemove', this.emulateInteractiveZoomMouseMoveListener)
		return true
	}

	// /**
	//  * Can be used for testing touch zoom.
	//  * Isn't used in production.
	//  */
	// emulateInteractiveZoom(event, direction) {
	// 	if (this.isInteractivelyZooming()) {
	// 		// Already zooming.
	// 		return false
	// 	}
	// 	// if (this.emulateInteractiveZoomAnimationFrame) {
	// 	// 	cancelAnimationFrame(this.emulateInteractiveZoomAnimationFrame)
	// 	// }
	// 	const startedAt = Date.now()
	// 	const duration = 1000
	// 	const { i } = this.state
	// 	const { x, y, width, height } = this.getSlideCoordinates(i)
	// 	const originRatio = this.getOriginRatio(event.clientX, event.clientY)
	// 	const center = [
	// 		x + width * originRatio.x,
	// 		y + height * originRatio.y
	// 	]
	// 	const getDistance = () => {
	// 		switch (direction) {
	// 			case 'zoomIn':
	// 				return 1000 + (Date.now() - startedAt)
	// 			case 'zoomOut':
	// 				return 2000 - (Date.now() - startedAt)
	// 			default:
	// 				throw new Error(`Incorrect zoom direction: ${direction}`)
	// 		}
	// 	}
	// 	this.startInteractiveZoom(
	// 		() => center,
	// 		getDistance
	// 	)
	// 	const scheduleZoomFrame = () => {
	// 		this.emulateInteractiveZoomAnimationFrame = requestAnimationFrame(() => {
	// 			// Zooming might have been cancelled.
	// 			// For example, on slide drag.
	// 			if (!this.isInteractivelyZooming()) {
	// 				return
	// 			}
	// 			if (Date.now() < startedAt + duration) {
	// 				this.updateInteractiveZoom()
	// 				scheduleZoomFrame()
	// 			} else {
	// 				this.endInteractiveZoom()
	// 				this.emulateInteractiveZoomAnimationFrame = undefined
	// 			}
	// 		})
	// 	}
	// 	scheduleZoomFrame()
	// }

	fixDragAndScaleModeOrigin(event) {
		if (this.isDragAndScaleMode() && !this.hasScaleOriginBeenSet()) {
			const { i, scale } = this.state
			if (event.type === 'wheel') {
				this.setScaleOrigin(event.clientX, event.clientY)
			} else {
				const { getSlideDOMNode, inline } = this.props
				const { x, y, width, height } = this.getSlideCoordinates(i)
				const slideshowWidth = this.getSlideshowWidth()
				const slideshowHeight = this.getSlideshowHeight()
				let originX = x + width / 2
				let originY = y + height / 2
				if (!inline) {
					const centerX = slideshowWidth / 2
					const centerY = slideshowHeight / 2
					const dr = Math.min(slideshowWidth, slideshowHeight) * 0.1
					const dx = dr
					const dy = dr
					if (x < centerX - dx &&
						x + width > centerX + dx &&
						y < centerY - dy &&
						y + height > centerY + dy) {
						originX = centerX
						originY = centerY
					}
				}
				this.setScaleOrigin(originX, originY)
			}
		}
	}

	canEnterDragAndScaleMode(event) {
		// When a user starts zooming in a picture or video using a mouse wheel,
		// first it zooms in until it reaches the "max size" for the current screen size.
		if (event.type === 'wheel') {
			return !this.isAnimatingScale()
		}
		return true
	}

	onScaleToggle = () => {
		if (this.locked) {
			return
		}
		// this.onActionClick()
		this.scale.scaleToggle()
	}

	resetResetSlideTransitionTimer = () => {
		if (this.resetSlideTransitionTimer) {
			clearTimeout(this.resetSlideTransitionTimer)
		}
	}

	setSlideTransition = (transition) => {
		this.resetResetSlideTransitionTimer()
		const { getSlideDOMNode } = this.props
		// When resetting CSS transition, sets it to "initial".
		// Setting `undefined` didn't work.
		// Setting "none" also resulted in a weird CSS value.
		getSlideDOMNode().style.transition = transition || 'initial'
	}

	setSlideTransform(transform, transformOrigin) {
		const { getSlideDOMNode } = this.props
		getSlideDOMNode().style.transform = transform
		getSlideDOMNode().style.transformOrigin = transformOrigin
	}

	enterDragAndScaleMode() {
		// this.resetExitDragAndScaleModeTimer()
		const { i } = this.state
		const [offsetX, offsetY] = this.getDefaultSlideOffset(i)
		this.pan.dragOffsetX = offsetX
		this.pan.dragOffsetY = offsetY
		this.dragAndScaleMode = true
		const { onDragAndScaleModeChange } = this.props
		onDragAndScaleModeChange(true)
	}

	isDragAndScaleMode() {
		return this.dragAndScaleMode
	}

	onExitDragAndScaleMode = (event) => {
		if (this.locked) {
			return
		}
		this.exitDragAndScaleMode()
	}

	exitDragAndScaleMode = () => {
		this.lock()

		if (this.resetEmulateInteractiveZoom) {
			this.resetEmulateInteractiveZoom()
		}

		this.pan.stopDragInertialMovement()

		const { i } = this.state
		const slide = this.getCurrentSlide()

		// Calculate scale factor.
		const { scale: currentScale } = this.state
		let scale = this.scale.stopAnimateScale({ applyScale: false })
		if (scale === undefined) {
			scale = currentScale
		}

		// Start animation.
		const { getSlideDOMNode, scaleAnimationDuration } = this.props
		const scaleFactor = this.scale.getInitialScaleForSlide(slide) / currentScale
		const { transform, transformOrigin } = this.getSlideTransform(i, {
			scale: scaleFactor,
			ignoreDragAndScaleMode: true
		})

		// Resets the CSS `transform` property.
		// But calling this function should also come with resetting
		// the `width` and `height` of the slide,
		// otherwise there'd be a momentary "flicker" of an enlarged copy of the slide.
		const resetTransformScale = () => {
			const { transform, transformOrigin } = this.getSlideTransform(i, {
				ignoreDragAndScaleMode: true
			})
			this.setSlideTransform(transform, transformOrigin)
		}

		const finish = () => {
			// Turn off CSS `transition` for the slide.
			this.setSlideTransition()

			this.pan.resetDragOffset()
			this.resetScaleOrigin()
			this.resetScaleOriginOffset()

			// `this.resetBoxShadow()` function is not used here
			// because it would produce a momentary "flicker" of the box shadow
			// upon exiting "Drag & Scale" mode because the slide's scale is not
			// reset at that time yet: it will be reset during a follow-up React re-render.
			// this.resetBoxShadow()

			// Scale is not reset immediately.
			// Instead, it's reset during a follow-up React re-render.
			// resetTransformScale()

			// Reset "Drag and Scale" mode.
			// Will update slideshow state and re-render the `<Slideshow/>`.
			this.resetDragAndScaleMode(() => {
				// The current slide's `box-shadow` gets "scaled" along with the slide itself
				// so it has to be dynamically adjusted to counter that scaling so that
				// the shadow stays of the same size.
				//
				// When a user resets a slide's zoom, its `box-shadow` has to be reset
				// to its original value as well immediately after a React re-render.
				//
				this.resetBoxShadow()

				// Re-focus the slide, because the "Drag and Scale" mode button
				// won't be rendered after the new state is applied,
				// and so it would "lose" the focus.
				const { focus } = this.props
				focus(i)

				this.unlock()
			})
		}

		// Hide "Drag and Scale" mode button.
		const { onDragAndScaleModeChange } = this.props
		onDragAndScaleModeChange(false)

		// // Update scale value in the UI.
		// const { onScaleChange } = this.props
		// if (onScaleChange) {
		// 	onScaleChange(1)
		// }
		// It turned out that for large scales the `transform: scale()` transition is laggy,
		// even on a modern PC, when zooming out from 5x to 1x.
		// On iPhone 6S Plus it even crashes iOS Safari when exiting
		// zoom mode with a scale transition from 100x to 1x.
		// Therefore, for scales larger than 5x there's no transition.
		if (scale > 5) {
			// No `transform: scale()` transition.
			return finish()
		}

		// Calculate animation distance.
		const { offsetX, offsetY } = this.getSlideCoordinates(i)
		const [defaultOffsetX, defaultOffsetY] = this.getDefaultSlideOffset(i, {
			ignoreDragAndScaleMode: true
		})
		const bouncer = new Bouncer(this, transform, transformOrigin)
		const dx = offsetX - defaultOffsetX
		const dy = offsetY - defaultOffsetY
		const dr = Math.sqrt(dx * dx + dy * dy)
		const dw = (this.getSlideInitialWidth(slide) * (scale - 1))
		const animationOffset = dr + dw / 2
		const animationDuration = scaleAnimationDuration * (0.7 + 0.5 * animationOffset / 1000)

		this.setSlideTransition(`transform ${ms(animationDuration)}, box-shadow ${ms(animationDuration)}`)

		// Scale (and animate) the slide's shadow accordingly.
		this.updateBoxShadow(1)
		this.setSlideTransform(
			bouncer ? bouncer.getInitialTransform() : transform,
			transformOrigin
		)

		this.exitDragAndScaleModeTimer = setTimeout(() => {
			this.exitDragAndScaleModeTimer = undefined
			if (bouncer) {
				bouncer.playBounceAnimation(timer => this.exitDragAndScaleModeTimer = timer).then(finish)
			} else {
				finish()
			}
		}, animationDuration)
	}

	resetDragAndScaleMode = (callback) => {
		this.dragAndScaleMode = undefined

		// If `callback` was supplied, then call it right after the state update.
		if (callback) {
			const onStateChangeOnceListener = () => {
				callback()
				this.removeOnStateChangeListener(onStateChangeOnceListener)
			}
			this.onStateChange(onStateChangeOnceListener, { immediate: true })
		}

		// Update the state: reset the `scale`.
		const slide = this.getCurrentSlide()
		this.setState({
			scale: this.scale.getInitialScaleForSlide(slide),
			// ...this.getSlideDragAndScaleInitialState()
		})
	}

	resetExitDragAndScaleModeTimer = () => {
		if (this.exitDragAndScaleModeTimer) {
			clearTimeout(this.exitDragAndScaleModeTimer)
			this.exitDragAndScaleModeTimer = undefined
		}
	}

	// resetEmulateTouchScaleAnimationFrame() {
	// 	if (this.emulateInteractiveZoomAnimationFrame) {
	// 		clearTimeout(this.emulateInteractiveZoomAnimationFrame)
	// 		this.emulateInteractiveZoomAnimationFrame = undefined
	// 	}
	// }

	onDragOffsetChange({ animate } = {}) {
		if (animate) {
			const { getSlideDOMNode, scaleAnimationDuration } = this.props
			const animationDuration = scaleAnimationDuration
			this.setSlideTransition(`transform ${ms(animationDuration)}`)
			this.resetSlideTransitionTimer = setTimeout(() => {
				this.resetSlideTransitionTimer = undefined
				this.setSlideTransition()
			}, animationDuration)
		}
		this.updateSlideTransform()
	}

	getMaxOverlayOpacity() {
		const { maxOverlayOpacity } = this.state
		return maxOverlayOpacity
	}

	getContainerDOMNode() {
		const { getContainerDOMNode } = this.props
		return getContainerDOMNode()
	}

	onOpenExternalLink = (event) => {
		// this.onActionClick()
		const downloadInfo = this.getPluginForSlide().download(this.getCurrentSlide())
		if (downloadInfo) {
			// downloadFile(downloadInfo.url, downloadInfo.title)
		}
	}

	getSlide = (i) => {
		const { slides } = this.props
		return slides[i]
	}

	getCurrentSlideIndex = () => {
		// `this.state` is `undefined` when slideshow is being initialized,
		// that's why `i` isn't simply always read from it.
		if (this.state) {
			// If the slideshow has been initialized.
			return this.state.i
		}
		// If the slideshow hasn't been initialized yet.
		return this.props.initialSlideIndex
	}

	getCurrentSlide = () => {
		return this.getSlide(this.getCurrentSlideIndex())
	}

	isTransparentBackground(slide) {
		const plugin = this.getPluginForSlide(slide)
		if (plugin && plugin.isTransparentBackground) {
			return plugin.isTransparentBackground(slide)
		}
	}

	hasScaleOriginBeenSet() {
		return this.scaleOriginRatio !== undefined
	}

	setScaleOrigin(originX, originY) {
		// Not re-fixing the origing while scale animation is playing
		// results in a smoother scaling experience (no slide coordinates jitter).
		if (this.hasScaleOriginBeenSet()) {
			return console.error('Slide scale origin has already been set')
		}
		const { scale } = this.state
		this.scaleOriginPrevRatio = CENTER_RATIO
		this.scaleOriginPrevScale = scale
		this.scaleOriginRatio = this.getOriginRatio(originX, originY)
		this.scaleOriginX = originX
		this.scaleOriginY = originY
	}

	getOriginRatio(originX, originY) {
		const { i } = this.state
		const {
			x: slideTopLeftX,
			y: slideTopLeftY,
			width,
			height
		} = this.getSlideCoordinates(i)
		return {
			x: (originX - slideTopLeftX) / width,
			y: (originY - slideTopLeftY) / height
		}
	}

	updateInteractiveZoomOrigin(originX, originY) {
		this.interactiveZoomOriginX = originX
		this.interactiveZoomOriginY = originY
	}

	updateScaleOriginOffsetForNewScale(scale) {
		const [offsetX, offsetY] = this.getScaleOriginOffsetForNewScale(scale)
		this.scaleOriginOffsetX += offsetX
		this.scaleOriginOffsetY += offsetY
	}

	getScaleOriginOffsetForNewScale(scale) {
		// const debug = CONSOLE
		// debug('### getScaleOriginOffsetForNewScale')
		// Calculate offset X and offset Y for `transform-origin` "center cetner"
		// so that the slide coordinates are the same as if `scale` parameter was passed
		// with `transform-origin` being the fixed one.
		const slide = this.getCurrentSlide()
		const {
			scaleOriginRatio,
			scaleOriginPrevRatio,
			scaleOriginPrevScale
		} = this
		const nonScaledWidth = this.getSlideInitialWidth(slide)
		const nonScaledHeight = this.getSlideInitialHeight(slide)
		// // The math:
		// const newWidth = nonScaledWidth * scale
		// const prevWidth = nonScaledWidth * prevScale
		// offsetX = -1 * (newWidth - prevWidth) * (scaleOriginXRatio - prevScaleOriginXRatio)
		// debug('New Scale', scale)
		// debug('New Scale Origin Ratio', scaleOriginRatio)
		// debug('Prev Scale', scaleOriginPrevScale)
		// debug('Prev Scale Origin Ratio', scaleOriginPrevRatio)
		const offsetX = nonScaledWidth * (scaleOriginPrevScale - scale) * (scaleOriginRatio.x - scaleOriginPrevRatio.x)
		const offsetY = nonScaledHeight * (scaleOriginPrevScale - scale) * (scaleOriginRatio.y - scaleOriginPrevRatio.y)
		return [offsetX, offsetY]
	}

	resetScaleOrigin = () => {
		this.scaleOriginRatio = undefined
		this.scaleOriginX = undefined
		this.scaleOriginY = undefined
	}

	resetScaleOriginOffset() {
		this.scaleOriginOffsetX = 0
		this.scaleOriginOffsetY = 0
		this.interactiveZoomOriginX = undefined
		this.interactiveZoomOriginY = undefined
	}

	getDefaultSlideOffset(i, { ignoreDragAndScaleMode, scaleFactor } = {}) {
		const { offsetSlideIndex } = this.state

		if (offsetSlideIndex === i) {
			const {
				scale,
				offsetSlideOriginX,
				offsetSlideOriginY
			} = this.state

			if (this.isDragAndScaleMode() && !ignoreDragAndScaleMode) {
				// Don't fit the slide on screen in "Drag and Scale" mode.
			} else {
				return this.size.getFittedSlideOffset(
					this.getSlide(i),
					// this.getSlideScale(i),
					scaleFactor === undefined ? scale : scale * scaleFactor,
					offsetSlideOriginX,
					offsetSlideOriginY
				)
			}
		}

		return [0, 0]
	}

	getSlideCoordinates(j, {
		scaleFactor,
		ignoreDragAndScaleMode,
		validate = false
	} = {}) {
		// const debug = CONSOLE
		// debug('### Get Slide Coordinates')
		const { i } = this.state
		let { scale } = this.state
		if (scaleFactor !== undefined) {
			// debug('Scale factor', scaleFactor)
			scale *= scaleFactor
		}
		// debug('Scale', scale)
		const slide = this.getSlide(j)
		const width = this.getSlideInitialWidth(slide) * scale
		const height = this.getSlideInitialHeight(slide) * scale
		// debug('Default width', this.getSlideInitialWidth(slide))
		// debug('Width', width)
		let [offsetX, offsetY] = this.getDefaultSlideOffset(j, {
			scaleFactor,
			ignoreDragAndScaleMode
		})
		// debug('Default offset', offsetX, offsetY)
		if (this.isDragAndScaleMode() && j === i && !ignoreDragAndScaleMode) {
			const [dragOffsetX, dragOffsetY] = this.getDragOffset()
			// debug('Drag offset', dragOffsetX, dragOffsetY)
			offsetX += dragOffsetX
			offsetY += dragOffsetY
			const { scaleOriginOffsetX, scaleOriginOffsetY } = this
			// debug('Scale origin offset', scaleOriginOffsetX, scaleOriginOffsetY)
			offsetX += scaleOriginOffsetX
			offsetY += scaleOriginOffsetY
			if (this.isInteractivelyZooming()) {
				const { interactiveZoomOriginX, interactiveZoomOriginY } = this
				// debug('Interactive zoom origin offset', interactiveZoomOriginX - this.scaleOriginX, interactiveZoomOriginY - this.scaleOriginY)
				offsetX += interactiveZoomOriginX - this.scaleOriginX
				offsetY += interactiveZoomOriginY - this.scaleOriginY
			}
		}
		const { scaleOriginRatio } = this
		if (scaleOriginRatio && !this.isCustomOriginTransform(j) && !ignoreDragAndScaleMode) {
			const [dx, dy] = this.getScaleOriginOffsetForNewScale(scale)
			// debug('Scale origin offset (for new scale)', dx, dy)
			offsetX += dx
			offsetY += dy
		}
		const result = {
			x: (this.getSlideshowWidth() - width) / 2 + offsetX,
			y: (this.getSlideshowHeight() - height) / 2 + offsetY,
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

	isCustomOriginTransform(j) {
		const { i } = this.state
		const { scaleOriginRatio } = this
		return scaleOriginRatio !== undefined && j === i
	}

	getSlideTransform(j, { scale, ignoreDragAndScaleMode } = {}) {
		// const debug = CONSOLE
		// debug('### Get Slide Transform')
		// debug('# Scale', scale)

		let transformOrigin

		if (this.isCustomOriginTransform(j) && !ignoreDragAndScaleMode) {
			const { scaleOriginRatio } = this
			transformOrigin = [
				scaleOriginRatio.x,
				scaleOriginRatio.y
			].map(_ => percent(_)).join(' ')
		} else {
			transformOrigin = '50% 50%'
		}

		let { offsetX, offsetY } = this.getSlideCoordinates(j, {
			ignoreDragAndScaleMode,
			scaleFactor: scale
		})

		let transform = ''

		// While `scale` transition is playing, it's sub-pixel anyway,
		// so `translateX` and `translateY` can be sub-pixel too.
		// Presumably this would result in a slightly higher positioning precision.
		// Maybe noticeable, maybe not. Didn't test this specific case.
		transform += ` translateX(${px(offsetX)}) translateY(${px(offsetY)})`

		if (scale !== undefined) {
			transform += ` scale(${formatScaleFactor(scale)})`
		}

		// debug('### Transform', transform)
		// debug('### Transform Origin', transformOrigin)

		return {
			transform,
			transformOrigin
		}
	}

	onInteractiveZoomStart(originX, originY) {
		this.setScaleOrigin(originX, originY)
		this.updateInteractiveZoomOrigin(this.scaleOriginX, this.scaleOriginY)
	}

	onInteractiveZoomEnd() {
		this.scaleOriginOffsetX += this.interactiveZoomOriginX - this.scaleOriginX
		this.scaleOriginOffsetY += this.interactiveZoomOriginY - this.scaleOriginY
	}

	onInteractiveZoomChange() {
		// Enter "Drag and Scale" mode on zoom in.
		if (!this.isDragAndScaleMode()) {
			// // Comparing to `1.01` here instead of `1`
			// // to avoid any hypothetical issues related to precision factor.
			// // (not that there were any — didn't test, because DevTools doesn't have multi-touch).
			// if (zoomFactor > 1.01) {
			this.enterDragAndScaleMode()
			// }
		}
	}

	onScaleEnd() {
		this.resetScaleOrigin()
	}

	updateSlideTransform(options) {
		const { getSlideDOMNode } = this.props
		// Reset CSS scale transform.
		const {
			transform,
			transformOrigin
		} = this.getSlideTransform(this.getCurrentSlideIndex(), options)
		this.setSlideTransform(transform, transformOrigin)
	}

	onBackgroundClick = (event) => {
		if (this.ignoreBackgroundClick) {
			this.ignoreBackgroundClick = undefined
			return
		}
		if (this.ignorePointerUpEvents) {
			return
		}
		if (this.locked) {
			return
		}
		// A "click" event is emitted on mouse up
		// when a user finishes panning to next/previous slide.
		if (this.pan.wasPanning) {
			return
		}
		this.pointer.onBackgroundClick(event)
	}

	// wasInsideSlide(event) {
	// 	const { x, y } = this.getClickXYInSlideCoordinates(event)
	// 	return x >= 0 && x <= 1 && y >= 0 && y <= 1
	// }

	// getClickXYInSlideCoordinates(event) {
	// 	const { scale } = this.state
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

	onSlideClick = (event) => {
		// This block of code is intentionally placed above `this.locked` check
		// because otherwise clicks while panning wouldn't be cancelled.
		// A "click" event is emitted on mouse up
		// when a user finishes panning to next/previous slide.
		if (this.pan.wasPanning || this.ignorePointerUpEvents) {
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
		if (!this.getPluginForSlide().allowChangeSlideOnClick) {
			return false
		}
		return true
	}

	shouldAnimateOverlayOpacityWhenPagingThrough() {
		const { maxOverlayOpacity } = this.state
		if (maxOverlayOpacity !== this.getOverlayOpacityWhenPagingThrough()) {
			return true
		}
	}

	getOverlayOpacityWhenPagingThrough() {
		const { overlayOpacityWhenPagingThrough } = this.props
		if (overlayOpacityWhenPagingThrough !== undefined) {
			return overlayOpacityWhenPagingThrough
		}
		const { maxOverlayOpacity } = this.props
		return maxOverlayOpacity
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
			if (this.getPluginForSlide().canSwipe &&
				!this.getPluginForSlide().canSwipe(this.getCurrentSlide())) {
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
		// if (this.getPluginForSlide().capturesArrowKeys) {
		// 	if (this.getPluginForSlide().capturesArrowKeys(this.getCurrentSlide())) {
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

	onClose(listener, options) {
		return this.addEventListener('close', listener, options)
	}

	onRequestClose = (event) => {
		if (this.locked) {
			return
		}
		this.close()
	}

	close = ({ interaction } = {}) => {
		let closeAnimationDuration
		const results = this.triggerListeners('close', { interaction })
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
		if (closeAnimationDuration) {
			this.closeAfter(closeAnimationDuration)
		} else {
			this._close()
		}
	}

	_close = () => {
		const { onClose } = this.props
		onClose()
	}

	closeAfter(duration) {
		this.lock()
		this.closeTimeout = setTimeout(this._close, duration)
	}

	onOpen() {
		this.unlock()
		this.triggerListeners('open')
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
		this.pan.finishTransition()
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

	onDragStart = (event) => {
		event.preventDefault()
	}

	onTouchStart = (event) => {
		this.touch.onTouchStart(event)
		if (this.ignoreCurrentTouches) {
			this.ignoreCurrentTouches = undefined
		}
		if (this.locked) {
			return
		}
		switch (this.touch.getTouchCount()) {
			case 1:
				const { isButton } = this.props
				// Ignore button/link clicks.
				if (isButton(event.target)) {
					return
				}
				this.ignorePointerUpEvents = undefined
				const { x, y } = this.touch.getTouch()
				this.pan.onPanStart(x, y)
				break
			case 2:
				// Exit panning mode when started touch zooming.
				// Can still pan in touch zoom mode:
				// when the center between the touches shifts,
				// the slide shifts accordingly.
				if (this.pan.isPanning) {
					this.pan.onPanEnd({ ignorePan: true })
				}
				this.startInteractiveZoom(
					this.touch.getCenterBetweenTouches,
					this.touch.getDistanceBetweenTouches
				)
				break
			default:
				// Ignore more than two simultaneous touches.
				break
		}
	}

	onTouchEnd = (event) => {
		this.touch.onTouchEnd(event)
		this.onTouchCancel(event)
	}

	onTouchCancel = (event) => {
		this.touch.onTouchCancel(event)
		if (this.ignoreCurrentTouches) {
			this.ignoreCurrentTouches = undefined
		}
		// If it was single-touch panning mode, then exit it.
		if (this.pan.isPanning) {
			this.pan.onPanEnd({ cancelled: true })
		}
		// If it was double-touch zooming mode, then exit it.
		else if (this.isInteractivelyZooming()) {
			this.endInteractiveZoom()
			// When lifting one finger while in double-touch zooming mode,
			// exit to signle-touch panning mode.
			if (this.touch.getTouchCount() === 1) {
				const { x, y } = this.touch.getTouch()
				this.pan.onPanStart(x, y)
			}
		}
	}

	onTouchMove = (event) => {
		// Don't react to touches while slideshow is locked.
		// Don't touch-scale the page when slideshow is locked.
		if (this.pan.isPanning ||
			this.isInteractivelyZooming() ||
			this.ignoreCurrentTouches ||
			this.locked) {
			if (event.cancelable) {
				event.preventDefault()
			}
		}
		if (this.locked) {
			return
		}
		// When a user scrolls to the next slide via touch
		// and then taps on the screen while the transition is still ongoing,
		// such "touchstart" event will be ignored, but the subsequent
		// "touchmove" events will still reach this listener,
		// and in such cases `this.touch.getTouch()` is `undefined`,
		// so it can be used to detect such cases and ignore the "touchmove" event.
		if (!this.touch.getTouch()) {
			return
		}
		this.touch.onTouchMove(event)
		if (this.pan.isPanning) {
			const { x, y } = this.touch.getTouch()
			this.pan.onPan(x, y)
		} else if (this.isInteractivelyZooming()) {
			// Interactive zoom will also move the slide
			// when touch fingers are moved.
			this.updateInteractiveZoom()
		}
	}

	onPointerDown = (event) => {
		if (this.locked) {
			this.ignoreBackgroundClick = true
			return
		}
		if (!this.pointer.isClickDown(event)) {
			return this.onPointerUp()
		}
		const { isButton } = this.props
		if (isButton(event.target)) {
			return
		}
		this.ignorePointerUpEvents = undefined
		this.pan.onPanStart(
			event.clientX,
			event.clientY
		)
	}

	onPointerUp = () => {
		if (this.pan.isPanning) {
			this.pan.onPanEnd()
		}
	}

	onPointerMove = (event) => {
		if (this.pan.isPanning) {
			this.pan.onPan(
				event.clientX,
				event.clientY
			)
		}
	}

	// https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/pointerout_event
	// The pointerout event is fired for several reasons including:
	// * pointing device is moved out of the hit test boundaries of an element (`pointerleave`);
	// * firing the pointerup event for a device that does not support hover (see `pointerup`);
	// * after firing the pointercancel event (see `pointercancel`);
	// * when a pen stylus leaves the hover range detectable by the digitizer.
	onPointerOut = () => {
		// `onPointerOut` is called immediately
		// when starting to pan on touch devices.
		if (!this.touch.isTouchDevice) {
			if (this.pan.isPanning) {
				this.pan.onPanEnd({ cancelled: true })
			}
		}
	}

	getOverlayBackgroundColor = (opacity) => {
		return `rgba(0,0,0,${opacity})`
	}

	/**
	 * This is public API.
	 * Returns scale for a slide being rendered.
	 * @param  {number} slideIndex
	 * @return {number}
	 */
	getSlideScale(j) {
		const { i, scale } = this.state
		return i === j ? scale : this.scale.getInitialScaleForSlide(this.getSlide(j))
	}

	getPluginForSlide = (slide = this.getCurrentSlide()) => {
		// j = this.state.i
		const { plugins } = this.props
		// const { slides } = this.props
		// const slide = slides[j]
		const plugin = getPluginForSlide(slide, plugins)
		if (plugin) {
			return plugin
		}
		console.error('No plugin found for slide')
		console.error(slide)
	}

	shouldShowScaleButtons() {
		// Until scaling is implemented, don't show the buttons.
		// And maybe even don't show them after scaling is implemented too.
		return false
		// const { inline } = this.props
		// return !inline && this.size.isMaxSizeSlide(false) === false
	}

	shouldShowOpenExternalLinkButton() {
		if (this.getPluginForSlide().canOpenExternalLink) {
			return this.getPluginForSlide().canOpenExternalLink(this.getCurrentSlide())
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
		// 	if (this.getPluginForSlide().canSwipe &&
		// 		!this.getPluginForSlide().canSwipe(this.getCurrentSlide())) {
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

	getOtherActions() {
		const plugin = this.getPluginForSlide()
		if (plugin.getOtherActions) {
			return plugin.getOtherActions(this.getCurrentSlide())
		}
		return []
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

	getSlideRollTransform(i) {
		let offsetX = -1 * this.getSlideshowWidth() * i
		let offsetY = 0
		if (!this.isDragAndScaleMode()) {
			offsetX += this.pan.getPanOffsetX()
			offsetY += this.pan.getPanOffsetY()
		}
		return `translate(${px(offsetX)}, ${px(offsetY)})`
	}

	// getSlideRollTransitionDuration() {
	// 	return ms(this.pan.getSlideRollTransitionDuration())
	// }
}

export function getPluginForSlide(slide, plugins) {
	for (const plugin of plugins) {
		if (plugin.canRender(slide)) {
			return plugin
		}
	}
}

const CENTER_RATIO = { x: 0.5, y: 0.5 }

function CONSOLE(...args) {
	console.log.apply(console, args)
}

// `4` would've worked as `SCALE_PRECISION`
// but `Bouncer` animation scaling is a bit subtle at times
// so set it to `10` instead.
const SCALE_PRECISION = 10

const TRANSFORM_ORIGIN_PRECISION = 4

class Bouncer {
	constructor(slideshow, transform, transformOrigin, callback) {
		this.slideshow = slideshow
		this.transform = transform
		this.transformOrigin = transformOrigin
		this.callback = callback
		this.transformScale = parseFloat(transform.match(/scale\(([\d\.]+)\)/)[1])
		this.scaleAnimationFactor = 0.75 * (1 + 0.8 * ((2000 - slideshow.getSlideshowWidth()) / 2000))
		this.bounceAnimationInitialScale = 1 - (0.04 * this.scaleAnimationFactor)
	}

	getTransform(scale) {
		// Scales `scale()` factor in `transform`.
		return this.transform.replace(/scale\([\d\.]+\)/, `scale(${formatScaleFactor(this.transformScale * scale)})`)
	}

	getInitialTransform() {
		return this.getTransform(this.bounceAnimationInitialScale)
	}

	playBounceAnimation(setTimer) {
		// Play "bounce" animation on the slide.
		// const BOUNCE_ANIMATION_EASING = 'cubic-bezier(0.215, 0.610, 0.355, 1.000)'
		const KEYFRAMES = [
			{
				duration: 140,
				scale: 1 + (0.01 * this.scaleAnimationFactor)
			},
			{
				duration: 180,
				scale: 1
			}
		]

		const animateKeyframes = (keyframes, callback) => {
			if (keyframes.length === 0) {
				return callback()
			}
			const keyframe = keyframes[0]
			this.slideshow.setSlideTransition(`transform ${ms(keyframe.duration)}`) // ${BOUNCE_ANIMATION_EASING}`)
			this.slideshow.setSlideTransform(this.getTransform(keyframe.scale), this.transformOrigin)
			// getSlideDOMNode().classList.add('Slideshow-Slide--bounce')
			setTimer(setTimeout(() => {
				setTimer()
				animateKeyframes(keyframes.slice(1), callback)
			}, keyframe.duration))
		}

		return new Promise((resolve) => {
			animateKeyframes(KEYFRAMES, resolve)
		})
	}
}