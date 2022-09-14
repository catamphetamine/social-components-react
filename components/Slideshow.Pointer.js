export default class SlideshowPointer {
	constructor(slideshow, props) {
		this.slideshow = slideshow
		this.props = props
		// React doesn't support setting up non-passive listeners.
		// https://github.com/facebook/react/issues/14856
		// onWheel={this.onWheel}>
		slideshow.onInit(({ container }) => {
			container.addEventListener('wheel', this.onWheel)
		})
		// slideshow.onWheel = this.onWheel
	}

	onBackgroundClick = (event) => {
		const { closeOnOverlayClick, isOverlay } = this.props
		// Only handle clicks on slideshow overlay.
		if (!isOverlay(event.target)) {
			return
		}
		if (closeOnOverlayClick) {
			this.slideshow.close()
		}
	}

	onWheel = (event) => {
		const { inline, mouseWheelScaleFactor } = this.props
		const { deltaY } = event
		if (!inline) {
			event.preventDefault()
			if (deltaY < 0) {
				this.slideshow.onScaleUp(event, mouseWheelScaleFactor)
			} else {
				this.slideshow.onScaleDown(event, mouseWheelScaleFactor)
			}
		}
	}

	/**
	 * Returns `true` if the left mouse button was clicked.
	 * @param  {Event}  event
	 * @return {Boolean}
	 */
	isClickDown(event) {
		return event.button === 0
		// switch (event.button) {
		// 	// Left
		// 	case 0:
		// 		return true
		// 	// Middle
		// 	case 1:
		// 	// Right
		// 	case 2:
		// 	default:
		// 		return false
		// }
	}
}