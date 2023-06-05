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
	initialSlideIndex: PropTypes.number.isRequired,

	// Set to `true` to open slideshow in inline mode (rather than in a modal).
	inline: PropTypes.bool.isRequired,
	// Set to `true` to open slideshow in "native" browser fullscreen mode.
	fullScreen: PropTypes.bool.isRequired,

	overlayOpacity: PropTypes.number.isRequired,
	// Overlay opacity when a slide is open using "float" animation.
	// This can be used to show a "lighter" overlay when opening slides
	// using "float" animation, because it results in a more "seamless" user experience.
	overlayOpacityOnFloatOpenCloseAnimation: PropTypes.number,

	closeOnOverlayClick: PropTypes.bool,
	closeOnSlideClick: PropTypes.bool,

	animateOpenClose: PropTypes.oneOf([true, 'float']),
	animateOpenCloseOnSmallScreen: PropTypes.oneOf([true, 'float']),
	// A picture is open in "hover" mode when it's expanded
	// centered above its thumbnail.
	animateOpenClosePictureInHoverMode: PropTypes.oneOf([false, 'float']),
	animateCloseOnPanOut: PropTypes.bool,

	// What's the criterion of a "small" screen.
	smallScreenMaxWidth: PropTypes.number,

	// A picture is open in "hover" mode when it's expanded
	// centered above its thumbnail.
	openPictureInHoverMode: PropTypes.bool,

	// How much should a user move a mouse cursor when dragging
	// in order to activate "pan" mode.
	panOffsetThreshold: PropTypes.number.isRequired,
	// Emulate pan resistance on slideshow left-most and right-most sides.
	emulatePanResistanceOnFirstAndLastSlides: PropTypes.bool,
	// The duration of a "slide in" animation when a user
	// switches a slide while panning.
	panSlideInAnimationDuration: PropTypes.number.isRequired,
	// The minumum duration of a "slide in" animation when a user
	// switches a slide while panning.
	panSlideInAnimationDurationMin: PropTypes.number.isRequired,

	showControls: PropTypes.bool,
	highContrastControls: PropTypes.bool,

	showScaleButtons: PropTypes.bool,
	// Scale multiplier when transitioning from a previous scale step to a next scale step.
	scaleStep: PropTypes.number.isRequired,
	scaleAnimationDuration: PropTypes.number.isRequired,
	minScaledSlideRatio: PropTypes.number.isRequired,
	mouseWheelScaleFactor: PropTypes.number.isRequired,
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
	minSlideScaleFactorRelativeToThumbnailSize: PropTypes.number.isRequired,

	showPagination: PropTypes.bool,

	fullScreenFitPrecisionFactor: PropTypes.number.isRequired,
	margin: PropTypes.number.isRequired,
	minMargin: PropTypes.number.isRequired,

	headerHeight: PropTypes.number,
	footerHeight: PropTypes.number,

	useCardsForSlidesMaxOverlayOpacity: PropTypes.number.isRequired,

	paginationDotsMaxSlidesCount: PropTypes.number.isRequired,

	goToSource: PropTypes.func,
	onClose: PropTypes.func.isRequired,

	imageElement: PropTypes.any, // `Element` is not defined on server side. // PropTypes.instanceOf(Element),

	plugins: PropTypes.arrayOf(PluginType).isRequired,

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
			exitDragAndScaleMode: PropTypes.string
		}).isRequired,
		// The template for outputting the current scale value:
		// "{scaleValueBefore}1.23x{scaleValueAfter}".
		// `undefined` equals to an empty string.
		scaleValueBefore: PropTypes.string,
		scaleValueAfter: PropTypes.string
	}).isRequired,

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

	animateOpenClose: true,
	animateOpenClosePictureInHoverMode: 'float',

	openPictureInHoverMode: true,

	panOffsetThreshold: 5,
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

	showPagination: true,

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
	hasStartedOpening: PropTypes.bool,
	hasFinishedOpening: PropTypes.bool,
	hasStartedClosing: PropTypes.bool,
	hasFinishedClosing: PropTypes.bool,

	offsetSlideIndex: PropTypes.number,
	offsetSlideOriginX: PropTypes.number,
	offsetSlideOriginY: PropTypes.number,

	openAnimationDuration: PropTypes.number,
	closeAnimationDuration: PropTypes.number
}