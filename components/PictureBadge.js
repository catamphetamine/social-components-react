import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './PictureBadge.css'

export default function PictureBadge({
	placement,
	className,
	children,
	...rest
}) {
	// `<span/>` is used instead of a `<div/>`
	// because a `<div/>` isn't supposed to be inside a `<button/>`.
	return (
		<span
			{...rest}
			className={classNames(className, 'PictureBadge', {
				'PictureBadge--bottomRight': placement === 'bottom-right',
				'PictureBadge--topRight': placement === 'top-right'
			})}>
			{children}
		</span>
	)
}

PictureBadge.propTypes = {
	placement: PropTypes.oneOf([
		'bottom-right',
		'top-right'
	]).isRequired,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}