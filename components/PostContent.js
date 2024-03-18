import React, { useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { post, postMessages } from './PropTypes.js'

import PostContentBlock from './PostContentBlock.js'

import useIsMounted from '../hooks/useIsMounted.js'
import useLayoutEffectSkipMount from '../hooks/useLayoutEffectSkipMount.js'

import loadResourceLinks from 'social-components/utility/post/loadResourceLinks.js'
import getContentBlocks from 'social-components/utility/post/getContentBlocks.js'

import { fixAttachmentPictureSizes } from '../utility/fixPictureSize.js'

import './PostContent.css'

function PostContent({
	post,
	compact,
	initialExpandContent,
	onExpandContentChange,
	initialExpandPostLinkQuotes,
	onRenderedContentDidChange,
	onPostContentChange,
	onPostContentRendered,
	youTubeApiKey,
	contentMaxLength,
	resourceMessages,
	fixAttachmentPictureSizes: shouldFixAttachmentPictureSizes,
	expandFirstPictureOrVideo,
	expandAttachments,
	attachmentThumbnailSize,
	useSmallestThumbnailsForAttachments,
	serviceIcons,
	onAttachmentClick,
	onPostLinkClick,
	isPostLinkClickable,
	isSocialClickable,
	onSocialClick,
	expandGeneratedPostLinkBlockQuotes,
	expandGeneratedPostLinkBlockQuotesWhenNoOtherContent,
	postLinkQuoteMinimizedComponent,
	postLinkQuoteExpandTimeout,
	onPostLinkQuoteExpanded,
	resourceCache,
	url,
	locale,
	messages,
	wrapperComponent: WrapperComponent,
	wrapperComponentProps,
	className
}, ref) {
	if (onPostContentRendered) {
		throw new Error('`onPostContentRendered` property was removed')
	}

	const [showPreview, setShowPreview] = useState(initialExpandContent ? false : true)
	// Re-renders the post element when its content changes by `loadResourceLinks()`.
	const [postContentChanged, setPostContentChanged] = useState()

	const isMounted = useIsMounted()
	const cancelLoadingResourceLinks = useRef()

	const onExpandContent = useCallback(() => {
		setShowPreview(false)
	}, [
		setShowPreview
	])

	useLayoutEffectSkipMount(() => {
		if (onExpandContentChange) {
			onExpandContentChange(!showPreview)
		}
		// The post height did change due to "expanding" its content,
		// so the post height should be re-measured.
		// `onRenderedContentDidChange()` is gonna call `virtual-scroller`'s
		// `onItemHeightChange()`.
		if (onRenderedContentDidChange) {
			onRenderedContentDidChange()
		}
	}, [showPreview])

	const isPostLinkQuoteExpanded = useCallback((_id) => {
		return initialExpandPostLinkQuotes && initialExpandPostLinkQuotes[_id]
	}, [initialExpandPostLinkQuotes])

	const onPostLinkQuoteExpanded_ = useCallback((...args) => {
		if (onPostLinkQuoteExpanded) {
			onPostLinkQuoteExpanded.apply(this, args)
		}
		// The post height did change due to "expanding" its content,
		// so the post height should be re-measured.
		// `onRenderedContentDidChange()` is gonna call `virtual-scroller`'s
		// `onItemHeightChange()`.
		if (onRenderedContentDidChange) {
			onRenderedContentDidChange()
		}
	}, [
		onPostLinkQuoteExpanded,
		onRenderedContentDidChange
	])

	// const resourceLinkLoaderHasChangedPostContent = useRef()

	const attachments = post.attachments
	const content = showPreview && post.contentPreview || post.content

	const shouldExpandGeneratedPostLinkBlockQuotes = useShouldExpandGeneratedPostLinkBlockQuotes({
		expandGeneratedPostLinkBlockQuotes,
		expandGeneratedPostLinkBlockQuotesWhenNoOtherContent,
		content,
		attachments
	})

	const loadAllResourceLinks = useCallback(() => {
		// Returns an object having a `.cancel()` function.
		const { cancel } = loadResourceLinks(post, {
			youTubeApiKey,
			cache: resourceCache,
			messages: resourceMessages,
			contentMaxLength,
			minimizeGeneratedPostLinkBlockQuotes: !shouldExpandGeneratedPostLinkBlockQuotes,
			// Fix attachment picture sizes.
			//
			// `lynxchan` doesn't provide `width` and `height`
			// neither for the picture not for the thumbnail
			// in `/catalog.json` API response (which is a bug).
			// http://lynxhub.com/lynxchan/res/722.html#q984
			// This is a workaround for that: it fetches the images
			// and finds out their correct sizes.
			//
			// `fixAttachmentPictureSizes` gets the correct image sizes
			// but for some reason React doesn't apply the `style` changes to the DOM.
			// It's most likely a bug in React.
			// https://github.com/facebook/react/issues/16357
			// `<PostAttachment/>` does pass the correct `style` to `<ButtonLink/>`
			// but the `style` doesn't get applied in the DOM.
			//
			// Returns a list of `Promise`s.
			//
			additionalResourceLoadingPromises: shouldFixAttachmentPictureSizes && post.attachments
				// `post` object reference doesn't change between re-renders
				// so it's fine passing it to this callback.
				// `fixAttachmentPictureSizes()` function is not created via `useCallback()`
				// between re-renders so it's fine passing it to this callback.
				? fixAttachmentPictureSizes(post.attachments)
				: undefined,
			onContentChange: () => {
				// resourceLinkLoaderHasChangedPostContent.current = post
				//
				// `onPostContentChange()` function reference shouldn't change
				// between re-renders. In that case, it's fine passing it to this callback.
				if (onPostContentChange) {
					onPostContentChange(post)
				}
				// `isMounted()` function reference doesn't change
				// between re-renders so it's fine passing it to this callback.
				if (isMounted()) {
					// `setPostContentChanged()` function reference doesn't change
					// between re-renders so it's fine passing it to this callback.
					setPostContentChanged({})
				}
			}
		})
		return cancel
	}, [post])

	useLayoutEffectSkipMount(() => {
		// The post height has changed due to expanding or collapsing attachments.
		// `onRenderedContentDidChange()` is gonna call `virtual-scroller`'s
		// `onItemHeightChange()`.
		// Could add something like `if (hasEmbeddedAttachments(post.content))` here,
		// but this seems like a non-necessary optimization.
		if (onRenderedContentDidChange) {
			onRenderedContentDidChange()
		}
	}, [expandAttachments])

	// Load resource links on initial mount.
	useLayoutEffect(() => {
		cancelLoadingResourceLinks.current = loadAllResourceLinks()
		return () => {
			if (cancelLoadingResourceLinks.current) {
				cancelLoadingResourceLinks.current()
				cancelLoadingResourceLinks.current = undefined
			}
		}
	}, [])

	useLayoutEffectSkipMount(() => {
		// console.log('~ New `post` property passed to `<PostContent/>` ~')
		if (cancelLoadingResourceLinks.current) {
			cancelLoadingResourceLinks.current()
			cancelLoadingResourceLinks.current = undefined
			// I dunno what `onPostContentRendered()` function did.
			// It doesn't seem to be used anymore.
			// if (resourceLinkLoaderHasChangedPostContent.current) {
			// 	const post = resourceLinkLoaderHasChangedPostContent.current
			// 	resourceLinkLoaderHasChangedPostContent.current = undefined
			// 	// if (onPostContentRendered) {
			// 	// 	onPostContentRendered(post, { cancel: true })
			// 	// }
			// }
		}
		// The post height did change due to a new `post` property
		// being passed, so the post height should be re-measured.
		// `onRenderedContentDidChange()` is gonna be `virtual-scroller`'s
		// `onItemHeightChange()`.
		if (onRenderedContentDidChange) {
			onRenderedContentDidChange()
		}
		// Load resource links every time `post` content property changes.
		cancelLoadingResourceLinks.current = loadAllResourceLinks()
	}, [post])

	useLayoutEffectSkipMount(() => {
		// The post content did change because some resource links
		// have been loaded, so the post height should be re-measured.
		// `onRenderedContentDidChange()` is gonna be `virtual-scroller`'s
		// `onItemHeightChange()`.
		if (onRenderedContentDidChange) {
			onRenderedContentDidChange()
		}
		// if (onPostContentRendered) {
		// 	onPostContentRendered(post)
		// }
	}, [postContentChanged])

	const startsWithText = content && (
		typeof content === 'string'
		|| typeof content[0] === 'string'
		|| Array.isArray(content[0])
	)

	const startsWithQuote = Array.isArray(content) && (
		content[0].type === 'quote'
		|| (
			Array.isArray(content[0])
			&& (content[0][0].type === 'post-link' || content[0][0].type === 'quote')
		)
	)

	if (!content) {
		return null
	}

	const postContent = (
		<div className={classNames(className, 'PostContent', {
			'PostContent--compact': compact,
			// 'PostContent--has-title': post.title,
			// 'PostContent--starts-with-quote': startsWithQuote,
			// 'PostContent--starts-with-text': startsWithText
		})}>
			{getContentBlocks(content).map((contentBlock, i) => (
				<PostContentBlock
					key={i}
					compact={compact}
					url={url}
					first={i === 0}
					markFirstQuote={startsWithQuote}
					onReadMore={onExpandContent}
					readMoreLabel={messages && messages.readMore || '...'}
					attachments={attachments}
					attachmentThumbnailSize={attachmentThumbnailSize}
					expandAttachments={expandAttachments}
					spoilerLabel={messages && messages.spoiler}
					onAttachmentClick={onAttachmentClick}
					onPostLinkClick={onPostLinkClick}
					isPostLinkClickable={isPostLinkClickable}
					expandGeneratedPostLinkBlockQuotes={shouldExpandGeneratedPostLinkBlockQuotes}
					postLinkQuoteMinimizedComponent={postLinkQuoteMinimizedComponent}
					postLinkQuoteExpandTimeout={postLinkQuoteMinimizedComponent}
					isPostLinkQuoteExpanded={isPostLinkQuoteExpanded}
					onPostLinkQuoteExpanded={onPostLinkQuoteExpanded_}
					isSocialClickable={isSocialClickable}
					onSocialClick={onSocialClick}
					useSmallestThumbnailsForAttachments={useSmallestThumbnailsForAttachments}
					serviceIcons={serviceIcons}
					locale={locale}>
					{contentBlock}
				</PostContentBlock>
			))}
		</div>
	)

	if (WrapperComponent) {
		return (
			<WrapperComponent
				{...wrapperComponentProps}
				className={classNames('PostContent-wrapper', wrapperComponentProps.className)}>
				{postContent}
			</WrapperComponent>
		)
	}

	return postContent
}

PostContent.propTypes = {
	post: post.isRequired,
	contentMaxLength: PropTypes.number,
	expandFirstPictureOrVideo: PropTypes.bool,
	expandAttachments: PropTypes.bool,
	showOnlyFirstAttachmentThumbnail: PropTypes.bool,
	useSmallestThumbnailsForAttachments: PropTypes.bool,
	serviceIcons: PropTypes.objectOf(PropTypes.func),
	youTubeApiKey: PropTypes.string,
	attachmentThumbnailSize: PropTypes.number,
	onAttachmentClick: PropTypes.func,
	onPostLinkClick: PropTypes.func,
	isPostLinkClickable: PropTypes.func,
	isSocialClickable: PropTypes.func,
	onSocialClick: PropTypes.func,
	expandGeneratedPostLinkBlockQuotes: PropTypes.bool,
	expandGeneratedPostLinkBlockQuotesWhenNoOtherContent: PropTypes.bool,
	postLinkQuoteMinimizedComponent: PropTypes.elementType,
	postLinkQuoteExpandTimeout: PropTypes.number,
	onPostLinkQuoteExpanded: PropTypes.func,
	url: PropTypes.string,
	locale: PropTypes.string,
	initialExpandContent: PropTypes.bool,
	onExpandContentChange: PropTypes.func,
	initialExpandPostLinkQuotes: PropTypes.objectOf(PropTypes.bool),
	onRenderedContentDidChange: PropTypes.func,
	onPostContentChange: PropTypes.func,
	onPostContentRendered: PropTypes.func,
	resourceCache: PropTypes.shape({
		get: PropTypes.func.isRequired,
		put: PropTypes.func.isRequired
	}),
	// `lynxchan` doesn't provide `width` and `height`
	// neither for the picture not for the thumbnail
	// in `/catalog.json` API response (which is a bug).
	// http://lynxhub.com/lynxchan/res/722.html#q984
	fixAttachmentPictureSizes: PropTypes.bool,
	messages: postMessages,
	resourceMessages: PropTypes.shape({
		videoNotFound: PropTypes.string
	}),
	wrapperComponent: PropTypes.elementType,
	wrapperComponentProps: PropTypes.object,
	className: PropTypes.string
}

PostContent.defaultProps = {
	expandGeneratedPostLinkBlockQuotesWhenNoOtherContent: true
}

export default PostContent

export function Content({
	compact,
	className,
	children: content,
	...rest
}) {
	return (
		<div
			{...rest}
			className={classNames(className, 'PostContent', {
				'PostContent--compact': compact
			})}>
			{getContentBlocks(content).map((contentBlock, i) => (
				<PostContentBlock key={i} compact={compact}>
					{contentBlock}
				</PostContentBlock>
			))}
		</div>
	)
}

Content.propTypes = {
	compact: PropTypes.bool,
	className: PropTypes.string,
	children: PropTypes.any.isRequired
}

function useShouldExpandGeneratedPostLinkBlockQuotes({
	expandGeneratedPostLinkBlockQuotes,
	expandGeneratedPostLinkBlockQuotesWhenNoOtherContent,
	content,
	attachments
}) {
	return useMemo(() => {
		if (!content) {
			// Has no content at all.
			// No "post-link"s to expand.
			return false
		}
		if (expandGeneratedPostLinkBlockQuotes) {
			return true
		}
		// Expand post link block quotes for posts with no "other" content.
		// "Other" content means non-"post-link" content.
		if (expandGeneratedPostLinkBlockQuotesWhenNoOtherContent) {
			if (attachments) {
				// Has "other" content.
				return false
			}
			for (const block of getContentBlocks(content)) {
				if (Array.isArray(block)) {
					for (const part of block) {
						if (part.type !== 'post-link') {
							// Has "other" content.
							return false
						}
					}
				} else {
					// Has "other" content.
					return false
				}
			}
			// Has no "other" content.
			// Only has "post-link"s in the `content`.
			// Therefore, expand those "post-link"s
			return true
		}
		// Don't expand post link block quotes.
		return false
	}, [
		expandGeneratedPostLinkBlockQuotes,
		expandGeneratedPostLinkBlockQuotesWhenNoOtherContent,
		content,
		attachments
	])
}