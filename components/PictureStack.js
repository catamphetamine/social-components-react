import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './PictureStack.css'

function PictureStack({
	count,
	inline,
	className,
	children,
	...rest
}, ref) {
	return (
		<span
			{...rest}
			className={classNames(className, 'PictureStack', {
				'PictureStack--stack': count > 1,
				'PictureStack--inline': inline
			})}>
			{count > 2 &&
				<span className="PictureStackUnder PictureStackUnder--3-of-3"/>
			}
			{count > 1 &&
				<span className={`PictureStackUnder PictureStackUnder--${count > 2 ? '2-of-3' : '2-of-2'}`}/>
			}
			{/*count > 1 &&
				<span className="PictureStackBorder"/>
			*/}
			{children}
		</span>
	)
}

PictureStack = React.forwardRef(PictureStack)

PictureStack.propTypes = {
	count: PropTypes.number.isRequired,
	inline: PropTypes.bool
}

export default PictureStack