import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Link } from 'react-pages'

import Button from './Button.js'

import './PostReadMore.css'

export default class PostReadMore extends React.Component {
	onClick = (event) => {
		event.preventDefault()
		const { onReadMore } = this.props
		onReadMore()
	}

	render() {
		const {
			url,
			readMoreLabel
		} = this.props
		const className = 'PostReadMore'
		if (url) {
			return (
				<Link
					to={url}
					onClick={this.onClick}
					className={className}>
					{readMoreLabel}
				</Link>
			)
		}
		return (
			<Button
				onClick={this.onClick}
				className={className}>
				{readMoreLabel}
			</Button>
		)
	}
}

PostReadMore.propTypes = {
	url: PropTypes.string,
	// `onReadMore()` is not currently used.
	onReadMore: PropTypes.func,
	readMoreLabel: PropTypes.string.isRequired
}