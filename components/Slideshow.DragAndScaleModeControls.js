import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './Slideshow.DragAndScaleModeControls.css'

export default function DragAndScaleModeControls({
	slideshow,
	messages,
	dragAndScaleMode,
	scale
}) {
	const roundedScale = useMemo(() => roundScale(scale), [scale])
	return (
		<div className="Slideshow-DragAndScaleModeControls">
			<button
				type="button"
				title={messages.actions.exitDragAndScaleMode}
				onClick={slideshow.onExitDragAndScaleMode}
				className={getDragAndScaleModeButtonClassName(roundedScale, dragAndScaleMode)}>
				{messages.scaleValueBefore &&
					<span className="Slideshow-DragAndScaleModeButtonText Slideshow-DragAndScaleModeButtonText--beforeScaleValue">
						{messages.scaleValueBefore}
					</span>
				}
				{/*<div className="Slideshow-ActionSeparator"/>*/}
				{/*<ScaleFrame className="Slideshow-ActionIcon"/>*/}
				<span className="Slideshow-DragAndScaleModeButtonScaleValue">{roundedScale}</span>
				<span style={SCALE_X_STYLE}>x</span>
				{messages.scaleValueAfter &&
					<span className="Slideshow-DragAndScaleModeButtonText Slideshow-DragAndScaleModeButtonText--afterScaleValue">
						{messages.scaleValueAfter}
					</span>
				}
			</button>
		</div>
	)
}

DragAndScaleModeControls.propTypes = {
	slideshow: PropTypes.object.isRequired,
	scale: PropTypes.number.isRequired,
	dragAndScaleMode: PropTypes.bool,
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

// This function is used to dynamically update "Drag and Scale" mode button's
// scale value without going through a complete React re-render.
export function getDragAndScaleModeButtonClassName(roundedScale, dragAndScaleMode) {
	return classNames('Button', 'Slideshow-DragAndScaleModeButton', {
		'Slideshow-DragAndScaleModeButton--hidden': !dragAndScaleMode,
		// 'Slideshow-Action--fontSize-s': roundedScale >= 1 && roundedScale < 10,
		// 'Slideshow-Action--fontSize-xs': roundedScale >= 10 && roundedScale < 100 || roundedScale >= 0.1 && roundedScale < 1,
		// 'Slideshow-Action--fontSize-xxs': roundedScale >= 100 || roundedScale >= 0.01 && roundedScale < 0.1,
	})
}

const SCALE_X_STYLE = {
	marginLeft: '0.1em',
	fontSize: '85%'
}