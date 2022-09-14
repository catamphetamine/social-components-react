import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from './Button.js'

import SlideshowPaginationDots from './Slideshow.PaginationDots.js'
import SlideshowPaginationNumeric from './Slideshow.PaginationNumeric.js'

import './Slideshow.Pagination.css'

export default function SlideshowPagination({
	slideIndex,
	count,
	paginationDotsMaxSlidesCount,
	onGoToSlide,
	highContrast,
	isDisabled,
	...rest
}) {
	const Component = count > paginationDotsMaxSlidesCount
		? SlideshowPaginationNumeric
		: SlideshowPaginationDots
	return (
		<Component
			{...rest}
			slideIndex={slideIndex}
			count={count}
			onGoToSlide={onGoToSlide}
			highContrast={highContrast}
			isDisabled={isDisabled}/>
	)
}

SlideshowPagination.propTypes = {
	slideIndex: PropTypes.number.isRequired,
	count: PropTypes.number.isRequired,
	paginationDotsMaxSlidesCount: PropTypes.number.isRequired,
	onGoToSlide: PropTypes.func.isRequired,
	highContrast: PropTypes.bool,
	isDisabled: PropTypes.func.isRequired
}