export default function triggerDomElementRender(element) {
	// Getting `element.offsetWidth` causes a "reflow" in a web browser.
	// This is a trick to force it to play a subsequent CSS transition.
	// https://stackoverflow.com/questions/24148403/trigger-css-transition-on-appended-element
	// Other possible solutions could be `getBoundingClientRect()` or `requestAnimationFrame()`.
	element.offsetWidth
}