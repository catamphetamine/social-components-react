import React, { useRef, useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { renderTweet } from 'social-components/services/twitter'

import './Tweet.css'

export default function Tweet({
	tweetId,
	darkMode,
	locale,
	onLoad,
	onError,
	className,
	...rest
}, ref) {
	const container = useRef()

	const reference = useCallback((instance) => {
		container.current = instance
		if (ref) {
			if (typeof ref === 'function') {
				ref(instance)
			} else {
				ref.current = instance
			}
		}
	}, [
		ref,
		container
	])

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
			ref={reference}
			{...rest}
			className={classNames('Tweet', className)}/>
	)
}

Tweet = React.forwardRef(Tweet)

Tweet.propTypes = {
	tweetId: PropTypes.string.isRequired,
	darkMode: PropTypes.bool,
	locale: PropTypes.string,
	onLoad: PropTypes.func.isRequired,
	onError: PropTypes.func.isRequired,
	className: PropTypes.string
}

Tweet.defaultProps = {
	onError: error => console.error(error)
}