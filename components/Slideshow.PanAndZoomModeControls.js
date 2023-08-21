import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './Slideshow.PanAndZoomModeControls.css'

export default function PanAndZoomModeControls({
	slideshow,
	messages,
	panAndZoomMode,
	scale
}) {
	const roundedScale = useMemo(() => {
		return roundScale(scale)
	}, [scale])

	const onExitPanAndZoomMode = useCallback(() => {
		if (!slideshow.isLocked()) {
			slideshow.panAndZoomMode.exitPanAndZoomMode()
		}
	}, [slideshow])

	return (
		<div className="Slideshow-PanAndZoomModeControls">
			<button
				type="button"
				title={messages.actions.exitPanAndZoomMode}
				onClick={onExitPanAndZoomMode}
				className={getPanAndZoomModeButtonClassName(roundedScale, panAndZoomMode)}>
				{messages.scaleValueBefore &&
					<span className="Slideshow-PanAndZoomModeButtonText Slideshow-PanAndZoomModeButtonText--beforeScaleValue">
						{messages.scaleValueBefore}
					</span>
				}
				{/*<div className="Slideshow-ActionSeparator"/>*/}
				{/*<ScaleFrame className="Slideshow-ActionIcon"/>*/}
				<span className="Slideshow-PanAndZoomModeButtonScaleValue">
					{roundedScale}
				</span>
				<span style={SCALE_X_STYLE}>
					x
				</span>
				{messages.scaleValueAfter &&
					<span className="Slideshow-PanAndZoomModeButtonText Slideshow-PanAndZoomModeButtonText--afterScaleValue">
						{messages.scaleValueAfter}
					</span>
				}
			</button>
		</div>
	)
}

PanAndZoomModeControls.propTypes = {
	slideshow: PropTypes.object.isRequired,
	scale: PropTypes.number.isRequired,
	panAndZoomMode: PropTypes.bool,
	messages: PropTypes.object.isRequired
}

export function roundScale(scale) {
	if (scale < 0.95) {
		if (scale < 0.095) {
			return Math.round(scale * 100) / 100
		} else {
			return Math.round(scale * 10) / 10
		}
	} else {
		return Math.round(scale)
	}
}

// This function is used to dynamically update "Pan and Zoom" mode button's
// scale value without going through a complete React re-render.
export function getPanAndZoomModeButtonClassName(roundedScale, panAndZoomMode) {
	return classNames('Button', 'Slideshow-PanAndZoomModeButton', {
		'Slideshow-PanAndZoomModeButton--hidden': !panAndZoomMode,
		// 'Slideshow-Action--fontSize-s': roundedScale >= 1 && roundedScale < 10,
		// 'Slideshow-Action--fontSize-xs': roundedScale >= 10 && roundedScale < 100 || roundedScale >= 0.1 && roundedScale < 1,
		// 'Slideshow-Action--fontSize-xxs': roundedScale >= 100 || roundedScale >= 0.01 && roundedScale < 0.1,
	})
}

const SCALE_X_STYLE = {
	marginLeft: '0.1em',
	fontSize: '85%'
}