import React from 'react'
import PropTypes from 'prop-types'

import './VideoPlayIcon.css'

export default function VideoPlayIcon({ className }) {
	return (
		<svg viewBox="0 0 30 30" className={`VideoPlayIcon ${className || ''}`}>
			<path className="VideoPlayIcon-border" d="M15,0C6.7,0,0,6.7,0,15s6.7,15,15,15s15-6.7,15-15S23.3,0,15,0z M15,29.3C7.1,29.3,0.7,22.9,0.7,15C0.7,7.1,7.1,0.7,15,0.7 S29.3,7.1,29.3,15C29.3,22.9,22.9,29.3,15,29.3z"/>
			<circle className="VideoPlayIcon-background" cx="15" cy="15" r="14.3"/>
			<path className="VideoPlayIcon-triangle" d="M21.6,15.5L12.1,21c-0.5,0.3-0.9,0-0.9-0.5v-11c0-0.6,0.4-0.8,0.9-0.5l9.5,5.5C22.1,14.8,22.1,15.2,21.6,15.5z"/>
		</svg>
	)
}

VideoPlayIcon.propTypes = {
	className: PropTypes.string
}