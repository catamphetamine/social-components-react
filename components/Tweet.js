import React, { useRef, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import useForwardedRef from 'frontend-lib/hooks/useForwardedRef.js'

import { renderTweet } from 'social-components/services/twitter'

import './Tweet.css'

export default function Tweet({
	tweetId,
	darkMode,
	locale,
	onLoad,
	onError = outputErrorToConsole,
	className,
	...rest
}, ref) {
	const { setRef, internalRef: container } = useForwardedRef(ref)

	// const [isLoading, setLoading ] = useState(true)

	useEffect(() => {
		renderTweet(tweetId, container.current, { darkMode, locale }).then((element) => {
			// setLoading(false)
			onLoad()
		}, (error) => {
			// setLoading(false)
			onError(error)
		})
	}, [])

	return (
		<div
			ref={setRef}
			{...rest}
			className={classNames('Tweet', className)}
		/>
	)
}

Tweet = React.forwardRef(Tweet)

Tweet.propTypes = {
	tweetId: PropTypes.string.isRequired,
	darkMode: PropTypes.bool,
	locale: PropTypes.string,
	onLoad: PropTypes.func.isRequired,
	onError: PropTypes.func,
	className: PropTypes.string
}

function outputErrorToConsole(error) {
	console.error(error)
}