import React from 'react'
import PropTypes from 'prop-types'
import ReactTimeAgo from 'react-time-ago'
// `/copy-text` was just for copying
// import ReactTimeAgo from 'react-time-ago/copy-text'
// import ReactTimeAgo from 'react-time-ago/tooltip'
import { Link } from 'react-pages'
import classNames from 'classnames'

import PostSelfLink from './PostSelfLink.js'
import Padding from './Padding.js'

import './PostDate.css'

export default function PostDate({
	date,
	url,
	urlBasePath,
	postDateLinkUpdatePageUrlToPostUrlOnClick,
	postDateLinkNavigateToPostUrlOnClick,
	onClick,
	locale,
	className
}) {
	// tooltipClassName="PostDate-tooltip"
	const dateElement = (
		<ReactTimeAgo
			date={date}
			locale={locale}
			className="PostDate-date"/>
	)
	if (url) {
		return (
			<Padding>
				<PostSelfLink
					url={url}
					baseUrl={urlBasePath}
					updatePageUrlToPostUrlOnClick={postDateLinkUpdatePageUrlToPostUrlOnClick}
					navigateToPostUrlOnClick={postDateLinkNavigateToPostUrlOnClick}
					onClick={onClick}
					className={className}>
					{dateElement}
				</PostSelfLink>
			</Padding>
		)
	}
	return (
		<span className={classNames('PostDate', className)}>
			{dateElement}
		</span>
	)
}

PostDate.propTypes = {
	date: PropTypes.instanceOf(Date).isRequired,
	url: PropTypes.string,
	urlBasePath: PropTypes.string,
	postDateLinkUpdatePageUrlToPostUrlOnClick: PropTypes.bool,
	postDateLinkNavigateToPostUrlOnClick: PropTypes.bool,
	locale: PropTypes.string,
	onClick: PropTypes.func,
	className: PropTypes.string
}