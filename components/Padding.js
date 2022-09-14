import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './Padding.css'

export default function Padding({ children }) {
	// There can only be one child element.
	children = React.Children.only(children)
	return React.cloneElement(
		children,
		{ className: classNames(children.props.className, 'Padding') }
	)
}

Padding.propTypes = {
	children: PropTypes.node.isRequired
}