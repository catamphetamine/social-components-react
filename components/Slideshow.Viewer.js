export function getViewerForSlide(slide, viewers) {
	const viewer = getViewerForSlide_(slide, viewers)
	if (viewer) {
		return viewer
	}
	console.error('Slide type not supported:')
	console.error(slide)
}

export function hasViewerForSlide(slide, viewers) {
	return Boolean(getViewerForSlide_(slide, viewers))
}

function getViewerForSlide_(slide, viewers) {
	for (const viewer of viewers) {
		if (viewer.canRender(slide)) {
			return viewer
		}
	}
}