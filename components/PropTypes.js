import PropTypes from 'prop-types'

const {
	shape,
	arrayOf,
	number,
	string,
	bool,
	func,
	object,
	oneOf,
	oneOfType,
	instanceOf,
	elementType
} = PropTypes

// An abstract "ID" type.
const id = oneOfType([string, number])

const date = instanceOf(Date)

const pictureType = oneOf([
	'image/svg+xml',
	'image/jpeg',
	'image/gif',
	'image/png',
	'image/bmp',
	'image/webp'
])

const videoType = oneOf([
	'video/mp4',
	'video/ogg',
	'video/webm'
])

const audioType = oneOf([
	'audio/mpeg',
	'audio/ogg',
	'audio/flac',
	'audio/opus'
])

const coordinates = shape({
	latitude: number.isRequired,
	longitude: number.isRequired,
	altitude: number
})

export const picture = shape({
	// Picture MIME type.
	// Example: "image/jpeg".
	type: pictureType.isRequired,
	title: string,
	description: string,
	// Date the picture was created (taken) in the "local" timezone
	// of the place where the picture was created (taken).
	date: date,
	// Date the picture was created (taken) in "UTC0" timezone.
	dateUTC0: date,
	// GPS coordinates of the place where the photo was taken.
	coordinates,
	// Picture file size (in bytes).
	size: number,
	// Picture file URL.
	url: string.isRequired,
	// Picture dimensions.
	// Dimensions are also required for SVGs for calculating aspect ratio.
	width: number.isRequired,
	height: number.isRequired,
	// `true` if the image has transparent background.
	transparentBackground: bool,
	// Extra picture sizes (thumbnails).
	sizes: arrayOf(shape({
		// Thumbnail MIME type.
		// Example: "image/jpeg".
		type: pictureType.isRequired,
		url: string.isRequired,
		// Thumbnail dimensions.
		width: number.isRequired,
		height: number.isRequired
	}))
})

export const video = shape({
	title: string,
	description: string,
	// Date the video was created (taken) in the "local" timezone
	// of the place where the video was created (taken).
	date: date,
	// Date the video was created (taken) in "UTC0" timezone.
	dateUTC0: date,
	// GPS coordinates of the place where the video was taken.
	coordinates,
	// Video duration (in seconds).
	duration: number,
	startAt: number,
	width: number,
	height: number,
	aspectRatio: number,
	// Video thumbnail.
	picture: picture.isRequired,
	size: number,
	// Video file URL.
	url: string,
	// Video file MIME type.
	// Is required if `url` is present.
	// Example: "video/webm".
	type: videoType,
	provider: oneOf([
		'YouTube',
		'Vimeo'
	]),
	// YouTube/Vimeo video `id`.
	id: string
})

export const audio = shape({
	type: audioType.isRequired,
	url: string,
	provider: oneOf([
		'SoundCloud'
	]),
	id: string,
	author: string,
	title: string,
	description: string,
	date: date,
	duration: number,
	picture: picture,
	size: number,
	bitrate: number
})

export const postLinkBlock = shape({
	url: string.isRequired,
	title: string.isRequired,
	description: string.isRequired,
	image: string
})

export const pictureAttachment = shape({
	id,
	type: oneOf(['picture']).isRequired,
	picture: picture.isRequired
})

export const videoAttachment = shape({
	id,
	type: oneOf(['video']).isRequired,
	video: video.isRequired
})

export const audioAttachment = shape({
	id,
	type: oneOf(['audio']).isRequired,
	audio: audio.isRequired
})

const postAttachmentStub = object

const socialShapeWithAttachmentsStub = {
	provider: oneOf([
		'Instagram',
		'Twitter'
	]).isRequired,
	id: string.isRequired,
	url: string,
	content: string,
	date: date,
	author: shape({
		id: string.isRequired,
		name: string,
		url: string,
		picture
	}),
	attachments: arrayOf(postAttachmentStub)
}

const socialWithAttachmentsStub = shape(socialShapeWithAttachmentsStub)

export const socialAttachment = shape({
	type: oneOf(['social']).isRequired,
	social: socialWithAttachmentsStub.isRequired
})

const linkAttachment = shape({
	id,
	type: oneOf(['link']).isRequired,
	link: postLinkBlock.isRequired
})

export const postFile = shape({
	name: string,
	ext: string,
	type: string,
	size: number,
	url: string.isRequired,
	picture: picture
})

export const fileAttachment = shape({
	id,
	type: oneOf(['file']),
	file: postFile.isRequired
})

export const postAttachment = oneOfType([
	pictureAttachment,
	videoAttachment,
	audioAttachment,
	socialAttachment,
	linkAttachment,
	fileAttachment
])

const postNewLine = oneOf(['\n'])

// This is a replacement of `postInlineContent`
// to be used when defining parts of `postInlineContent` itself,
// because `postInlineContent` type can't be used
// until it has been defined itself.
const postInlineContentStub = oneOfType([
	string,
	object,
	arrayOf(oneOfType([
		string,
		object
	]))
])

export const postTextStyle = oneOfType([
	oneOf([
		'bold',
		'italic',
		'underline',
		'strikethrough',
		'subscript',
		'superscript'
	]),
	string
])

export const postStyledText = shape({
	type: oneOf(['text']).isRequired,
	style: postTextStyle.isRequired,
	content: postInlineContentStub.isRequired
})

export const postCode = shape({
	type: oneOf(['code']).isRequired,
	censored: bool,
	content: oneOfType([
		string,
		postNewLine,
		arrayOf(oneOfType([
			string,
			postNewLine,
			postStyledText
		]))
	]).isRequired
})

export const postEmoji = shape({
	type: oneOf(['emoji']).isRequired,
	name: string.isRequired,
	url: string.isRequired
})

export const postInlineLink = shape({
	type: oneOf(['link']).isRequired,
	url: string.isRequired,
	content: postInlineContentStub.isRequired,
	contentGenerated: bool,
	attachment: postAttachment,
	service: string
})

export const postInlineQuote = shape({
	type: oneOf(['quote']).isRequired,
	content: postInlineContentStub.isRequired,
	// The `generated` flag is only used in `post-link`s.
	generated: bool,
	// `block: true` emulates block appearance while staying inline.
	block: bool
})

export const postSpoiler = shape({
	type: oneOf(['spoiler']).isRequired,
	content: postInlineContentStub.isRequired
})

export const postReadMore = shape({
	type: oneOf(['read-more']).isRequired
})

export const postPostLinkShape = shape({
	type: oneOf(['post-link']).isRequired,
	postId: oneOfType([string, number]).isRequired,
	// threadId: oneOfType([string, number]),
	// boardId: oneOfType([string, number]),
	url: string.isRequired,
	content: postInlineContentStub
})

export const postInlineContentElement = oneOfType([
	string,
	postNewLine,
	postStyledText,
	postInlineLink,
	postInlineQuote,
	postReadMore,
	postSpoiler,
	postEmoji,
	// Custom chan.
	postPostLinkShape
])

export const postInlineContent = oneOfType([
	string,
	postNewLine,
	arrayOf(postInlineContentElement)
])

export const postSubheading = shape({
	type: oneOf(['subheading']).isRequired,
	content: postInlineContent.isRequired
})

export const social = shape({
	...socialShapeWithAttachmentsStub,
	attachments: arrayOf(postAttachment)
})

export const postQuote = shape({
	type: oneOf(['quote']).isRequired,
	content: postInlineContent.isRequired,
	source: string,
	url: string
})

export const postList = shape({
	type: oneOf(['list']).isRequired,
	items: arrayOf(postInlineContent).isRequired
})

const postEmbeddedAttachmentProperties = {
	type: oneOf(['attachment']).isRequired,
	expand: bool,
	align: oneOf(['center'])
}

const postEmbeddedAttachment = oneOfType([
	shape({
		...postEmbeddedAttachmentProperties,
		attachmentId: number.isRequired
	}),
	shape({
		...postEmbeddedAttachmentProperties,
		attachment: postAttachment.isRequired
	})
])

export const postBlock = oneOfType([
	postSubheading,
	postList,
	postQuote,
	postEmbeddedAttachment,
	postReadMore,
	postInlineContent
])

export const postContent = oneOfType([
	string,
	arrayOf(postBlock)
])

export const censoredText = oneOfType([
	string,
	arrayOf(oneOfType([
		string,
		postSpoiler
	]))
])

export const account = shape({
	id,
	name: string,
	picture: pictureType
})

export const post = shape({
	id,
	title: string,
	titleCensored: censoredText,
	content: postContent,
	createdAt: date,
	author: account, //.isRequired,
	replies: arrayOf(object), // .arrayOf(post) // Can't recurse into `post` type here.
	attachments: arrayOf(postAttachment)
})

export const postBadge = shape({
	ref: object,
	name: string.isRequired,
	icon: elementType,
	getIcon: func,
	getIconProps: func,
	title: func,
	condition: func.isRequired,
	content: elementType,
	onClick: func,
	isPushed: bool
})

export const postMessages = shape({
	moreActions: shape({
		title: string
	}),
	readMore: string,
	spoiler: string,
	reply: string,
	repliesCount: string,
	commentsCount: string
})