import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { post, postBadge, postMessages } from './PropTypes.js'

import PostHeader from './PostHeader.js'
import PostContent from './PostContent.js'
import PostAttachments from './PostAttachments.js'
import PostStretchVertically from './PostStretchVertically.js'
import PostFooter, { hasFooter } from './PostFooter.js'
import { moreActionsType } from './PostMoreActions.js'

import './Post.css'

function Post({
	post,
	showHeader,
	header,
	headerItems,
	headerBadges,
	footerBadges,
	compact,
	url,
	urlBasePath,
	locale,
	initialExpandContent,
	onExpandContentChange,
	initialExpandPostLinkQuotes,
	onRenderedContentDidChange,
	youTubeApiKey,
	contentMaxLength,
	resourceMessages,
	fixAttachmentPictureSizes,
	expandFirstPictureOrVideo,
	expandAttachments,
	showOnlyFirstAttachmentThumbnail,
	maxAttachmentThumbnails,
	attachmentThumbnailSize,
	useSmallestThumbnailsForAttachments,
	showPostThumbnailWhenThereAreMultipleAttachments,
	showPostThumbnailWhenThereIsNoContent,
	serviceIcons,
	onAttachmentClick,
	onPostUrlClick,
	postDateLinkUpdatePageUrlToPostUrlOnClick,
	postDateLinkNavigateToPostUrlOnClick,
	onPostLinkClick,
	isPostLinkClickable,
	isSocialClickable,
	onSocialClick,
	expandGeneratedPostLinkBlockQuotes,
	expandGeneratedPostLinkBlockQuotesWhenNoOtherContent,
	postLinkQuoteMinimizedComponent,
	postLinkQuoteExpandTimeout,
	onPostLinkQuoteExpanded,
	onReply,
	showingReplies,
	onShowReplies,
	toggleShowRepliesButtonRef,
	vote,
	onVote,
	hasVotes,
	getAccountUrl,
	moreActions,
	messages,
	className
}, ref) {
	return (
		<article
			ref={ref}
			className={classNames(className, 'Post', {
				// 'Post--has-title': post.title,
				'Post--anonymous': !post.account,
				// 'Post--no-content': !post.content,
				{/*'Post--has-content': post.content,*/}
				'Post--compact': compact,
				// 'Post--stretch': stretch
			})}>
			<PostHeader
				post={post}
				compact={compact}
				url={url}
				urlBasePath={urlBasePath}
				onPostUrlClick={onPostUrlClick}
				postDateLinkUpdatePageUrlToPostUrlOnClick={postDateLinkUpdatePageUrlToPostUrlOnClick}
				postDateLinkNavigateToPostUrlOnClick={postDateLinkNavigateToPostUrlOnClick}
				locale={locale}
				header={header}
				items={headerItems}
				badges={headerBadges}
				moreActions={moreActions}
				messages={messages}
				onReply={onReply}
				showingReplies={showingReplies}
				onShowReplies={onShowReplies}
				toggleShowRepliesButtonRef={toggleShowRepliesButtonRef}
				vote={vote}
				onVote={onVote}
				hasVotes={hasVotes}
				getAccountUrl={getAccountUrl}
			/>
			<PostContent
				post={post}
				compact={compact}
				initialExpandContent={initialExpandContent}
				onExpandContentChange={onExpandContentChange}
				initialExpandPostLinkQuotes={initialExpandPostLinkQuotes}
				onRenderedContentDidChange={onRenderedContentDidChange}
				youTubeApiKey={youTubeApiKey}
				contentMaxLength={contentMaxLength}
				resourceMessages={resourceMessages}
				fixAttachmentPictureSizes={fixAttachmentPictureSizes}
				expandFirstPictureOrVideo={expandFirstPictureOrVideo}
				expandAttachments={expandAttachments}
				attachmentThumbnailSize={attachmentThumbnailSize}
				useSmallestThumbnailsForAttachments={useSmallestThumbnailsForAttachments}
				serviceIcons={serviceIcons}
				onAttachmentClick={onAttachmentClick}
				onPostLinkClick={onPostLinkClick}
				isPostLinkClickable={isPostLinkClickable}
				isSocialClickable={isSocialClickable}
				onSocialClick={onSocialClick}
				expandGeneratedPostLinkBlockQuotes={expandGeneratedPostLinkBlockQuotes}
				expandGeneratedPostLinkBlockQuotesWhenNoOtherContent={expandGeneratedPostLinkBlockQuotesWhenNoOtherContent}
				postLinkQuoteMinimizedComponent={postLinkQuoteMinimizedComponent}
				postLinkQuoteExpandTimeout={postLinkQuoteExpandTimeout}
				onPostLinkQuoteExpanded={onPostLinkQuoteExpanded}
				url={url}
				locale={locale}
				messages={messages}
				className={className}
			/>
			<PostAttachments
				post={post}
				compact={compact}
				showPostThumbnailWhenThereAreMultipleAttachments={showPostThumbnailWhenThereAreMultipleAttachments}
				showPostThumbnailWhenThereIsNoContent={showPostThumbnailWhenThereIsNoContent}
				expandFirstPictureOrVideo={expandFirstPictureOrVideo}
				useSmallestThumbnails={useSmallestThumbnailsForAttachments}
				maxAttachmentThumbnails={maxAttachmentThumbnails}
				attachmentThumbnailSize={attachmentThumbnailSize}
				expandAttachments={expandAttachments}
				showOnlyFirstAttachmentThumbnail={showOnlyFirstAttachmentThumbnail}
				spoilerLabel={messages && messages.spoiler}
				onAttachmentClick={onAttachmentClick}
			/>
			{/*stretch &&
				<PostStretchVertically/>
			*/}
			<PostFooter
				post={post}
				badges={footerBadges}
				locale={locale}
				messages={messages}
			/>
		</article>
	);
}

Post = React.forwardRef(Post)

Post.propTypes = {
	post: post.isRequired,
	header: PropTypes.func,
	headerItems: PropTypes.arrayOf(PropTypes.node),
	headerBadges: PropTypes.arrayOf(postBadge),
	footerBadges: PropTypes.arrayOf(postBadge),
	compact: PropTypes.bool,
	contentMaxLength: PropTypes.number,
	expandFirstPictureOrVideo: PropTypes.bool,
	expandAttachments: PropTypes.bool,
	showOnlyFirstAttachmentThumbnail: PropTypes.bool,
	useSmallestThumbnailsForAttachments: PropTypes.bool,
	serviceIcons: PropTypes.objectOf(PropTypes.func),
	youTubeApiKey: PropTypes.string,
	maxAttachmentThumbnails: PropTypes.oneOfType([
		PropTypes.oneOf([false]),
		PropTypes.number
	]),
	attachmentThumbnailSize: PropTypes.number,
	onAttachmentClick: PropTypes.func,
	onPostUrlClick: PropTypes.func,
	postDateLinkUpdatePageUrlToPostUrlOnClick: PropTypes.bool,
	postDateLinkNavigateToPostUrlOnClick: PropTypes.bool,
	onPostLinkClick: PropTypes.func,
	isPostLinkClickable: PropTypes.func,
	isSocialClickable: PropTypes.func,
	onSocialClick: PropTypes.func,
	expandGeneratedPostLinkBlockQuotes: PropTypes.bool,
	expandGeneratedPostLinkBlockQuotesWhenNoOtherContent: PropTypes.bool,
	postLinkQuoteMinimizedComponent: PropTypes.elementType,
	postLinkQuoteExpandTimeout: PropTypes.number,
	onPostLinkQuoteExpanded: PropTypes.func,
	onReply: PropTypes.func,
	showingReplies: PropTypes.bool,
	onShowReplies: PropTypes.func,
	toggleShowRepliesButtonRef: PropTypes.any,
	vote: PropTypes.bool,
	onVote: PropTypes.func,
	hasVotes: PropTypes.bool,
	getAccountUrl: PropTypes.func,
	url: PropTypes.string,
	urlBasePath: PropTypes.string,
	locale: PropTypes.string,
	moreActions: moreActionsType,
	initialExpandContent: PropTypes.bool,
	onExpandContentChange: PropTypes.func,
	initialExpandPostLinkQuotes: PropType.objectOf(PropTypes.bool),
	onRenderedContentDidChange: PropTypes.func,
	// `lynxchan` doesn't provide `width` and `height`
	// neither for the picture not for the thumbnail
	// in `/catalog.json` API response (which is a bug).
	// http://lynxhub.com/lynxchan/res/722.html#q984
	fixAttachmentPictureSizes: PropTypes.bool,
	showPostThumbnailWhenThereAreMultipleAttachments: PropTypes.bool,
	showPostThumbnailWhenThereIsNoContent: PropTypes.bool,
	messages: postMessages,
	resourceMessages: PropTypes.shape({
		videoNotFound: PropTypes.string
	}),
	className: PropTypes.string
}

export default Post