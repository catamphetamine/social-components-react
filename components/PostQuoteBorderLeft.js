import React from 'react'
import PropTypes from 'prop-types'

import './PostQuoteBorderLeft.css'

export default function PostQuoteBorderLeft() {
	// `<span/>` is used here instead of a `<div/>`
	// because `<PostQuoteBorderLeft/>` is also used for
	// `<PostInlineQuote/>`s and `<PostQuoteLink/>`s.
	return (
		<span className="PostQuoteBorderLeft"/>
	)
}