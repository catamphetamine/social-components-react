import { getViewportWidth } from 'web-browser-window'

export default class OpenCloseAnimation {
	constructor(slideshow, props, {
		animations,
		openPictureInHoverMode
	}) {
		this.slideshow = slideshow
		this.props = props
		this.animations = animations
		this.openPictureInHoverMode = openPictureInHoverMode
	}

	addEventListeners() {
		this.slideshow.onCleanUp(this.cleanUp)

		this.slideshow.addEventListener('open', this.animateOpenAndAnimateOnClose)

		this.slideshow.addEventListener('slideChange', () => {
			if (this.openPictureInHoverMode) {
				if (this.openPictureInHoverMode.isSlideOffsetApplied()) {
					this.openPictureInHoverMode.resetSlideOffsetState()
				}
			}
		})
	}

	cleanUp = () => {
		if (this.openPictureInHoverMode) {
			this.openPictureInHoverMode.cleanUp()
		}

		if (this.cancelOpenAnimation) {
			this.cancelOpenAnimation()
			this.cancelOpenAnimation = undefined
		}

		if (this.isLockedWhileOpening) {
			this.slideshow.unlock()
			this.isLockedWhileOpening = false
		}

		if (this.cancelCloseAnimation) {
			this.cancelCloseAnimation()
			this.cancelCloseAnimation = undefined
		}

		// this.removeOpenEventListener()
		if (this.removeCloseEventListener) {
			this.removeCloseEventListener()
			this.removeCloseEventListener = undefined
		}
	}

	animateOpenAndAnimateOnClose = () => {
		const {
			initialSlideIndex,
			animateOpen,
			animateOpenClose,
			animateCloseOnPanOut,
			getSlideDOMNode,
			imageElement,
			// openPictureInHoverMode
		} = this.props

		const {
			slideWithCustomOffsetIndex
		} = this.slideshow.getState()

		let slideOffsetX
		let slideOffsetY
		// if (slideWithCustomOffsetIndex === initialSlideIndex) {
		if (this.openPictureInHoverMode) {
			const result = this.openPictureInHoverMode.applySlideOffset()
			slideOffsetX = result[0]
			slideOffsetY = result[1]
		}

		let _promise = Promise.resolve()
		let cancelled = false

		// let imageElementAnimationDuration = 0
		// let imageElementTransition

		if (animateOpen) {
			const Animation = this.animations[animateOpen]

			if (!Animation) {
				throw new Error(`Slideshow: Unknown animation: ${animateOpen}`)
			}

			const animation = new Animation(this.slideshow)

			const {
				animationDuration,
				promise,
				cancel
			} = animation.onOpen(getSlideDOMNode(), {
				imageElement,
				slideOffsetX,
				slideOffsetY
			})

			this.cancelOpenAnimation = () => {
				cancel()
				cancelled = true
			}

			// imageElementAnimationDuration = animationDuration
			this.slideshow.setState({
				openAnimationDuration: animationDuration,
				openClosePhase: 'opening'
			})

			this.isLockedWhileOpening = true
			this.slideshow.lock()

			_promise = promise.then(() => {
				if (cancelled) {
					return
				}
				this.isLockedWhileOpening = false
				this.slideshow.unlock()
				this.slideshow.setState({
					openClosePhase: 'open'
				})
			})
		}

		// if (imageElement) {
		// 	imageElementTransition = getComputedStyle(imageElement).transition
		// 	imageElement.style.transition = `opacity ${ms(imageElementAnimationDuration)}`
		// 	imageElement.style.opacity = 0.25
		// }

		_promise.then(() => {
			if (cancelled) {
				return
			}

			this.removeCloseEventListener = this.slideshow.addEventListener('close', ({ interaction }) => {
				const useLongerOpenCloseAnimation = interaction === 'pan'

				// if (imageElement) {
				// 	imageElement.style.opacity = 1
				// 	setTimeout(() => {
				// 		imageElement.style.transition = imageElementTransition
				// 	}, 0)
				// }

				let animateClose = animateOpenClose

				// if (this.openPictureInHoverMode && !this.slideshow.getState().hasChangedSlide) {
				// 	animateClose = getAnimateCloseForPictureInHoverMode()
				// }

				if (animateCloseOnPanOut && interaction === 'pan') {
					animateClose = animateCloseOnPanOut
				}

				// Close the initially opened slide via a "float" animation
				// if it was opened via a "float" animation, even if slides
				// were navigated through in the process.
				//
				// Fall back to the default "fade" animation
				// if the current slide is not the initial slide.
				//
				const isAtTheInitialSlide = this.slideshow.getState().i === initialSlideIndex
				if (animateClose === 'float' && !isAtTheInitialSlide) {
					animateClose = 'fade'
				}

				if (!animateClose) {
					return
				}

				const Animation = this.animations[animateClose]

				if (!Animation) {
					throw new Error(`Slideshow: Unknown animation: ${animateClose}`)
				}

				const animation = new Animation(this.slideshow)

				this.isPlayingCloseAnimation = true

				this.slideshow.setState({
					animateClose: true,
					animateCloseSlideAndBackgroundSeparately: animation.shouldAnimateCloseSlideAndBackgroundSeparately({ speed: useLongerOpenCloseAnimation ? 'slow' : 'fast' }),
					openClosePhase: 'closing'
				})

				const {
					animationDuration,
					promise,
					cancel
				} = animation.onClose(getSlideDOMNode(), {
					imageElement,
					slideImage: getSlideDOMNode().querySelector('img'),
					useLongerOpenCloseAnimation
				})

				this.cancelCloseAnimation = () => {
					cancel()
					cancelled = true
					this.isPlayingCloseAnimation = false
				}

				this.slideshow.setState({
					closeAnimationDuration: animationDuration
				})

				promise.then(() => {
					this.isPlayingCloseAnimation = false
					if (cancelled) {
						return
					}
					this.slideshow.setState({
						openClosePhase: 'closed'
					})
				})

				// This result object is read in `close()` function in `Slideshow.Core.js`.
				return {
					animationDuration,
					useLongerOpenCloseAnimation,
					// promise
				}
			})
		})
	}
}

function shouldAnimateOpenClosePictureInHoverMode({ animateOpenClose, action, interaction }) {
	return Boolean(animateOpenClose)
}

export function transformInitialProps(props) {
	const {
		initialSlideIndex,
		slides,
		smallScreenMaxWidth,
		animateOpenCloseOnSmallScreen,
		openPictureInHoverMode,
		overlayOpacity,
		overlayOpacityOnFloatOpenCloseAnimation,
		// overlayOpacityOnSmallScreen,
		// `SlideshowOpenPictureInHoverMode.transformInitialProps()` is supposed to be
		// called before `SlideshowOpenCloseAnimation.transformInitialProps()`.
		imageElement
	} = props

	let {
		animateOpenClose
	} = props

	animateOpenClose = getAnimateOpenCloseProperty({
		animateOpenClose,
		animateOpenCloseOnSmallScreen,
		smallScreenMaxWidth,
		imageElement,
		slides,
		initialSlideIndex
	})

	const animateOpen = animateOpenClose

	const animateOpenSlideAndBackgroundSeparately = animateOpen === 'float'

	const overlayOpacityForInitialSlide = getOverlayOpacityForInitialSlideProperty(({
		overlayOpacity,
		overlayOpacityOnFloatOpenCloseAnimation,
		animateOpen,
		openPictureInHoverMode
	}))

	return {
		...props,
		overlayOpacityForInitialSlide,
		animateOpenClose,
		animateOpen,
		animateOpenSlideAndBackgroundSeparately
	}
}

function getAnimateOpenCloseProperty({
	animateOpenClose,
	animateOpenCloseOnSmallScreen,
	smallScreenMaxWidth,
	imageElement,
	slides,
	initialSlideIndex
}) {
	// Derive `animateOpenClose` property from `animateOpenCloseOnSmallScreen` property.
	if (typeof window !== 'undefined' && smallScreenMaxWidth !== undefined) {
		if (getViewportWidth() <= smallScreenMaxWidth) {
			if (animateOpenCloseOnSmallScreen !== undefined) {
				animateOpenClose = animateOpenCloseOnSmallScreen
			}
		}
	}

	if (animateOpenClose === 'float') {
		const slide = slides[initialSlideIndex]
		const isGif = imageElement
			&& slide.type === 'picture'
			&& slide.picture.type !== 'image/gif'
		// Don't animate opening animated GIFs
		// because they can't be paused until they're expanded.
		// Considering that "float" animation fades between
		// the enlarged preview and the original image
		// it could result in minor visual inconsistencies.
		if (!isGif) {
			animateOpenClose = 'fade'
		}
	}

	return animateOpenClose
}

function getOverlayOpacityForInitialSlideProperty({
	overlayOpacity,
	overlayOpacityOnFloatOpenCloseAnimation,
	animateOpen,
	openPictureInHoverMode
}) {
	if (animateOpen === 'float' && overlayOpacityOnFloatOpenCloseAnimation !== undefined) {
		return overlayOpacityOnFloatOpenCloseAnimation
	}
	if (openPictureInHoverMode && !animateOpen) {
		return 0
	}
	return overlayOpacity
}