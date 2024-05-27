import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import { post, postBadge } from './PropTypes.js'

import PressedStateButton from './PressedStateButton.js'

export default function PostBadge({
	post,
	parameters,
	badge: {
		ref = undefined,
		name = undefined,
		icon = undefined,
		getIcon = undefined,
		getIconProps = undefined,
		title = undefined,
		condition = undefined,
		onClick = undefined,
		isPressed = false,
		content: Content = undefined
	},
	className,
	iconClassName
}) {
	const Icon = getIcon ? getIcon({ ...parameters, post }) : icon
	const iconProps = getIconProps && getIconProps({ ...parameters, post })

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
			title={title && title({ ...parameters, post })}
			className={className}>
			{Icon &&
				<Icon
					{...iconProps}
					className={iconClassName}/>
			}
			{Content &&
				<Content
					{...parameters}
					post={post}
				/>
			}
		</Component>
	)
}

PostBadge.propTypes = {
	post: post.isRequired,
	parameters: PropTypes.object,
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