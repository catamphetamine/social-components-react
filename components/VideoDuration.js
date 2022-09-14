import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import PictureBadge from './PictureBadge.js'

import './VideoDuration.css'

export default function VideoDuration({ duration }) {
	return (
		<PictureBadge
			placement="bottom-right"
			className={classNames('VideoDuration', {
				//'VideoDuration--time': duration
			})}>
			{duration ? formatVideoDuration(duration) : <VideoDurationPlayIcon/>}
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