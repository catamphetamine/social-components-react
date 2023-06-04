import React, { useState, useRef, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { FadeInOut, ActivityIndicator } from 'react-responsive-ui'

import ButtonLink from './ButtonLink.js'
import { preloadPictureSlide } from './Slideshow.Picture.js'
import SlideshowSize from './Slideshow.Size.js'
import Picture from './Picture.js'
import PictureBadge from './PictureBadge.js'
import PostAttachmentThumbnailSpoilerBar from './PostAttachmentThumbnailSpoilerBar.js'

import { getOriginalPictureSizeAndUrl } from '../utility/fixPictureSize.js'

import { getUrl as getVideoUrl } from './Video.js'
import VideoDuration from './VideoDuration.js'

import useIsMounted from '../hooks/useIsMounted.js'

import {
	pictureAttachment,
	videoAttachment
} from './PropTypes.js'

import './PostAttachmentThumbnail.css'

export default function PostAttachmentThumbnail({
	linkToUrl,
	onClick,
	attachment,
	spoilerLabel,
	expand,
	border,
	maxSize,
	maxWidth,
	maxHeight,
	expandToTheFullest,
	width,
	height,
	fit,
	useSmallestThumbnail,
	moreAttachmentsCount,
	fixAttachmentPictureSize,
	className
}) {
	const thumbnailElement = useRef()
	const slideshowOpenRequest = useRef()
	const [isRevealed, setIsRevealed] = useState(attachment.spoiler ? false : true)
	const isMounted = useIsMounted()
	const [loadOnClick, isLoading, setIsLoading] = useLoadOnClick(attachment, fixAttachmentPictureSize, thumbnailElement, isMounted)

	const picture = getPicture(attachment)
	const isLandscape = picture.width >= picture.height

	// This `onClick(event)` function is not `async`
	// because an `async` function results in a React warning
	// telling that a "synthetic event" has been reused.
	const onPictureClick = useCallback((event) => {
		if (window.Slideshow) {
			slideshowOpenRequest.current = window.Slideshow.willOpen(() => {
				if (isMounted()) {
					setIsLoading(false)
				}
			})
		}
		const finish = () => {
			if (slideshowOpenRequest.current) {
				if (slideshowOpenRequest.current.cancelled) {
					return
				}
			}
			if (attachment.spoiler) {
				setIsRevealed(true)
			}
			if (onClick) {
				onClick(event)
			}
		}
		const promise = loadOnClick(event)
		if (promise) {
			promise.then(finish)
		} else {
			finish()
		}
	}, [
		attachment,
		loadOnClick,
		setIsRevealed,
		onClick
	])

	// `<ButtonLink/>` component requires an `onClick` property.
	const onPictureClickIgnore = useCallback(() => {
		// Ignore.
	}, [])

	useEffect(() => {
		return () => {
			if (slideshowOpenRequest.current) {
				slideshowOpenRequest.current.cancel()
			}
		}
	}, [])

	// Either `maxSize` should be set,
	// or `maxWidth`/`maxHeight`,
	// or `width`/`height`.
	if (
		(maxWidth === undefined && maxHeight === undefined) &&
		(width === undefined && height === undefined)
	) {
		maxSize = ATTACHMENT_THUMBNAIL_SIZE
	}

	// Could also set some default `title` on an attachment here for ARIA purposes.
	// For example, to some `contentTypeLabels.picture` or `contentTypeLabels.video`,
	// but that would result in a "Picture" / "Video" tooltip
	// being shown in a web browser on mouse over, which would be
	// redundant, pointless and distracting to a user.

	return (
		<ButtonLink
			url={linkToUrl || getAttachmentUrl(attachment)}
			onClick={onClick ? onPictureClick : onPictureClickIgnore}
			className={classNames(
				className,
				'PostAttachmentThumbnail', {
					// 'PictureBorder': !(attachment.type === 'picture' && attachment.picture.transparentBackground)
					// 'PostAttachmentThumbnail--spoiler': attachment.spoiler && !isRevealed
					'PostAttachmentThumbnail--transparent': picture.transparentBackground
				}
			)}>
			{/* `<span/>` is used instead of a `<div/>`
			    because a `<div/>` isn't supposed to be found inside a `<button/>`.
			*/}
			<Picture
				component="span"
				border={border}
				fit={fit}
				imageRef={thumbnailElement}
				title={isRevealed ? attachment.title : spoilerLabel}
				picture={picture}
				width={expand || expandToTheFullest ? undefined : width}
				height={expand || expandToTheFullest ? undefined : height}
				maxWidth={expandToTheFullest
					? undefined
					: (expand
						? picture.width
						: Math.min(
							picture.width,
							maxWidth || (isLandscape ? maxSize : undefined)
						)
					)
				}
				maxHeight={expandToTheFullest
					? undefined
					: (expand
						? undefined
						: Math.min(
							picture.height,
							maxHeight || (!isLandscape ? maxSize : undefined)
						)
					)
				}
				useSmallestSize={expand || expandToTheFullest ? undefined : useSmallestThumbnail}
				useSmallestSizeExactDimensions={expand || expandToTheFullest ? undefined : (
					useSmallestThumbnail
						? (
							(maxWidth === undefined && maxHeight === undefined) &&
							(width === undefined && height === undefined)
						)
						: undefined
				)}
				blur={attachment.spoiler && !isRevealed ? BLUR_FACTOR : undefined}>
				{isLoading &&
					<FadeInOut show fadeInInitially fadeInDuration={3000} fadeOutDuration={0}>
						{/* `<span/>` is used instead of a `<div/>`
						    because a `<div/>` isn't supposed to be inside a `<button/>`. */}
						<span className="PostAttachmentThumbnail__loading">
							<ActivityIndicator className="PostAttachmentThumbnail__loading-indicator"/>
						</span>
					</FadeInOut>
				}
				{attachment.spoiler && !isRevealed && spoilerLabel &&
					<PostAttachmentThumbnailSpoilerBar width={width} height={height}>
						{spoilerLabel}
					</PostAttachmentThumbnailSpoilerBar>
				}
				{attachment.type === 'picture' && attachment.picture.type === 'image/gif' &&
					<PictureBadge placement="bottom-right">
						gif
					</PictureBadge>
				}
				{attachment.type === 'video' &&
					<VideoDuration duration={attachment.video.duration}/>
				}
				{moreAttachmentsCount > 0 &&
					<span className="PostAttachmentThumbnail__more-count">
						{/* `<span/>` is used instead of a `<div/>`
						    because a `<div/>` isn't supposed to be inside a `<button/>`. */}
						+{moreAttachmentsCount + 1}
					</span>
				}
			</Picture>
		</ButtonLink>
	)
}

PostAttachmentThumbnail.propTypes = {
	attachment: PropTypes.oneOfType([
		pictureAttachment,
		videoAttachment
	]).isRequired,
	linkToUrl: PropTypes.string,
	onClick: PropTypes.func,
	spoilerLabel: PropTypes.string,
	maxSize: PropTypes.number,
	maxWidth: PropTypes.number,
	maxHeight: PropTypes.number,
	expandToTheFullest: PropTypes.bool,
	width: PropTypes.number,
	height: PropTypes.number,
	fit: PropTypes.string,
	expand: PropTypes.bool,
	border: PropTypes.bool,
	useSmallestThumbnail: PropTypes.bool,
	moreAttachmentsCount: PropTypes.number,
	fixAttachmentPictureSize: PropTypes.bool,
	className: PropTypes.string
}

// export default React.forwardRef(PostAttachment)

const BLUR_FACTOR = 0.1

// `thumbnailElement` could be used in `Slideshow.OpenCloseAnimationFade.js`.
function useLoadOnClick(
	attachment,
	fixAttachmentPictureSize,
	thumbnailElement,
	isMounted
) {
	const [isLoading, setIsLoading] = useState()

	// This `onClick(event)` function is not `async`
	// because an `async` function results in a React warning
	// telling that a "synthetic event" has been reused.
	const onClick = useCallback((event) => {
		if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
			return
		}

		// Prevent hyperlink click.
		event.preventDefault()

		// "Persist" the event because the function is `async`.
		event.persist()

		if (attachment.type === 'picture') {
			// Preload the picture.
			setIsLoading(true)
			const finish = () => {
				if (isMounted()) {
					setIsLoading(false)
				}
			}
			return preloadPicture(attachment, { fixAttachmentPictureSize }).then(
				finish,
				(error) => {
					console.error(error)
					finish()
				}
			)
		}
	}, [
		attachment,
		fixAttachmentPictureSize,
		thumbnailElement,
		setIsLoading
	])

	return [onClick, isLoading, setIsLoading]
}

function getAttachmentUrl(attachment) {
	switch (attachment.type) {
		case 'picture':
			return attachment.picture.url
		case 'video':
			return getVideoUrl(attachment.video)
		default:
			console.error(`Unknown attachment type: ${attachment.type}`)
			console.log(attachment)
			return
	}
}

function getPicture(attachment) {
	switch (attachment.type) {
		case 'picture':
			return attachment.picture
		case 'video':
			return attachment.video.picture
	}
}

async function preloadPicture(attachment, { fixAttachmentPictureSize }) {
	// `lynxchan` doesn't provide `width` and `height`
	// neither for the picture not for the thumbnail
	// in `/catalog.json` API response (which is a bug).
	// http://lynxhub.com/lynxchan/res/722.html#q984
	if (fixAttachmentPictureSize) {
		await getOriginalPictureSizeAndUrl(attachment)
	}
	await preloadPictureSlide(attachment)
	// For testing/styling.
	// await new Promise(_ => setTimeout(_, 3000))
}

export const ATTACHMENT_THUMBNAIL_SIZE = 250

export function getAttachmentThumbnailSize(attachmentThumbnailSize) {
	return attachmentThumbnailSize || ATTACHMENT_THUMBNAIL_SIZE
}