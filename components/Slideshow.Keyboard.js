import { isKeyCombination, belongsToClickableElement } from 'web-browser-input'

export default class SlideshowKeyboard {
	constructor(slideshow) {
		this.slideshow = slideshow
		slideshow.onKeyDown = this.onKeyDown
	}

	onKeyDown = (event) => {
		if (this.locked) {
			return event.preventDefault()
		}
		if (this.slideshow.getPluginForSlide().onKeyDown) {
			if (this.slideshow.getPluginForSlide().onKeyDown(event, {
				// slide: this.slideshow.getCurrentSlide()
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

	getMatchingControl(event) {
		// Handle "Drag and Scale" mode keyboard interaction.
		const dragAndScaleMode = this.slideshow.isDragAndScaleMode()
		for (const control of KEYBOARD_CONTROLS) {
			if (control.dragAndScaleMode && !dragAndScaleMode) {
				continue
			}
			let keyCombinations = control.keys
			if (!Array.isArray(keyCombinations[0])) {
				keyCombinations = [keyCombinations]
			}
			for (const keys of keyCombinations) {
				if (isKeyCombination.call(this, event, keys)) {
					return control
				}
			}
		}
	}

	handleKey(event) {
		const control = this.getMatchingControl(event)
		if (!control) {
			return
		}
		event.preventDefault()
		if (this.slideshow.locked) {
			return
		}
		control.action(this.slideshow)
		return true
	}
}

const KEYBOARD_CONTROLS = [
	// Move right.
	{
		dragAndScaleMode: true,
		keys: ['Right'],
		action: slideshow => {
			slideshow.pan.dragOffsetX += slideshow.getDragAndScaleModeMoveStep()
			slideshow.onDragOffsetChange({ animate: true })
		}
	},
	// Move left.
	{
		dragAndScaleMode: true,
		keys: ['Left'],
		action: slideshow => {
			slideshow.pan.dragOffsetX -= slideshow.getDragAndScaleModeMoveStep()
			slideshow.onDragOffsetChange({ animate: true })
		}
	},
	// Move up.
	{
		dragAndScaleMode: true,
		keys: ['Up'],
		action: slideshow => {
			slideshow.pan.dragOffsetY -= slideshow.getDragAndScaleModeMoveStep()
			slideshow.onDragOffsetChange({ animate: true })
		}
	},
	// Move down.
	{
		dragAndScaleMode: true,
		keys: ['Down'],
		action: slideshow => {
			slideshow.pan.dragOffsetY += slideshow.getDragAndScaleModeMoveStep()
			slideshow.onDragOffsetChange({ animate: true })
		}
	},
	// Close.
	{
		dragAndScaleMode: true,
		keys: ['Esc'],
		action: slideshow => slideshow.exitDragAndScaleMode()
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
		action: slideshow => slideshow.onScaleUp(event)
	},
	// Scale down.
	{
		keys: [['Down'], ['Shift', 'Down']],
		action: slideshow => slideshow.onScaleDown(event)
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