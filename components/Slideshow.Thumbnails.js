import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Picture from './Picture.js'
import ButtonLink from './ButtonLink.js'
import SlideshowPropTypes from './Slideshow.PropTypes.js'

import { getDimensionalCalculatedCssVariable } from 'web-browser-style'

import './Slideshow.Thumbnails.css'

export default function SlideshowThumbnails({
	slideshow,
	slides,
	slideIndex,
	messages,
	measurements
}) {
	const { maxWidth, maxHeight } = measurements

	return (
		<div className="Slideshow-Thumbnails">
			{slides.map((slide, i) => {
				const viewer = slideshow.getViewerForSlide(slide)
				const picture = viewer.getThumbnail && viewer.getThumbnail(slide)
				return (
					<ButtonLink
						key={i}
						url={picture.url}
						onClick={(event) => {
							event.preventDefault()
							slideshow.goToSlide(i + 1)
						}}
						className={classNames('Slideshow-Thumbnail', {
							'Slideshow-Thumbnail--noThumbnail': !picture
						})}>
						{picture &&
							<Picture
								border
								useSmallestSize
								picture={picture}
								maxWidth={maxWidth}
								maxHeight={maxHeight}
								className="Slideshow-Thumbnail-picture"
							/>
						}
					</ButtonLink>
				)
			})}
		</div>
	)
}

SlideshowThumbnails.propTypes = {
	slideshow: PropTypes.object.isRequired,
	slides: SlideshowPropTypes.slides.isRequired,
	slideIndex: PropTypes.number.isRequired,
	messages: SlideshowPropTypes.messages,
	measurements: PropTypes.shape({
		maxWidth: PropTypes.number.isRequired,
		maxHeight: PropTypes.number.isRequired
	}).isRequired
}

SlideshowThumbnails.shouldRender = ({
	hasBeenMeasured,
	showThumbnails,
	slides
}) => {
	return hasBeenMeasured && showThumbnails && slides.length > 1
}

const THUMBNAIL_DEFAULT_MEASUREMENTS = {
	maxWidth: 256,
	maxHeight: 256,
	spacing: 16
}

SlideshowThumbnails.measure = () => {
	if (typeof window !== 'undefined') {
		return {
			maxWidth: parseInt(getDimensionalCalculatedCssVariable('--Slideshow-Thumbnail-maxWidth')),
			maxHeight: parseInt(getDimensionalCalculatedCssVariable('--Slideshow-Thumbnail-maxHeight')),
			spacing: parseInt(getDimensionalCalculatedCssVariable('--Slideshow-Thumbnail-marginRight'))
		}
	} else {
		return THUMBNAIL_DEFAULT_MEASUREMENTS
	}
}