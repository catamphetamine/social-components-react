import PropTypes from 'prop-types'

export const slideType = PropTypes.shape({
	type: PropTypes.string.isRequired
})

const PluginType = PropTypes.shape({
	getMaxSize: PropTypes.func.isRequired,
	getAspectRatio: PropTypes.func.isRequired,
	getOtherActions: PropTypes.func,
	preload: PropTypes.func,
	minInitialSizeRatioRelativeToMaxSizeAvailable: PropTypes.number,
	allowChangeSlideOnClick: PropTypes.bool,
	// isScaleDownAllowed: PropTypes.func.isRequired,
	canOpenExternalLink: PropTypes.func,
	getExternalLink: PropTypes.func,
	canSwipe: PropTypes.func,
	// hasCloseButtonClickingIssues: PropTypes.func,
	// capturesArrowKeys: PropTypes.func,
	onKeyDown: PropTypes.func,
	canRender: PropTypes.func.isRequired,
	render: PropTypes.func.isRequired,
	// showCloseButtonForSingleSlide: PropTypes.bool
})

export default {
	// The initial slide index.
	initialSlideIndex: PropTypes.number,

	// Set to `true` to open slideshow in inline mode (rather than in a modal).
	inline: PropTypes.bool,
	// Set to `true` to open slideshow in "native" browser fullscreen mode.
	fullScreen: PropTypes.bool,

	overlayOpacity: PropTypes.number,
	// Overlay opacity when a slide is open using "float" animation.
	// This can be used to show a "lighter" overlay when opening slides
	// using "float" animation, because it results in a more "seamless" user experience.
	overlayOpacityOnFloatOpenCloseAnimation: PropTypes.number,

	closeOnOverlayClick: PropTypes.bool,
	closeOnSlideClick: PropTypes.bool,

	animateOpenClose: PropTypes.oneOf(['fade', 'float']),
	animateOpenCloseOnSmallScreen: PropTypes.oneOf(['fade', 'float']),
	animateCloseOnPanOut: PropTypes.oneOf(['fade']),

	// What's the criterion of a "small" screen.
	smallScreenMaxWidth: PropTypes.number,

	// A picture is open in "hover" mode when it's expanded
	// centered above its thumbnail.
	openPictureInHoverMode: PropTypes.bool,

	// How much should a user move a mouse cursor when dragging
	// in order to activate "pan" mode.
	dragOffsetThreshold: PropTypes.number,
	// Emulate pan resistance on slideshow left-most and right-most sides.
	emulatePanResistanceOnFirstAndLastSlides: PropTypes.bool,
	// The duration of a "slide in" animation when a user
	// switches a slide while panning.
	panSlideInAnimationDuration: PropTypes.number,
	// The minumum duration of a "slide in" animation when a user
	// switches a slide while panning.
	panSlideInAnimationDurationMin: PropTypes.number,

	showControls: PropTypes.bool,
	highContrastControls: PropTypes.bool,

	showScaleButtons: PropTypes.bool,
	// Scale multiplier when transitioning from a previous scale step to a next scale step.
	scaleStep: PropTypes.number,
	scaleAnimationDuration: PropTypes.number,
	minScaledSlideRatio: PropTypes.number,
	mouseWheelScaleFactor: PropTypes.number,
	//
	// `minSlideScaleFactorRelativeToThumbnailSize` property controls the mininum size of a slide:
	// a slide's size can't be less than `minSlideScaleFactorRelativeToThumbnailSize` of its thumbnail size.
	//
	// For example, if a thumbnail has width `100px`, and the original image is `100px` too,
	// then the slideshow will automatically enlarge the original image to `125px`
	// so that the user sees at least some enlargement.
	// The rationale is that, when clicking on a thumbnail, a user expects
	// an enlarged version of it. If the "enlarged" slide is not visibly larger
	// than the thumbnail, then it means that the user will enlarge the slide anyway
	// because the original intention was to do so.
	// The `1.25` scale factor seems like a sane option: it does result in a clearly
	// visible enlargement, and at the same time doesn't introduce too much "artifacts".
	//
	// Also, such artificial upscale resolves the issue of the user not understanding
	// whether they have clicked on the thumbnail or not when opening a picture slide
	// in "hover" mode: in "hover" mode, the original image is opened right above the thumbnail,
	// and if the original image was of the same (or nearly the same) size as the thumbnail
	// then the user would get confused on whether the slide is already "opened" or not.
	//
	minSlideScaleFactorRelativeToThumbnailSize: PropTypes.number,
	minSlideSizeWhenScaledDown: PropTypes.number,

	showPagination: PropTypes.bool,
	showThumbnails: PropTypes.bool,

	fullScreenFitPrecisionFactor: PropTypes.number,
	margin: PropTypes.number,
	minMargin: PropTypes.number,

	headerHeight: PropTypes.number,
	footerHeight: PropTypes.number,

	useCardsForSlidesMaxOverlayOpacity: PropTypes.number,

	paginationDotsMaxSlidesCount: PropTypes.number,

	goToSource: PropTypes.func,
	onClose: PropTypes.func,

	imageElement: PropTypes.any, // `Element` is not defined on server side. // PropTypes.instanceOf(Element),

	viewers: PropTypes.arrayOf(PluginType),

	messages: PropTypes.shape({
		actions: PropTypes.shape({
			scaleDown: PropTypes.string,
			scaleUp: PropTypes.string,
			scaleReset: PropTypes.string,
			openExternalLink: PropTypes.string,
			download: PropTypes.string,
			goToSource: PropTypes.string,
			hideControls: PropTypes.string,
			showControls: PropTypes.string,
			close: PropTypes.string,
			previous: PropTypes.string,
			next: PropTypes.string,
			exitPanAndZoomMode: PropTypes.string
		}).isRequired,
		// The template for outputting the current scale value:
		// "{scaleValueBefore}1.23x{scaleValueAfter}".
		// `undefined` equals to an empty string.
		scaleValueBefore: PropTypes.string,
		scaleValueAfter: PropTypes.string
	}),

	autoPlay: PropTypes.bool,

	slides: PropTypes.arrayOf(slideType)
}

export const defaultProps = {
	initialSlideIndex: 0,
	mode: undefined,
	inline: false,
	fullScreen: false,

	overlayOpacity: 0.85,

	closeOnOverlayClick: true,

	animateCloseOnPanOut: 'fade',

	openPictureInHoverMode: true,

	dragOffsetThreshold: 5,
	emulatePanResistanceOnFirstAndLastSlides: false,
	panSlideInAnimationDuration: 500,
	panSlideInAnimationDurationMin: 150,

	showControls: true,
	highContrastControls: false,

	showScaleButtons: true,
	scaleStep: 0.5,
	scaleAnimationDuration: 120,
	minScaledSlideRatio: 0.1,
	mouseWheelScaleFactor: 0.33,
	minSlideScaleFactorRelativeToThumbnailSize: 1.25,
	minSlideSizeWhenScaledDown: 64,

	showPagination: true,
	showThumbnails: false,

	fullScreenFitPrecisionFactor: 0.875,
	margin: 0.025, // %
	minMargin: 10, // px

	headerHeight: undefined,
	footerHeight: undefined,

	useCardsForSlidesMaxOverlayOpacity: 0.2,

	paginationDotsMaxSlidesCount: 10,

	messages: {
		actions: {
			//
		}
	}
}

export const SlideshowStateTypes = {
	openClosePhase: PropTypes.oneOf([
		'closed',
		'opening',
		'open',
		'closing'
	]).isRequired,

	// By default, slides don't have any offset, i.e. their "origin" point is the center of the screen.
	// Sometimes, the app might prefer to introduce custom offset for a given slide.
	// For example, when a user clicks an slide's thumbnail somewhere on a page,
	// the app might prefer to show an enlarged picture of the slide right above
	// the thumbnail the user has clicked.
	// In such cases, that particular slide will have "custom" offset
	// and these properties will be set in Slideshow `state`.
	slideWithCustomOffsetIndex: PropTypes.number,
	slideWithCustomOffsetOriginX: PropTypes.number,
	slideWithCustomOffsetOriginY: PropTypes.number,

	openAnimationDuration: PropTypes.number,
	closeAnimationDuration: PropTypes.number
}