import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { post, postBadge } from './PropTypes.js'

import PressedStateButton from './PressedStateButton.js'

export default function PostBadge({
	post,
	locale,
	messages,
	badge: {
		ref,
		name,
		icon,
		getIcon,
		getIconProps,
		title,
		condition,
		onClick,
		isPressed,
		content: Content
	},
	className,
	iconClassName
}) {
	const Icon = getIcon ? getIcon({ post, locale }) : icon
	const iconProps = getIconProps && getIconProps({ post, locale })
	const _onClick = useCallback(() => {
		if (onClick) {
			onClick(post)
		}
	}, [
		onClick,
		post
	])
	// `title` doesn't work on SVGs for some reason
	// (perhaps because SVGs don't have background)
	// so I moved `title` to a `<div/>`.
	let Component = 'div'
	let extraProps
	if (onClick) {
		Component = Button
		extraProps = {
			ref,
			isPressed,
			onClick: _onClick
		}
	}
	return (
		<Component
			{...extraProps}
			title={title && title({ post, locale, messages })}
			className={className}>
			{Icon &&
				<Icon
					{...iconProps}
					className={iconClassName}/>
			}
			{Content &&
				<Content
					post={post}
					locale={locale}
					messages={messages}/>
			}
		</Component>
	)
}

PostBadge.propTypes = {
	post: post.isRequired,
	locale: PropTypes.string,
	messages: PropTypes.object,
	badge: postBadge.isRequired,
	className: PropTypes.string,
	iconClassName: PropTypes.string
}

function Button({
	isPressed,
	children,
	...rest
}, ref) {
	return (
		<PressedStateButton
			{...rest}
			pressed={isPressed}
			ref={ref}>
			{children}
		</PressedStateButton>
	)
}

Button = React.forwardRef(Button)

Button.propTypes = {
	isPressed: PropTypes.bool,
	children: PropTypes.node.isRequired
}