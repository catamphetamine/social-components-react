import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-pages'
import classNames from 'classnames'

import Padding from './Padding.js'

import PressedStateButton from './PressedStateButton.js'

import replaceUrl from '../utility/replaceUrl.js'

import './PostSelfLink.css'

export default function PostSelfLink({
	url,
	baseUrl,
	onClick,
	className,
	children
}) {
	const _onClick = useCallback((event) => {
		if (onClick) {
			onClick(event)
		}
		if (!event.defaultPrevented) {
			event.preventDefault()
			replacePageUrl((baseUrl || '') + url)
		}
	}, [url, baseUrl, onClick])

	let props
	if (url[0] === '/') {
		props = {
			component: Link,
			to: url,
			onClick: _onClick
		}
	} else {
		props = {
			component: 'a',
			href: url,
			target: '_blank'
		}
	}

	return (
		<Padding>
			<PressedStateButton
				{...props}
				link
				className={classNames('PostSelfLink', className)}>
				{children}
			</PressedStateButton>
		</Padding>
	)
}

PostSelfLink.propTypes = {
	url: PropTypes.string,
	baseUrl: PropTypes.string,
	onClick: PropTypes.func,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}