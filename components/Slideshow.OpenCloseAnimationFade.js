// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import triggerDomElementRender from '../utility/triggerDomElementRender.js'

const SCALE = 0.95
const ANIMATION_DURATION_LONG = 120
const ANIMATION_DURATION = 40 // 50ms is 3 frames at 60fps

export default class OpenCloseAnimationFade {
	constructor(slideshow) {
		this.slideshow = slideshow
	}

	onOpen(slideElement, { imageElement, slideOffsetX, slideOffsetY }) {
		const useLongerOpenCloseAnimation = false
		const animationDuration = useLongerOpenCloseAnimation ? ANIMATION_DURATION_LONG : ANIMATION_DURATION
		const animateOpenSlideAndBackgroundSeparately = useLongerOpenCloseAnimation ? true : false
		if (animateOpenSlideAndBackgroundSeparately) {
			this.animateOpen(slideElement, {
				slideOffsetX,
				slideOffsetY,
				animationDuration,
				useLongerOpenCloseAnimation
			})
		}
		// Return animation duration and a `Promise`.
		return {
			animationDuration,
			promise: timeoutPromise(animationDuration).then(() => {
				if (animateOpenSlideAndBackgroundSeparately) {
					slideElement.style.transition = 'none'
				}
			})
		}
	}

	animateOpen(slideElement, {
		slideOffsetX,
		slideOffsetY,
		animationDuration,
		useLongerOpenCloseAnimation
	}) {
		const slideWidth = slideElement.offsetWidth
		const slideHeight = slideElement.offsetHeight
		// Set up a pre-transition state.
		const transforms = []
		if (useLongerOpenCloseAnimation) {
			transforms.push(`scale(${SCALE})`)
		}
		if (slideOffsetX !== undefined) {
			transforms.push(
				`translateX(${slideOffsetX - slideWidth * (1 - SCALE) / 2}px)`,
				`translateY(${slideOffsetY - slideHeight * (1 - SCALE) / 2}px)`
			)
		}
		if (transforms.length > 0) {
			slideElement.style.transform = transforms.join(' ')
		}
		slideElement.style.opacity = 0
		triggerDomElementRender(slideElement)
		// Perform a transition to a new state.
		const transitions = [`opacity ${animationDuration}ms`]
		if (transforms.length > 0 && slideOffsetX === undefined) {
			// If `slideOffsetX` is applied, then preserve the offset `transform`,
			// so that it doesn't animate the slide floating to a zero-offset position.
			transitions.push(`transform ${animationDuration}ms`)
		}
		slideElement.style.transition = transitions.join(', ')
		if (transforms.length > 0) {
			slideElement.style.transform = 'none'
		}
		slideElement.style.opacity = 1
	}

	onClose(slideElement, { useLongerOpenCloseAnimation }) {
		const animationDuration = useLongerOpenCloseAnimation ? ANIMATION_DURATION_LONG : ANIMATION_DURATION
		const animateOpenSlideAndBackgroundSeparately = useLongerOpenCloseAnimation ? true : false
		if (animateOpenSlideAndBackgroundSeparately) {
			this.animateClose(slideElement, { animationDuration, useLongerOpenCloseAnimation })
		}
		// Return animation duration and a `Promise`.
		return {
			animationDuration,
			promise: timeoutPromise(animationDuration).then(() => {
				if (animateOpenSlideAndBackgroundSeparately) {
					slideElement.style.transition = 'none'
				}
			})
		}
	}

	animateClose(slideElement, { animationDuration, useLongerOpenCloseAnimation }) {
		// Set up a pre-transition state.
		const transforms = []
		// Preserves the current `translateX()` and `translateY()`.
		const transform = slideElement.style.transform
		if (transform && transform !== 'none') {
			transforms.push(transform)
		}
		if (useLongerOpenCloseAnimation) {
			transforms.push(`scale(${SCALE})`)
		}
		// Perform a transition to a new state.
		const transitions = [`opacity ${animationDuration}ms`]
		if (transforms.length > 0) {
			transitions.push(`transform ${animationDuration}ms`)
		}
		slideElement.style.transition = transitions.join(', ')
		if (transforms.length > 0) {
			slideElement.style.transform = transforms.join(' ')
		}
		slideElement.style.opacity = 0
	}
}

function timeoutPromise(duration) {
	return new Promise(resolve => setTimeout(resolve, duration))
}