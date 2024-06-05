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

export * from 'social-components/prop-types'

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