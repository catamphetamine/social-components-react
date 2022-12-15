import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Link } from 'react-pages'

import PostDate from './PostDate.js'
import PostMoreActions, { moreActionsType } from './PostMoreActions.js'
import PostTitle from './PostTitle.js'
import PostBadge from './PostBadge.js'
import PostVotes from './PostVotes.js'
import Padding from './Padding.js'
import Picture from './Picture.js'

import PressedStateButton from './PressedStateButton.js'

import { post, postBadge } from './PropTypes.js'

import MessageIcon from '../icons/message-rounded-rect-square.svg'

import './PostHeader.css'

export default function PostHeader({
	post,
	compact,
	url,
	urlBasePath,
	onPostUrlClick,
	postDateLinkUpdatePageUrlToPostUrlOnClick,
	postDateLinkNavigateToPostUrlOnClick,
	locale,
	header: Header,
	items,
	badges,
	messages,
	moreActions,
	onReply,
	showingReplies,
	onShowReplies,
	toggleShowRepliesButtonRef,
	vote,
	onVote,
	hasVotes,
	getAccountUrl
}) {
	return (
		<header className="PostHeader">
			<div className="PostHeader-top">
				<PostHeaderLeft
					post={post}
					url={url}
					urlBasePath={urlBasePath}
					onPostUrlClick={onPostUrlClick}
					postDateLinkNavigation={postDateLinkNavigation}
					postDateLinkUpdatePageUrlToPostUrlOnClick={postDateLinkUpdatePageUrlToPostUrlOnClick}
					postDateLinkNavigateToPostUrlOnClick={postDateLinkNavigateToPostUrlOnClick}
					locale={locale}
					messages={messages}
					items={items}
					onShowReplies={onShowReplies}
					showingReplies={showingReplies}
					onReply={onReply}
					toggleShowRepliesButtonRef={toggleShowRepliesButtonRef}
					getAccountUrl={getAccountUrl}
				/>
				<PostHeaderRight
					post={post}
					locale={locale}
					messages={messages}
					badges={badges}
					vote={vote}
					onVote={onVote}
					hasVotes={hasVotes}
					moreActions={moreActions}
				/>
			</div>
			{Header &&
				<Header post={post} locale={locale}/>
			}
			<PostTitle post={post} compact={compact}/>
		</header>
	)
}

PostHeader.propTypes = {
	post: post.isRequired,
	compact: PropTypes.bool,
	items: PropTypes.arrayOf(PropTypes.node),
	badges: PropTypes.arrayOf(postBadge),
	url: PropTypes.string,
	urlBasePath: PropTypes.string,
	onPostUrlClick: PropTypes.func,
	postDateLinkUpdatePageUrlToPostUrlOnClick: PropTypes.bool,
	postDateLinkNavigateToPostUrlOnClick: PropTypes.bool,
	locale: PropTypes.string,
	header: PropTypes.func,
	moreActions: moreActionsType,
	messages: PropTypes.object,
	onReply: PropTypes.func,
	showingReplies: PropTypes.bool,
	onShowReplies: PropTypes.func,
	toggleShowRepliesButtonRef: PropTypes.any,
	vote: PropTypes.bool,
	onVote: PropTypes.func,
	hasVotes: PropTypes.bool,
	getAccountUrl: PropTypes.func
}

function PostHeaderLeft({
	post,
	url,
	urlBasePath,
	onPostUrlClick,
	postDateLinkUpdatePageUrlToPostUrlOnClick,
	postDateLinkNavigateToPostUrlOnClick,
	locale,
	messages,
	items,
	onReply,
	onShowReplies,
	toggleShowRepliesButtonRef,
	showingReplies,
	getAccountUrl
}) {
	const onPostUrlClick_ = useCallback((event) => {
		if (onPostUrlClick) {
			onPostUrlClick(event, post)
		}
	}, [onPostUrlClick, post])

	return (
		<div className="PostHeader-left">
			{/*moreActions &&
				<PostMoreActions
					title={messages && messages.moreActions && messages.moreActions.title}>
					{moreActions}
				</PostMoreActions>
			*/}
			{post.author &&
				<div className="PostAuthor">
					<Link to={getAccountUrl(post.author)}>
						<Picture
							picture={post.author}
							className="PostAuthor-picture"/>
					</Link>
					<div className="PostAuthor-nameAndDate">
						<Link
							to={getAccountUrl(post.author)}
							rel="author"
							className="PostAuthor-name">
							{post.author.name}
						</Link>
						{post.createdAt &&
							<PostDate
								date={post.createdAt}
								url={url}
								urlBasePath={urlBasePath}
								onClick={onPostUrlClick_}
								locale={locale}/>
						}
					</div>
				</div>
			}
			{items && items.map((item, i) => (
				<React.Fragment key={`headerItem:${i}`}>
					<div className="PostHeader-item">
						{item}
					</div>
					<div className="PostHeader-itemSeparator">
						·
					</div>
				</React.Fragment>
			))}
			{(!post.author && post.createdAt) &&
				<div className="PostHeader-item">
					<PostDate
						date={post.createdAt}
						url={url}
						urlBasePath={urlBasePath}
						postDateLinkUpdatePageUrlToPostUrlOnClick={postDateLinkUpdatePageUrlToPostUrlOnClick}
						postDateLinkNavigateToPostUrlOnClick={postDateLinkNavigateToPostUrlOnClick}
						onClick={onPostUrlClick_}
						locale={locale}
					/>
				</div>
			}
			{onReply && (!post.author && post.createdAt)  &&
				<div className="PostHeader-itemSeparator">
					·
				</div>
			}
			{onReply &&
				<div className="PostHeader-item">
					<Padding>
						<PressedStateButton onClick={onReply}>
							{/*<ReplyIcon className="PostHeader-itemIcon PostHeader-itemIcon--reply"/>*/}
							{messages && messages.reply}
						</PressedStateButton>
					</Padding>
				</div>
			}
			{onShowReplies && onReply &&
				<div className="PostHeader-itemSeparator">
					·
				</div>
			}
			{onShowReplies &&
				<div className="PostHeader-item">
					<Padding>
						<PressedStateButton
							ref={toggleShowRepliesButtonRef}
							onClick={onShowReplies}
							title={messages && messages.repliesCount}
							pressed={showingReplies}>
							<MessageIcon className="PostHeader-itemIcon PostHeader-itemIcon--replies"/>
							{post.replies.length}
						</PressedStateButton>
					</Padding>
				</div>
			}
		</div>
	)
}

PostHeaderLeft.propTypes = {
	post: post.isRequired,
	url: PropTypes.string,
	urlBasePath: PropTypes.string,
	onPostUrlClick: PropTypes.func,
	postDateLinkUpdatePageUrlToPostUrlOnClick: PropTypes.bool,
	postDateLinkNavigateToPostUrlOnClick: PropTypes.bool,
	locale: PropTypes.string,
	messages: PropTypes.object,
	items: PropTypes.arrayOf(PropTypes.node),
	onReply: PropTypes.func,
	onShowReplies: PropTypes.func,
	toggleShowRepliesButtonRef: PropTypes.any,
	showingReplies: PropTypes.bool,
	getAccountUrl: PropTypes.func
}

function PostHeaderRight({
	post,
	locale,
	messages,
	badges,
	vote,
	onVote,
	hasVotes,
	moreActions
}) {
	if (badges) {
		badges = badges.filter(({ condition }) => condition(post))
	}
	const hasBadges = badges && badges.length > 0
	return (
		<div className="PostHeader-right">
			{(hasBadges || hasVotes) &&
				<div className="PostHeader-rightExceptMoreActionsMenuButton">
					{hasBadges &&
						<div className="PostHeader-badges">
							{badges.map((badge) => {
								return (
									<PostBadge
										key={badge.name}
										post={post}
										locale={locale}
										messages={messages}
										badge={badge}
										className="PostHeader-badgeContainer"
										iconClassName={`PostHeader-badge PostHeader-badge--${badge.name}`}/>
								)
							})}
						</div>
					}
					{hasVotes &&
						<PostVotes
							post={post}
							vote={vote}
							onVote={onVote}
							messages={messages}/>
					}
				</div>
			}
			{moreActions &&
				<PostMoreActions
					alignment="right"
					title={messages && messages.moreActions && messages.moreActions.title}>
					{moreActions}
				</PostMoreActions>
			}
		</div>
	)
}

PostHeaderRight.propTypes = {
	post: post.isRequired,
	locale: PropTypes.string,
	messages: PropTypes.object,
	badges: PropTypes.arrayOf(postBadge),
	hasVotes: PropTypes.bool,
	onVote: PropTypes.func,
	vote: PropTypes.bool,
	moreActions: moreActionsType
}