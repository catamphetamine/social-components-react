import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import PostQuoteBorderLeft from './PostQuoteBorderLeft.js'
import PostAttachments from './PostAttachments.js'

import { social } from './PropTypes.js'

import Instagram from '../icons/services/instagram.svg'
import Twitter from '../icons/services/twitter.svg'

import './PostSocial.css'
import './PostQuoteBlock.css'

export default function PostSocial({
	social,
	locale,
	attachmentThumbnailSize,
	expandAttachments,
	onAttachmentClick,
	isClickable,
	onClick,
	className
}) {
	const ProviderLogo = getProviderLogoComponent(social.provider)
	const authorId = (
		<span className="PostSocial-authorIdElement">
			{social.author.id}
		</span>
	)
	const isSocialClickable = isClickable && isClickable(social)
	const onSocialClick = useCallback((event) => {
		onClick(social)
		event.preventDefault()
	}, [
		onClick,
		social
	])
	return (
		<article
			onClick={onClick && onSocialClick}
			className={classNames(className, 'PostSocial', {
				'PostSocial--clickable': isSocialClickable
			})}>
			<PostQuoteBorderLeft/>
			<header className="PostSocial-header">
				{social.author && social.author.picture &&
					<Link
						to={social.author.url}
						clickable={!isSocialClickable}>
						<img
							title={social.author.name || social.author.id}
							src={social.author.picture.url}
							className="PostSocial-authorPicture"/>
					</Link>
				}
				<div className="PostSocial-authorNameAndId">
					<div className="PostSocial-authorName">
						<Link
							to={social.author ? social.author.url : getProviderUrl(social.provider)}
							clickable={!isSocialClickable}
							textColor={false}
							className="PostSocial-authorNameInner">
							{!social.author.picture && ProviderLogo &&
								<ProviderLogo
									title={social.provider}
									className="PostSocial-providerLogo"/>
							}
							{social.author ? (social.author.name || authorId) : social.provider}
						</Link>
					</div>
					{(social.author || social.date) &&
						<div className="PostSocial-authorId">
							{social.author &&
								<Link
									to={social.author.url}
									clickable={!isSocialClickable}>
									{social.author.name ? authorId : social.provider}
								</Link>
							}
							{social.author && social.date && ', '}
							{social.date &&
								<Link
									to={social.url}
									clickable={!isSocialClickable}>
									<SocialDate
										date={social.date}
										locale={locale}/>
								</Link>
							}
						</div>
					}
				</div>
			</header>
			{social.content &&
				<blockquote
					cite={social.url || social.author.url || social.author.name || social.author.id}
					className="PostSocial-content">
					{/* `<Link/>` is placed inside `<blockquote/>` and `<p/>`
					    because `<a/>` can't contain block-level DOM elements.
					    `<blockquote/>` can be replaced with inline-level `<q/>`
					    (and `<p/>` can be removed while setting `line-height` on `<q/>`)
					    if required to be clickable as a whole. */}
					<p>
						<Link
							to={social.url}
							clickable={!isSocialClickable}>
							{social.content}
						</Link>
					</p>
				</blockquote>
			}
			{social.attachments &&
				<PostAttachments
					expandAttachments={expandAttachments}
					attachmentThumbnailSize={attachmentThumbnailSize}
					onAttachmentClick={onAttachmentClick}>
					{social.attachments}
				</PostAttachments>
			}
		</article>
	)
}

PostSocial.propTypes = {
	social: social.isRequired,
	locale: PropTypes.string,
	expandAttachments: PropTypes.bool,
	attachmentThumbnailSize: PropTypes.number,
	onAttachmentClick: PropTypes.func,
	isClickable: PropTypes.func,
	onClick: PropTypes.func,
	className: PropTypes.string
}

function getProviderLogoComponent(provider) {
	switch (provider) {
		case 'Instagram':
			return Instagram
		case 'Twitter':
			return Twitter
	}
}

function getProviderUrl(provider) {
	switch (provider) {
		case 'Instagram':
			return 'https://instagram.com'
		case 'Twitter':
			return 'https://twitter.com'
	}
}

function Link({
	inline = true,
	textColor = true,
	to,
	clickable,
	className,
	children
}) {
	if (to && clickable) {
		return (
			<a
				target="_blank"
				href={to}
				className={classNames(className, {
					// 'PostSocial-content-link',
					'PostSocial-content-link--text-color': textColor,
					'PostSocial-content-link--block': !inline
				})}>
				{children}
			</a>
		)
	}
	if (className) {
		return (
			<span className={className}>
				{children}
			</span>
		)
	}
	return children
}

Link.propTypes = {
	to: PropTypes.string,
	clickable: PropTypes.bool,
	inline: PropTypes.bool,
	textColor: PropTypes.bool,
	className: PropTypes.string,
	children: PropTypes.node.isRequired
}

function SocialDate({ date, locale }) {
	return (
		<time
			dateTime={date.toISOString()}
			className="PostSocial-date">
			{date.toLocaleString(locale, {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			})}
		</time>
	)
}

SocialDate.propTypes = {
	date: PropTypes.instanceOf(Date).isRequired,
	locale: PropTypes. string
}