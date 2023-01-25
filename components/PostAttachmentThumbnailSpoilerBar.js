import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { px } from 'web-browser-style'

export default function PostAttachmentThumbnailSpoilerBar({
	width,
	height,
	children: spoilerLabel,
	...rest
}) {
	const {
		fontSizeTooSmall,
		fontSizeStyle
	} = useAttachmentSpolerFontSize({
		width,
		height,
		spoilerLabel
	})

	if (fontSizeTooSmall) {
		return null
	}

	return (
		<div
			{...rest}
			style={fontSizeStyle}
			className="PostAttachmentThumbnail-spoiler">
			{spoilerLabel}
		</div>
	)
}

PostAttachmentThumbnailSpoilerBar.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	children: PropTypes.string.isRequired
}

const DEFAULT_FONT_SIZE = 16
const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE_HEIGHT_FACTOR = 0.85

function useAttachmentSpolerFontSize({
	width,
	height,
	spoilerLabel
}) {
	let fontSize = DEFAULT_FONT_SIZE

	if (width && height) {
		fontSize = Math.floor(width / spoilerLabel.length)
		if (fontSize > height * MAX_FONT_SIZE_HEIGHT_FACTOR) {
			if (height > MIN_FONT_SIZE * MAX_FONT_SIZE_HEIGHT_FACTOR) {
				fontSize = height / MAX_FONT_SIZE_HEIGHT_FACTOR
			} else {
				fontSize = 0
			}
		}
	}

	const fontSizeStyle = useMemo(() => ({
		fontSize: px(fontSize)
	}), [fontSize])

	if (!fontSize) {
		return {
			fontSizeTooSmall: true
		}
	}

	return {
		fontSizeStyle
	}
}
