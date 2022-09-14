import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

// import { postInlineQuote } from './PropTypes.js'

import './PostInlineQuote.css'

export default function PostInlineQuote({
	generated,
	children
}) {
	return (
		<span className={classNames('PostInlineQuote', {
			'PostInlineQuote--generated': generated
		})}>
			{children}
		</span>
	)
}

PostInlineQuote.propTypes = {
	generated: PropTypes.bool,
	children: PropTypes.node.isRequired
}
