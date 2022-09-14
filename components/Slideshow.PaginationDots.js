import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from './Button.js'

import './Slideshow.PaginationDots.css'

export default function SlideshowPaginationDots({
	slideIndex,
	count,
	onGoToSlide,
	highContrast,
	isDisabled,
	className
}) {
	// A `<button/>` can't be placed inside a `<button/>`,
	// so the pagination container is not a clickable button.

	// `tabIndex` is `-1`:
	// Keyboard-only users could simply page through
	// because "dots" pagination is only shown when there're
	// not many slides, so it's an acceptable solution.

	return (
		<div
			className={classNames('Slideshow-PaginationDots', className, {
				'Slideshow-PaginationDots--highContrast': highContrast
			})}>
			{createRange(count).map((_, j) => (
				<Button
					key={j}
					onClick={(event) => {
						if (!isDisabled()) {
							onGoToSlide(j + 1)
						}
					}}
					tabIndex={-1}
					className="Slideshow-PaginationDotButton">
					<div
						className={classNames('Slideshow-PaginationDot', {
							'Slideshow-PaginationDot--selected': j === slideIndex,
							'Slideshow-PaginationDot--highContrast': highContrast
						})}/>
				</Button>
			))}
		</div>
	)
}

SlideshowPaginationDots.propTypes = {
	slideIndex: PropTypes.number.isRequired,
	count: PropTypes.number.isRequired,
	onGoToSlide: PropTypes.func.isRequired,
	highContrast: PropTypes.bool,
	isDisabled: PropTypes.func.isRequired,
	className: PropTypes.string
}

function createRange(N) {
	const range = new Array(N)
	for (let i = 1; i <= N; i++) {
		range[i - 1] = i
	}
	return range
}