import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import PostBadge from './PostBadge.js'

import { post, postBadge } from './PropTypes.js'

import './PostFooter.css'

export default function PostFooter({
	post,
	badges,
	locale,
	messages
}) {
	if (badges) {
		badges = badges.filter(_ => _.condition(post))
	}
	const hasBadges = badges && badges.length > 0
	if (!hasBadges) {
		return null
	}
	return (
		<footer className="PostFooter">
			{hasBadges &&
				<div className="PostFooter-badges">
					{badges.map((badge) => (
						<PostBadge
							key={badge.name}
							post={post}
							locale={locale}
							messages={messages}
							badge={badge}
							className="PostFooter-badge"
							iconClassName={`PostFooter-badgeIcon PostFooter-badgeIcon--${badge.name}`}/>
					))}
				</div>
			}
		</footer>
	)
}

PostFooter.propTypes = {
	post: post.isRequired,
	badges: PropTypes.arrayOf(postBadge),
	locale: PropTypes.string,
	messages: PropTypes.object
}