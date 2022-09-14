import React from 'react'
import PropTypes from 'prop-types'

import { postEmoji } from './PropTypes.js'

export default function PostEmoji({ children: { name, url } }) {
	return (
		<img alt={name} src={url}/>
	)
}

PostEmoji.propTypes = {
	children: postEmoji.isRequired
}