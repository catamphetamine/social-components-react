import { isKeyCombination, belongsToClickableElement } from 'web-browser-input'

export default class SlideshowKeyboard {
	constructor(slideshow, { getSlideDOMNode }) {
		this.slideshow = slideshow
		this.getSlideDOMNode = getSlideDOMNode
	}

	getFunctions() {
		return {
			onKeyDown: this.onKeyDown
		}
	}

	onKeyDown = (event) => {
		if (this.locked) {
			return event.preventDefault()
		}
		if (this.slideshow.getViewerForSlide().shouldIgnoreKeyDownEvent) {
			if (this.slideshow.getViewerForSlide().shouldIgnoreKeyDownEvent(event, {
				getSlideElement: this.getSlideDOMNode
			}) === true) {
				return
			}
		}
		if (event.defaultPrevented) {
			return
		}
		// "Space" shows next slide only if not focused on a clickable element.
		if (isKeyCombination(event, ['Space'])) {
			if (belongsToClickableElement(event.target)) {
				return
			}
		}
		if (this.handleKey(event)) {
			return event.preventDefault()
		}
	}

	getMatchingControls(event) {
		// Handle "Pan and Zoom" mode keyboard interaction.
		const isPanAndZoomMode = this.slideshow.panAndZoomMode.isPanAndZoomMode()

		return KEYBOARD_CONTROLS.filter((control) => {
			if (control.panAndZoomMode && !isPanAndZoomMode) {
				return false
			}
			let keyCombinations = control.keys
			if (!Array.isArray(keyCombinations[0])) {
				keyCombinations = [keyCombinations]
			}
			for (const keys of keyCombinations) {
				if (isKeyCombination.call(this, event, keys)) {
					return true
				}
			}
		})
	}

	handleKey(event) {
		const controls = this.getMatchingControls(event)
		if (controls.length === 0) {
			return false
		}
		// For some weird reason, in Chrome, as of Jul 2023,
		// even though `event.defaultPrevented` is `true` here,
		// it's `false` in `Video.js` in `onKeyDown()` handler.
		// The bug could be observed by opening a video slide,
		// enlarging it to Pan & Zoom mode and then shifting it
		// via arrow keys.
		if (this.slideshow.isLocked()) {
			return false
		}
		let result
		for (const control of controls) {
			result = control.action(this.slideshow)
			if (result === false) {
				continue
			}
			return true
		}
		if (result === false) {
			return false
		}
		return true
	}
}

const KEYBOARD_CONTROLS_PAN_AND_ZOOM_MODE = [
	// Move right.
	{
		panAndZoomMode: true,
		keys: ['Right'],
		action: slideshow => {
			slideshow.drag.setDragOffsetX(slideshow.drag.getDragOffsetX() + slideshow.panAndZoomMode.getPanAndZoomModeMoveStep())
			slideshow.drag.onDragOffsetChange({ animate: true })
		}
	},
	// Move left.
	{
		panAndZoomMode: true,
		keys: ['Left'],
		action: slideshow => {
			slideshow.drag.setDragOffsetX(slideshow.drag.getDragOffsetX() - slideshow.panAndZoomMode.getPanAndZoomModeMoveStep())
			slideshow.drag.onDragOffsetChange({ animate: true })
		}
	},
	// Move up.
	{
		panAndZoomMode: true,
		keys: ['Up'],
		action: slideshow => {
			slideshow.drag.setDragOffsetY(slideshow.drag.getDragOffsetY() - slideshow.panAndZoomMode.getPanAndZoomModeMoveStep())
			slideshow.drag.onDragOffsetChange({ animate: true })
		}
	},
	// Move down.
	{
		panAndZoomMode: true,
		keys: ['Down'],
		action: slideshow => {
			slideshow.drag.setDragOffsetY(slideshow.drag.getDragOffsetY() + slideshow.panAndZoomMode.getPanAndZoomModeMoveStep())
			slideshow.drag.onDragOffsetChange({ animate: true })
		}
	},
	// Close.
	{
		panAndZoomMode: true,
		keys: ['Esc'],
		action: slideshow => {
			// Exit pinch-zoom emulation mode.
			if (CAN_EMULATE_PINCH_ZOOM_MODE) {
				if (slideshow.pinchZoom.stopPinchZoom()) {
					return true
				}
			}
			// Exit "Pan and Zoom" mode.
			slideshow.panAndZoomMode.exitPanAndZoomMode()
		}
	}
]

// To emulate pinch-zoom mode, set this flag to `true`
// and then press Ctrl + Shift + Z keys to enter pinch-zoom emulation mode.
// Then move the mouse cursor to pinch-zoom.
// To exit pinch-zoom mode, press Esc key.
const CAN_EMULATE_PINCH_ZOOM_MODE = true

const KEYBOARD_CONTROLS = [
	...KEYBOARD_CONTROLS_PAN_AND_ZOOM_MODE,
	// Enter pinch-zoom emulation mode.
	{
		keys: ['Ctrl', 'Shift', 'Z'],
		action: slideshow => {
			// Debugging multi-touch zoom.
			// DevTools doesn't provide the means to test multi-touch.
			if (CAN_EMULATE_PINCH_ZOOM_MODE) {
				if (!slideshow.pinchZoom.enterPinchZoomEmulationMode()) {
					return false
				}
			}
		}
	},
	// Exit pinch-zoom emulation mode.
	{
		keys: ['Esc'],
		action: slideshow => {
			if (CAN_EMULATE_PINCH_ZOOM_MODE) {
				if (slideshow.pinchZoom.stopPinchZoom()) {
					return true
				}
			}
			return false
		}
	},
	// Show previous slide.
	{
		keys: [['Left'], ['Ctrl', 'Left'], ['PageUp']],
		action: slideshow => {
			slideshow.resetAnimations()
			slideshow.showPrevious()
		}
	},
	// Show next slide.
	{
		keys: [['Right'], ['Ctrl', 'Right'], ['PageDown'], ['Space']],
		action: slideshow => {
			slideshow.resetAnimations()
			slideshow.showNext()
		}
	},
	// Scale up.
	{
		keys: [['Up'], ['Shift', 'Up']],
		action: slideshow => slideshow.scale.onScaleUp(event)
	},
	// Scale down.
	{
		keys: [['Down'], ['Shift', 'Down']],
		action: slideshow => slideshow.scale.onScaleDown(event)
	},
	// Close.
	{
		keys: ['Esc'],
		action: slideshow => slideshow.close()
	},
	// Capture "Home"/"End" keys so that it doesn't scroll the page.
	{
		keys: ['Home'],
		action: (slideshow) => {
			slideshow.resetAnimations()
			slideshow.showFirst()
		}
	},
	{
		keys: ['End'],
		action: (slideshow) => {
			slideshow.resetAnimations()
			slideshow.showLast()
		}
	}
]