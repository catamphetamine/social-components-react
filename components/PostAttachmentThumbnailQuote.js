import React, { useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'

import PostAttachmentThumbnail, { getAttachmentThumbnailSize } from './PostAttachmentThumbnail.js'
import PictureStack from './PictureStack.js'
// import PictureBadge from './PictureBadge.js'
import PostQuoteBlock from './PostQuoteBlock.js'

import { postAttachment } from './PropTypes.js'

import './PostAttachmentThumbnailQuote.css'

// When `post-link` quote text was generated from an untitled attachment,
// such `post-link` is supposed to have an `.attachments` property set
// so that those attachments could be displayed instead of a generic
// "Picture"/"Video" placeholder.
export default function PostAttachmentThumbnailQuote({
	attachments,
	markFirstQuote,
	useSmallestThumbnailsForAttachments,
	attachmentThumbnailSize,
	onAttachmentClick,
	spoilerLabel
}) {
	const _onAttachmentClick = useCallback((event) => {
		event.preventDefault()
		onAttachmentClick(attachments[0], { attachments, imageElement: event.target })
	}, [
		onAttachmentClick,
		attachments
	])
	return (
		<PostQuoteBlock
			inline
			generated
			first={markFirstQuote}
			className="PostQuoteBlock--attachment">
			<PictureStack
				inline
				count={attachments.length}
				className="PostQuoteBlock-attachment">
				<PostAttachmentThumbnail
					border
					link={false}
					attachment={attachments[0]}
					onClick={onAttachmentClick ? _onAttachmentClick : undefined}
					useSmallestThumbnail={useSmallestThumbnailsForAttachments}
					maxSize={getAttachmentThumbnailSize(attachmentThumbnailSize)}
					spoilerLabel={spoilerLabel}/>
			</PictureStack>
		</PostQuoteBlock>
	)
}

PostAttachmentThumbnailQuote.propTypes = {
	attachments: PropTypes.arrayOf(postAttachment).isRequired,
	markFirstQuote: PropTypes.bool,
	useSmallestThumbnailsForAttachments: PropTypes.bool,
	attachmentThumbnailSize: PropTypes.number,
	onAttachmentClick: PropTypes.func,
	spoilerLabel: PropTypes.string
}

// /**
//  * Wraps the picture (`<img/>`) in a `<span/>` instead of a `<div/>`.
//  */
// function PostAttachmentThumbnailComponent({
// 	// count,
// 	style,
// 	className,
// 	children,
// 	// ...rest
// }, ref) {
// 	return (
// 		<span
// 			ref={ref}
// 			style={style}
// 			className={className}>
// 			{children}
// 		</span>
// 	)
// 	// return (
// 	// 	<span
// 	// 		ref={ref}
// 	// 		style={style}
// 	// 		className={classNames(className, 'PostQuoteBlock-attachment')}>
// 	// 		{children}
// 	// 		{count > 1 &&
// 	// 			<PictureBadge
// 	// 				placement="top-right"
// 	// 				className="PostQuoteBlock-attachmentMoreCount">
// 	// 				+{count - 1}
// 	// 			</PictureBadge>
// 	// 		}
// 	// 	</span>
// 	// )
// }

// PostAttachmentThumbnailComponent = React.forwardRef(PostAttachmentThumbnailComponent)

// PostAttachmentThumbnailComponent.propTypes = {
// 	// count: PropTypes.number.isRequired,
// 	style: PropTypes.object,
// 	className: PropTypes.string,
// 	children: PropTypes.node.isRequired
// }