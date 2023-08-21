export default class SlideshowSlides {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
	}

	getFunctions() {
		return {
			showPreviousNextSlides: this.showPreviousNextSlides,
			showSlide: this.showSlide,
			getSlide: this.getSlide,
			isCurrentSlide: this.isCurrentSlide,
			getCurrentSlideIndex: this.getCurrentSlideIndex,
			getCurrentSlide: this.getCurrentSlide
		}
	}

	addEventListeners() {
		this.slideshow.onCleanUp(() => {
			clearTimeout(this.slideChangedTimeout)
		})
	}

	showPreviousNextSlides = () => {
		const { slides } = this.props
		const { i } = this.slideshow.getState()
		let { slidesShown } = this.slideshow.getState()
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
		this.slideshow.setState({
			slidesShown
		})
	}

	showSlide = (i, { animationDuration, interaction } = {}) => {
		const { i: iPrevious } = this.slideshow.getState()
		if (i === iPrevious) {
			return
		}
		const triggerSlideChanged = () => {
			this.slideshow.triggerEventListeners('slideChange', { i, interaction })
		}
		if (animationDuration) {
			this.slideChangedTimeout = setTimeout(triggerSlideChanged, animationDuration)
		} else {
			triggerSlideChanged()
		}
	}

	isCurrentSlide = (j) => {
		const { i } = this.slideshow.getState()
		return i === j
	}

	getSlide = (i) => {
		const { slides } = this.props
		return slides[i]
	}

	getCurrentSlideIndex = () => {
		// `this.state` is `undefined` when slideshow is being initialized,
		// that's why `i` isn't simply always read from it.
		if (this.slideshow.getState()) {
			// If the slideshow has been initialized.
			return this.slideshow.getState().i
		}
		// If the slideshow hasn't been initialized yet.
		const { initialSlideIndex } = this.props
		return initialSlideIndex
	}

	getCurrentSlide = () => {
		return this.getSlide(this.getCurrentSlideIndex())
	}
}