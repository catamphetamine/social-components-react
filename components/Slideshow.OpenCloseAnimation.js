import { getViewportWidth } from 'web-browser-window'

export default class OpenCloseAnimation {
	constructor(slideshow) {
		this.slideshow = slideshow
		this.slideshow.addEventListener('open', this.animateOpenAndAnimateOnClose)
	}

	static getInitialProps(props) {
		const {
			initialSlideIndex,
			slides,
			smallScreenMaxWidth,
			animateOpenCloseOnSmallScreen,
			animateOpenClosePictureInHoverMode,
			openPictureInHoverMode,
			overlayOpacityOnFloatOpenCloseAnimation,
			// overlayOpacityOnSmallScreen,
			// `SlideshowOpenPictureInHoverMode.getInitialProps()` is supposed to be
			// called before `SlideshowOpenClose.getInitialProps()`.
			imageElement
		} = props

		let {
			overlayOpacity,
			animateOpenClose
		} = props

		const slide = slides[initialSlideIndex]

		const maxOverlayOpacity = overlayOpacity

		if (typeof window !== 'undefined' && smallScreenMaxWidth !== undefined) {
			// Apply "smallScreen"-specific properties on "small screens".
			if (getViewportWidth() <= smallScreenMaxWidth) {
				if (animateOpenCloseOnSmallScreen !== undefined) {
					animateOpenClose = animateOpenCloseOnSmallScreen
				}
			}
		}

		overlayOpacity = animateOpenClose === 'float' && overlayOpacityOnFloatOpenCloseAnimation !== undefined
				? overlayOpacityOnFloatOpenCloseAnimation
				: maxOverlayOpacity

		if (animateOpenClose === 'float') {
			if (!(imageElement
				&& slide.type === 'picture'
				// Don't animate opening animated GIFs
				// because they can't be paused until they're expanded.
				// Considering that "float" animation fades between
				// the enlarged preview and the original image
				// it could result in minor visual inconsistencies.
				&& slide.picture.type !== 'image/gif')) {
				animateOpenClose = true
			}
		}

		let animateOpen = animateOpenClose
		let animateOpenSlideAndBackgroundSeparately = animateOpenClose ? animateOpenClose === 'float' : undefined

		if (openPictureInHoverMode && !shouldAnimateOpenClosePictureInHoverMode(animateOpenClosePictureInHoverMode, animateOpen)) {
			animateOpen = false
			animateOpenSlideAndBackgroundSeparately = undefined
			overlayOpacity = 0
		}

		return {
			...props,
			// `maxOverlayOpacity` has the `overlayOpacity` value
			// in cases when `animateOpenClose === 'float'` and
			// `overlayOpacityOnFloatOpenCloseAnimation` is defined.
			maxOverlayOpacity,
			overlayOpacity,
			animateOpenClose,
			animateOpen,
			animateOpenSlideAndBackgroundSeparately
		}
	}

	animateOpenAndAnimateOnClose = () => {
		const {
			initialSlideIndex,
			animateOpen,
			animateOpenClose,
			animateOpenClosePictureInHoverMode,
			animateCloseOnPanOut,
			getSlideDOMNode,
			imageElement,
			openPictureInHoverMode
		} = this.slideshow.props

		const {
			offsetSlideIndex
		} = this.slideshow.getState()

		if (animateOpen || animateOpenClose) {
			let slideOffsetX
			let slideOffsetY
			// if (offsetSlideIndex === initialSlideIndex) {
			if (openPictureInHoverMode) {
				const result = this.slideshow.openPictureInHoverMode.applySlideOffset()
				slideOffsetX = result[0]
				slideOffsetY = result[1]
			}
			let _promise = Promise.resolve()
			// let imageElementAnimationDuration = 0
			// let imageElementTransition
			if (animateOpen) {
				const transition = animateOpen === 'float' ? this.slideshow.openCloseAnimationFloat : this.slideshow.openCloseAnimationFade
				const {
					animationDuration,
					promise
				} = transition.onOpen(getSlideDOMNode(), {
					imageElement,
					slideOffsetX,
					slideOffsetY
				})
				// imageElementAnimationDuration = animationDuration
				this.slideshow.setState({
					openAnimationDuration: animationDuration,
					hasStartedOpening: true
				})
				this.slideshow.lock()
				_promise = promise.then(() => {
					this.slideshow.setState({
						hasFinishedOpening: true
					})
					this.slideshow.unlock()
				})
			}
			// if (imageElement) {
			// 	imageElementTransition = getComputedStyle(imageElement).transition
			// 	imageElement.style.transition = `opacity ${imageElementAnimationDuration}ms`
			// 	imageElement.style.opacity = 0.25
			// }
			_promise.then(() => {
				this.slideshow.onClose(({ interaction }) => {
					const useLongerOpenCloseAnimation = interaction === 'pan'
					// if (imageElement) {
					// 	imageElement.style.opacity = 1
					// 	setTimeout(() => {
					// 		imageElement.style.transition = imageElementTransition
					// 	}, 0)
					// }
					let animateClose = animateOpenClose
					let animateCloseSlideAndBackgroundSeparately
					if (animateClose) {
						if (openPictureInHoverMode && !this.slideshow.getState().hasChangedSlide) {
							if (!shouldAnimateOpenClosePictureInHoverMode(animateOpenClosePictureInHoverMode, animateClose)) {
								if (!useLongerOpenCloseAnimation) {
									animateClose = false
								}
							}
						}
					}
					if (!animateClose) {
						if (animateCloseOnPanOut && interaction === 'pan') {
							animateClose = true
						}
					}
					let transition
					if (animateClose === 'float') {
						// Close the initially opened slide via a "float" animation
						// if it was opened via a "float" animation, even if slides
						// were navigated through in the process.
						if (openPictureInHoverMode && this.slideshow.getState().i === initialSlideIndex) {
							transition = this.slideshow.openCloseAnimationFloat
							animateCloseSlideAndBackgroundSeparately = true
						} else {
							// Fall back to the default open/close transition
							// if the original slide has already been changed.
							animateClose = true
						}
					}
					if (animateClose === true) {
						transition = this.slideshow.openCloseAnimationFade
						animateCloseSlideAndBackgroundSeparately = useLongerOpenCloseAnimation ? true : false
					}
					if (!transition) {
						return
					}
					this.slideshow.setState({
						animateClose: true,
						animateCloseSlideAndBackgroundSeparately,
						hasStartedClosing: true
					})
					const {
						animationDuration,
						promise
					} = transition.onClose(getSlideDOMNode(), {
						imageElement,
						slideImage: getSlideDOMNode().querySelector('img'),
						useLongerOpenCloseAnimation
					})
					this.slideshow.setState({
						closeAnimationDuration: animationDuration
					})
					promise.then(() => {
						this.slideshow.setState({
							hasFinishedClosing: true
						})
					})
					return {
						animationDuration,
						useLongerOpenCloseAnimation,
						promise
					}
				})
			})
		}
	}

	getInitialState() {
		const { animateOpen, animateOpenClose } = this.slideshow.props
		return {
			hasStartedOpening: animateOpen ? false : true,
			hasFinishedOpening: animateOpen ? false : true,
			hasStartedClosing: animateOpenClose ? false : true,
			hasFinishedClosing: animateOpenClose ? false : true
		}
	}
}

function shouldAnimateOpenClosePictureInHoverMode(
	animateOpenClosePictureInHoverMode,
	animateOpenClose
) {
	if (animateOpenClosePictureInHoverMode === true) {
		return true
	}
	if (animateOpenClosePictureInHoverMode === 'float' && animateOpenClose === 'float') {
		return true
	}
	return false
}