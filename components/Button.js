import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './Button.css'

/**
 * An unstyled `<button/>`.
 */
let Button = ({
	type = 'button',
	className,
	children,
	...rest
}, ref) => {
	return (
		<button
			{...rest}
			ref={ref}
			type={type}
			className={classNames('Button', className)}>
			{children}
		</button>
	)
}

Button = React.forwardRef(Button)

Button.propTypes = {
	type: PropTypes.oneOf(['button', 'submit']),
	className: PropTypes.string,
	// Sometimes there can be empty buttons:
	// for example, round buttons styled via CSS.
	children: PropTypes.node //.isRequired
}

export default Button