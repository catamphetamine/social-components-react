import React, { useState, useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

// For some weird reason, in Chrome, `setTimeout()` would lag up to a second (or more) behind.
// Turns out, Chrome developers have deprecated `setTimeout()` API entirely without asking anyone.
// Replacing `setTimeout()` with `requestAnimationFrame()` can work around that Chrome bug.
// https://github.com/bvaughn/react-virtualized/issues/722
import { setTimeout, clearTimeout } from 'request-animation-frame-timeout'

import useMount from '../hooks/useMount.js'

import Button from './Button.js'

/**
 * A button that shows "busy" cursor (and is disabled)
 * until a `Promise`, (if) returned by `onClick`, finishes.
 */
function Button_({
	keepFocus,
	disabled,
	wait: waitProperty,
	onClick,
	className,
	children,
	...rest
}, ref) {
	const buttonRef = useRef()

	const setRef = useCallback((node) => {
		if (ref) {
			if (typeof ref === 'function') {
				ref(node)
			} else {
				ref.current = node
			}
		}
		buttonRef.current = node
	}, [
		ref,
		buttonRef
	])

	const [isMounted, onMount] = useMount()
	const [wait, setWait] = useState()

	const focusTimer = useRef()

	const _onClick = useCallback((...args) => {
		const result = onClick.apply(this, args)
		if (result && typeof result.then === 'function') {
			setWait(true)
			const onEnded = () => {
				if (isMounted()) {
					setWait(false)
					if (keepFocus) {
						clearTimeout(focusTimer.current)
						focusTimer.current = setTimeout(() => {
							if (isMounted()) {
								buttonRef.current.focus()
							}
						}, 0)
					}
				}
			}
			result.then(
				onEnded,
				onEnded
			)
		}
	}, [
		onClick,
		setWait
	])

	useEffect(() => {
		return () => {
			clearTimeout(focusTimer.current)
		}
	}, [])

	onMount()

	return (
		<Button
			{...rest}
			ref={setRef}
			onClick={onClick && _onClick}
			disabled={disabled || wait || waitProperty}
			className={classNames(className, {
				'Button--wait': wait || waitProperty
			})}>
			{children}
		</Button>
	)
}

Button_ = React.forwardRef(Button_)

Button_.propTypes = {
	// If `keepFocus` is `true`, then will re-focus the `<button/>`
	// after an asynchronous `onClick()` has finished, because
	// the `<button/>` is `disabled` while `onClick()` is in progress.
	keepFocus: PropTypes.bool,
	disabled: PropTypes.bool,
	wait: PropTypes.bool,
	// `onClick` is not required when `type` is `"submit"`.
	onClick: PropTypes.func,
	className: PropTypes.string,
	// Sometimes there can be empty buttons:
	// for example, round buttons styled via CSS.
	children: PropTypes.node //.isRequired
}

export default Button_