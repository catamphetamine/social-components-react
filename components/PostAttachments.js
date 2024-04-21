import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { getNonEmbeddedAttachments, getSortedAttachments, getPostThumbnailAttachment } from 'social-components/post'
import { getPicturesAndVideos, sortAttachmentsByThumbnailHeightDescending } from 'social-components/attachment'

import {
	// TRANSPARENT_PIXEL,
	// getAspectRatio as getPictureAspectRatio
} from './Picture.js'

// import {
// 	getMaxSize as getVideoMaxSize,
// 	getAspectRatio as getVideoAspectRatio
// } from './Video.js'

import PostPicture, {
	EXAMPLE as PICTURE_EXAMPLE
} from './PostPicture.js'

import PostVideo, {
	EXAMPLE as VIDEO_EXAMPLE
} from './PostVideo.js'

import PostAudio, {
	EXAMPLE_1 as AUDIO_EXAMPLE_1,
	EXAMPLE_2 as AUDIO_EXAMPLE_2
} from './PostAudio.js'

import PostLinkBlock, {
	EXAMPLE_1 as LINK_EXAMPLE_1,
	EXAMPLE_2 as LINK_EXAMPLE_2
} from './PostLinkBlock.js'

import PostFile, {
	EXAMPLE_1 as FILE_EXAMPLE_1,
	EXAMPLE_2 as FILE_EXAMPLE_2,
	EXAMPLE_3 as FILE_EXAMPLE_3
} from './PostFile.js'

import PostAttachmentThumbnail, { getAttachmentThumbnailSize } from './PostAttachmentThumbnail.js'
import PictureStack from './PictureStack.js'

import Button from './Button.js'

import {
	postAttachment
} from './PropTypes.js'

import XIcon from '../icons/x.svg'

import './PostAttachments.css'

// Set to `true` to test rendering of all supported attachment types.
const TEST = false

export default function PostAttachments({
	post,
	compact,
	expandFirstPictureOrVideo,
	expandAttachments,
	showOnlyFirstAttachmentThumbnail,
	attachmentThumbnailSize,
	useSmallestThumbnails,
	spoilerLabel,
	removeAttachmentLabel,
	onAttachmentClick,
	onAttachmentRemove,
	maxAttachmentThumbnails,
	showPostThumbnailWhenThereAreMultipleAttachments,
	showPostThumbnailWhenThereIsNoContent
}) {
	const attachments = TEST ? TEST_ATTACHMENTS : getAttachments(post)

	const doAttachmentsHaveIds = attachments.every(_ => Boolean(_.id))

	// const pictures = attachments.filter(_ => _.type === 'picture')
	// const videos = attachments.filter(_ => _.type === 'video')
	let picturesAndVideos = getPicturesAndVideos(attachments)

	// Extract "title" picture or video.
	let titlePictureOrVideo
	if (!expandAttachments && expandFirstPictureOrVideo && picturesAndVideos.length > 0) {
		titlePictureOrVideo = picturesAndVideos[0]
		picturesAndVideos = picturesAndVideos.slice(1)
	}

	// Sort pictures and videos by thumbnail height descending.
	sortAttachmentsByThumbnailHeightDescending(picturesAndVideos)

	// "All pictures and videos" that can be used for a slideshow.
	let allPicturesAndVideos = picturesAndVideos
	if (titlePictureOrVideo) {
		allPicturesAndVideos = [titlePictureOrVideo].concat(picturesAndVideos)
	}

	const audios = attachments.filter(_ => _.type === 'audio')
	const links = attachments.filter(_ => _.type === 'link')
	const files = attachments.filter(_ => _.type === 'file')

	// const shouldExpandFirstPicture = pictures.length === 1 || (pictures.length > 1 && videos.length !== 1)
	// const shouldExpandFirstVideo = videos.length === 1 || (videos.length > 1 && pictures.length !== 1)

	// let thumbnailPictures = shouldExpandFirstPicture ? pictures.slice(1) : pictures
	// const thumbnailVideos = shouldExpandFirstVideo ? videos.slice(1) : videos

	// const thumbnailPicturesMoreCount = thumbnailPictures.length - MAX_THUMBNAIL_PICTURES
	// if (thumbnailPicturesMoreCount > 0) {
	// 	thumbnailPictures = thumbnailPictures.slice(0, MAX_THUMBNAIL_PICTURES)
	// }

	let picturesAndVideosMoreCount = 0
	if (maxAttachmentThumbnails > 0) {
		picturesAndVideosMoreCount = picturesAndVideos.length - maxAttachmentThumbnails
		if (picturesAndVideosMoreCount > 0) {
			picturesAndVideos = picturesAndVideos.slice(0, maxAttachmentThumbnails)
		}
	}

	function createOnAttachmentClick(i) {
		return (event) => {
			event.preventDefault()
			onAttachmentClick(allPicturesAndVideos[i], { imageElement: event.target })
		}
	}

	const postThumbnailAttachment = getPostThumbnailAttachment(post, {
		showPostThumbnailWhenThereAreMultipleAttachments,
		showPostThumbnailWhenThereIsNoContent
	})

	let AttachmentThumbnailContainer = PassthroughContainer
	if (showOnlyFirstAttachmentThumbnail) {
		AttachmentThumbnailContainer = PictureStackContainer
		if (titlePictureOrVideo) {
			picturesAndVideos = []
		} else {
			if (picturesAndVideos.length > 0) {
				picturesAndVideos = [picturesAndVideos[0]]
			}
		}
	}

	const attachmentsCount = picturesAndVideos.length + audios.length + links.length + files.length
	const align = compact ? 'left' : 'center'

	if (attachments.length === 0) {
		return null
	}

	return (
		<div className={classNames('PostAttachments', {
			'PostAttachments--compact': compact,
			'PostAttachments--onlyPostThumbnail': attachmentsCount === 1 && picturesAndVideos.length === 1 && picturesAndVideos[0] === postThumbnailAttachment
		})}>
			<div className="PostAttachments-cancelsAttachmentMarginTop">
				<div className="PostAttachments-marginCollapseBorder">
					{expandAttachments &&
						picturesAndVideos.map((pictureOrVideo, i) => {
							switch (pictureOrVideo.type) {
								case 'picture':
									return (
										<PostPicture
											key={doAttachmentsHaveIds ? pictureOrVideo.id : i}
											expand
											align={align}
											attachment={pictureOrVideo}
											spoilerLabel={spoilerLabel}
											onClick={onAttachmentClick ? createOnAttachmentClick(i) : undefined}
										/>
									)
								case 'video':
									return (
										<PostVideo
											key={doAttachmentsHaveIds ? pictureOrVideo.id : i}
											expand
											align={align}
											attachment={pictureOrVideo}
											spoilerLabel={spoilerLabel}
											onClick={onAttachmentClick ? createOnAttachmentClick(i) : undefined}
										/>
									)
							}
						})
					}
					{!expandAttachments && titlePictureOrVideo && titlePictureOrVideo.type === 'picture' &&
						<AttachmentThumbnailContainer count={allPicturesAndVideos.length}>
							<PostPicture
								align={align}
								attachment={titlePictureOrVideo}
								spoilerLabel={spoilerLabel}
								onClick={onAttachmentClick ? createOnAttachmentClick(0) : undefined}
							/>
						</AttachmentThumbnailContainer>
					}
					{!expandAttachments && titlePictureOrVideo && titlePictureOrVideo.type === 'video' &&
						<AttachmentThumbnailContainer count={allPicturesAndVideos.length}>
							<PostVideo
								align={align}
								attachment={titlePictureOrVideo}
								spoilerLabel={spoilerLabel}
								onClick={onAttachmentClick ? createOnAttachmentClick(0) : undefined}
							/>
						</AttachmentThumbnailContainer>
					}
					{!expandAttachments && picturesAndVideos.length > 0 &&
						<div className={classNames('PostAttachmentThumbnails', {
							'PostAttachmentThumbnails--showOnlyFirstAttachmentThumbnail': showOnlyFirstAttachmentThumbnail
						})}>
							<div className="PostAttachmentThumbnails-list">
								{picturesAndVideos.map((pictureOrVideo, i) => {
									return (
										<AttachmentThumbnailContainer
											key={`picture-or-video-${doAttachmentsHaveIds ? pictureOrVideo.id : i}`}
											count={allPicturesAndVideos.length}
											pictureStackClassName={classNames('PostAttachments-pictureStack', {
												'PostAttachments-pictureStack--postThumbnail': pictureOrVideo === postThumbnailAttachment
											})}>
											<PostAttachmentThumbnail
												border
												attachment={pictureOrVideo}
												useSmallestThumbnail={useSmallestThumbnails}
												maxSize={getAttachmentThumbnailSize(attachmentThumbnailSize)}
												spoilerLabel={spoilerLabel}
												onClick={onAttachmentClick ? createOnAttachmentClick(i + (titlePictureOrVideo ? 1 : 0)) : undefined}
												moreAttachmentsCount={i === picturesAndVideos.length - 1 ? picturesAndVideosMoreCount : undefined}
												className={classNames({
													'PostAttachmentThumbnail--postThumbnail': pictureOrVideo === postThumbnailAttachment
												})}
											>
												{onAttachmentRemove &&
													<PostAttachmentRemoveButton
														removeAttachmentLabel={removeAttachmentLabel}
														onClick={() => onAttachmentRemove(pictureOrVideo)}
													/>
												}
											</PostAttachmentThumbnail>
										</AttachmentThumbnailContainer>
									)
								})}
							</div>
						</div>
					}
					{audios.length > 0 && audios.map((audio, i) => (
						<PostAudio
							key={doAttachmentsHaveIds ? audio.id : i}
							audio={audio.audio}
							onRemove={onAttachmentRemove ? () => onAttachmentRemove(audio) : undefined}
							removeLabel={removeAttachmentLabel}
						/>
					))}
					{links.length > 0 && links.map((link, i) => (
						<PostLinkBlock key={doAttachmentsHaveIds ? link.id : i} link={link.link}/>
					))}
					{files.length > 0 && files.map((file, i) => (
						<PostFile
							key={doAttachmentsHaveIds ? file.id : i}
							file={file.file}
							onRemove={onAttachmentRemove ? () => onAttachmentRemove(file) : undefined}
							removeLabel={removeAttachmentLabel}
						/>
					))}
					{/* If a user selects the attachments portion of the page and then copies it
					    into the clipboard, this dummy `<div/>` will insert a "new line" after attachments
					    in the copied text. */}
					<div style={POSITION_ABSOLUTE}>
						<br/>
					</div>
				</div>
			</div>
		</div>
	)
}

PostAttachments.propTypes = {
	post: PropTypes.object,
	compact: PropTypes.bool,
	onAttachmentClick: PropTypes.func,
	onAttachmentRemove: PropTypes.func,
	expandFirstPictureOrVideo: PropTypes.bool.isRequired,
	expandAttachments: PropTypes.bool,
	// Currently this property only limits the displayed pictures and videos.
	// Doesn't affect audios, files, links, etc.
	showOnlyFirstAttachmentThumbnail: PropTypes.bool,
	spoilerLabel: PropTypes.string,
	removeAttachmentLabel: PropTypes.string,
	attachmentThumbnailSize: PropTypes.number,
	useSmallestThumbnails: PropTypes.bool,
	maxAttachmentThumbnails: PropTypes.oneOfType([
		PropTypes.oneOf([false]),
		PropTypes.number
	]).isRequired,
	showPostThumbnailWhenThereAreMultipleAttachments: PropTypes.bool,
	showPostThumbnailWhenThereIsNoContent: PropTypes.bool,
	children: PropTypes.arrayOf(postAttachment)
}

PostAttachments.defaultProps = {
	expandFirstPictureOrVideo: false,
	maxAttachmentThumbnails: 6
}

const POSITION_ABSOLUTE = {
	position: 'absolute'
}

export function getAttachments(post) {
	if (TEST) {
		return TEST_ATTACHMENTS
	}
	return getNonEmbeddedAttachments(post)
}

// function groupThumbnails(thumbnails, targetRowRatioTolerance) {
// 	let targetRowRatio = 4.5
// 	const targetRowRatioToleranceStep = 0.1
// 	const rows = []
// 	let row = []
// 	for (const thumbnail of thumbnails) {
// 		row.push(thumbnail)
// 		const rowRatio = getRowRatio(row)
// 		if (rowRatio >= targetRowRatio + targetRowRatioTolerance * targetRowRatioToleranceStep) {
// 			rows.push(row)
// 			row = []
// 		}
// 	}
// 	if (row.length > 0) {
// 		rows.push([])
// 	}
// 	return rows
// }

// function groupThumbnailsRecursive(thumbnails, targetRowRatioTolerance = 0) {
// 	const forLowerRowRatio = groupThumbnails(thumbnails, targetRowRatioTolerance * -1 / 2)
// 	const forHigherRowRatio = groupThumbnails(thumbnails, targetRowRatioTolerance)
// 	if (!hasIncompleteRows(forHigherRowRatio)) {
// 		return forHigherRowRatio
// 	} else if (!hasIncompleteRows(forLowerRowRatio)) {
// 		return forLowerRowRatio
// 	} else {
// 		// If the last row is not complete
// 		// then maybe re-group with a looser target row ratio.
//
// 		// If there's not enough thumbnails for the higher row ratio
// 		// then just group them in a single row.
// 		if (forHigherRowRatio.length === 1) {
// 			// console.log(getRowRatio(thumbnails))
// 			return thumbnails
// 		}
//
// 		// If there is already at least a single complete row
// 		// then maybe add the ungrouped images left to it.
// 		return groupThumbnailsRecursive(thumbnails, targetRowRatioTolerance + 1)
// 	}
// }

// function hasIncompleteRows(result) {
// 	return result[result.length - 1].length === 0
// }

// function getRowRatio(row) {
// 	return row.reduce((totalWidth, _) => totalWidth + _.width / _.height, 0)
// }

// console.log(groupThumbnailsRecursive([{
// 	width: 1000,
// 	height: 700
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1080,
// 	height: 1920
// }, {
// 	width: 400,
// 	height: 400
// }, {
// 	width: 480,
// 	height: 640
// }]))

// console.log(groupThumbnailsRecursive([{
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }]))

// console.log(groupThumbnailsRecursive([{
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }]))

// console.log(groupThumbnailsRecursive([{
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }, {
// 	width: 1920,
// 	height: 1080
// }]))

// function getAttachmentAspectRatio(attachment) {
// 	switch (attachment.type) {
// 		case 'picture':
// 			return getPictureAspectRatio(attachment.picture)
// 		case 'video':
// 			return getVideoAspectRatio(attachment.video)
// 		default:
// 			console.error(`Unknown attachment type: ${attachment.type}`)
// 			console.log(attachment)
// 			return 1
// 	}
// }

// function getAttachmentMaxHeight(attachment) {
// 	switch (attachment.type) {
// 		case 'picture':
// 			return attachment.picture.height
// 		case 'video':
// 			return getVideoMaxSize(attachment.video).height
// 		default:
// 			console.error(`Unknown attachment type: ${attachment.type}`)
// 			console.log(attachment)
// 			return
// 	}
// }

// function inscribeThumbnailHeightIntoSize(attachment, maxExtent) {
// 	const aspectRatio = getAttachmentAspectRatio(attachment)
// 	const maxHeight = getAttachmentMaxHeight(attachment)
// 	if (aspectRatio > 1) {
// 		maxExtent = maxExtent / aspectRatio
// 	}
// 	if (maxHeight < maxExtent) {
// 		return maxHeight
// 	}
// 	return maxExtent
// }

// /**
//  * Sorts attachments by their aspect ratio ascending (the tallest ones first).
//  * Mutates the original array (could add `.slice()` but not required).
//  * @param  {object[]} attachments
//  * @return {object[]}
//  */
// function sortByAspectRatioAscending(attachments) {
// 	// A minor optimization.
// 	if (attachments.length === 1) {
// 		return attachments
// 	}
// 	return attachments.sort((a, b) => {
// 		return getAttachmentAspectRatio(a) - getAttachmentAspectRatio(b)
// 	})
// }

const TEST_ATTACHMENTS = [
	{
		id: 1,
		type: 'file',
		file: FILE_EXAMPLE_1
	},
	{
		id: 2,
		type: 'file',
		file: FILE_EXAMPLE_2
	},
	{
		id: 3,
		type: 'file',
		file: FILE_EXAMPLE_3
	},
	{
		id: 4,
		type: 'picture',
		picture: PICTURE_EXAMPLE
	},
	{
		id: 5,
		type: 'video',
		video: VIDEO_EXAMPLE
	},
	{
		id: 6,
		type: 'audio',
		audio: AUDIO_EXAMPLE_1
	},
	{
		id: 7,
		type: 'audio',
		audio: AUDIO_EXAMPLE_2
	},
	{
		id: 8,
		type: 'link',
		link: LINK_EXAMPLE_1
	},
	{
		id: 9,
		type: 'link',
		link: LINK_EXAMPLE_2
	}
]

function PassthroughContainer({ count, pictureStackClassName, ...rest }) {
	return <React.Fragment {...rest}/>
}

PassthroughContainer.propTypes = {
	count: PropTypes.number,
	pictureStackClassName: PropTypes.string
}

function PictureStackContainer({ count, pictureStackClassName, ...rest }) {
	return <PictureStack count={count} className={pictureStackClassName} {...rest}/>
}

PictureStackContainer.propTypes = {
	count: PropTypes.number.isRequired,
	pictureStackClassName: PropTypes.string
}

function PostAttachmentRemoveButton({
	removeAttachmentLabel,
	onClick
}) {
	return (
		<Button
			onClick={onClick}
			aria-label={removeAttachmentLabel}
			className="PostAttachmentRemoveButton">
			<XIcon className="PostAttachmentRemoveButton-icon"/>
		</Button>
	)
}

PostAttachmentRemoveButton.propTypes = {
	removeAttachmentLabel: PropTypes.string,
	onClick: PropTypes.func.isRequired
}