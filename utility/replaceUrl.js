export default function replaceUrl(url) {
	history.replaceState(undefined, undefined, url)
}