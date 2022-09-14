import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

function AspectRatioWrapper({
	innerRef,
	innerTabIndex,
	innerClassName,
	aspectRatio,
	children,
	...rest
}, ref) {
	const aspectRatioStyle = useMemo(() => ({
		position: 'relative',
		width: '100%',
		paddingBottom: 100 / aspectRatio + '%'
	}), [aspectRatio])

	return (
		<div ref={ref} {...rest}>
			<div style={aspectRatioStyle}>
				<div
					ref={innerRef}
					tabIndex={innerTabIndex}
					style={ASPECT_RATIO_WRAPPER_INNER_STYLE}
					className={innerClassName}>
					{children}
				</div>
			</div>
		</div>
	)
}

AspectRatioWrapper = React.forwardRef(AspectRatioWrapper)

AspectRatioWrapper.propTypes = {
	aspectRatio: PropTypes.number.isRequired,
	children: PropTypes.node.isRequired
}

export default AspectRatioWrapper

const ASPECT_RATIO_WRAPPER_INNER_STYLE = {
	position: 'absolute',
	width: '100%',
	height: '100%'
}