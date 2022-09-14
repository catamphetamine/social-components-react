/**
 * Loads script from a `url`.
 * @param  {string} url
 * @param  {function} setCallback — If no `setCallback(resolve)` function is passed then the returned `Promise` resolves as soon as the script has loaded. If `setCallback(resolve)` function is passed then the returned `Promise` will only resolve after the script has performed some initialization (for example, running some additional HTTP requests) and then called the callback manually. For example, Google YouTube API script calls `window.onYouTubeIframeAPIReady()` function when it has finished loading.
 * @return {Promise}
 */
export default function loadScript(url, setCallback) {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.onerror = (event) => {
			document.head.removeChild(script)
			const error = new Error('SCRIPT_ERROR')
			error.event = event
			reject(error)
		}
		script.src = url
		if (setCallback) {
			setCallback(() => resolve(script))
		} else {
			script.onload = () => resolve(script)
		}
		const firstScriptTag = document.getElementsByTagName('script')[0]
		firstScriptTag.parentNode.insertBefore(script, firstScriptTag)
	})
}