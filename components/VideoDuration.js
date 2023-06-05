import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import PictureBadge from './PictureBadge.js'

import './VideoDuration.css'

export default function VideoDuration({ duration }) {
	const integerDuration = useMemo(() => {
		// `if (typeof video.duration === 'number')` check could be used here
		// instead of just `if (video.duration)` because `video.duration` could be `0`.
		// But showing a `0:00` duration wouldn't make sense either,
		// so just `if (video.duration)` check is used here.
		if (duration) {
			// Convert `video.duration` from a floating-point number to an integer,
			// because `getDuration()` will be rendered on a video thumbnail.
			return Math.ceil(duration)
		}
	}, [duration])

	return (
		<PictureBadge
			placement="bottom-right"
			className={classNames('VideoDuration', {
				//'VideoDuration--time': integerDuration
			})}>
			{integerDuration ? formatVideoDuration(integerDuration) : <VideoDurationPlayIcon/>}
		</PictureBadge>
	)
}

VideoDuration.propTypes = {
	duration: PropTypes.number,
	children: PropTypes.string
}

function formatVideoDuration(seconds) {
	let minutes = Math.floor(seconds / 60)
	seconds = seconds % 60
	const hours = Math.floor(minutes / 60)
	minutes = minutes % 60
	if (hours === 0) {
		return minutes + ':' + formatTwoPositions(seconds)
	}
	return hours + ':' + formatTwoPositions(minutes) + ':' + formatTwoPositions(seconds)
}

function formatTwoPositions(number) {
	if (number < 10) {
		return '0' + number
	}
	return number
}

function VideoDurationPlayIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			className="VideoDuration-playIcon">
			<polygon fill="currentColor" stroke="none" points="0,0 100,50 0,100"/>
		</svg>
	)
}