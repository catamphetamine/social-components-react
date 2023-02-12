import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-pages'
import classNames from 'classnames'

import Padding from './Padding.js'

import PressedStateButton from './PressedStateButton.js'

import replaceUrl from '../utility/replaceUrl.js'
import isRelativeUrl from '../utility/isRelativeUrl.js'

import './PostSelfLink.css'

export default function PostSelfLink({
	url,
	baseUrl,
	updatePageUrlToPostUrlOnClick,
	navigateToPostUrlOnClick,
	onClick,
	className,
	children
}) {
	const _onClick = useCallback((event) => {
		if (onClick) {
			onClick(event)
		}
		if (updatePageUrlToPostUrlOnClick) {
			replacePageUrl((baseUrl || '') + url)
		}
		if (!navigateToPostUrlOnClick) {
			if (!event.defaultPrevented) {
				event.preventDefault()
			}
		}
	}, [url, baseUrl, onClick])

	const isClickable = Boolean(onClick || updatePageUrlToPostUrlOnClick || navigateToPostUrlOnClick)

	if (!isClickable) {
		return (
			<Padding>
				<span className={classNames('PostSelfLink', className)}>
					{children}
				</span>
			</Padding>
		)
	}

	let props
	if (isRelativeUrl(url)) {
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
	updatePageUrlToPostUrlOnClick: PropTypes.bool,
	navigateToPostUrlOnClick: PropTypes.bool,
	onClick: PropTypes.func,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}

PostSelfLink.defaultProps = {
	updatePageUrlToPostUrlOnClick: true
}

// Replaces the current web browser page's URL without reloading the page.
function replacePageUrl(newUrl) {
	// https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page
	window.history.replaceState(null, document.title, newUrl)
}