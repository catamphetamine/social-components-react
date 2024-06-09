import React, { useCallback, useState, useLayoutEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-pages'
import classNames from 'classnames'

import { postPostLinkShape } from './PropTypes.js'

import PostQuoteBlock from './PostQuoteBlock.js'
import PostQuoteLinkMinimized from './PostQuoteLinkMinimized.js'

import useLayoutEffectSkipMount from '../hooks/useLayoutEffectSkipMount.js'

import isRelativeUrl from '../utility/isRelativeUrl.js'

import './PostQuoteLink.css'

export default function PostQuoteLink({
	url,
	postLink,
	onClick,
	disabled,
	block,
	first,
	minimized,
	minimizedComponent,
	expandTimeout,
	isExpanded,
	onDidExpand,
	className,
	children
}) {
	const [expanded, setExpanded] = useState(
		getInitiallyExpanded(postLink, minimized, isExpanded)
	)

	// `onDidExpand()` calls `onRenderedContentDidChange()`
	// that instructs `virtual-scroller` to re-measure the item's height.
	// Therefore, it should happen immedately after a re-render,
	// hence the use of `useLayoutEffect()` instead of `useEffect()`.
	useLayoutEffectSkipMount(() => {
		if (expanded) {
			if (onDidExpand) {
				onDidExpand()
			}
		}
	}, [expanded])

	const onExpand = useCallback(() => {
		setExpanded(true)
	}, [
		postLink,
		setExpanded
	])

	const _onClick = useCallback((event) => {
		onClick(event, postLink)
	}, [
		onClick,
		postLink
	])

	className = classNames(className, 'PostQuoteLink', {
		'PostQuoteLink--disabled': disabled,
		'PostQuoteLink--block': block,
		'PostQuoteLink--minimized': !expanded,
		'PostQuoteLink--first': first,
		// 'PostQuoteLink--inline': !block
	})

	if (!expanded) {
		return (
			<PostQuoteLinkMinimized
				postLink={postLink}
				onExpand={onExpand}
				expandTimeout={expandTimeout}
				minimizedComponent={minimizedComponent}
				className={className}
			/>
		)
	}

	if (disabled) {
		return (
			<span className={className}>
				{children}
			</span>
		)
	}

	// If it's a "relative" URL, then render a `<Link/>`.
	if (isRelativeUrl(url)) {
		return (
			<Link
				to={url}
				onClick={onClick && _onClick}
				className={className}>
				{children}
			</Link>
		)
	}

	return (
		<a
			target={url[0] === '#' ? undefined : '_blank'}
			href={url}
			onClick={onClick && _onClick}
			className={className}>
			{children}
		</a>
	)
}

PostQuoteLink.propTypes = {
	url: PropTypes.string.isRequired,
	onClick: PropTypes.func,
	disabled: PropTypes.bool,
	postLink: postPostLinkShape.isRequired,
	// `block: true` emulates block appearance while staying inline.
	block: PropTypes.bool,
	first: PropTypes.bool,
	minimized: PropTypes.bool,
	minimizedComponent: PropTypes.elementType,
	isExpanded: PropTypes.func,
	onDidExpand: PropTypes.func,
	expandTimeout: PropTypes.number,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}

function getInitiallyExpanded(postLink, minimized, isExpanded) {
	if (!minimized) {
		return true
	}
	if (isExpanded) {
		if (isExpanded(postLink)) {
			return true
		}
	}
	return false
}