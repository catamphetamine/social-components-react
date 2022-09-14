import { useLayoutEffect, useRef } from 'react'

export default function useLayoutEffectSkipMount(handler, dependencies) {
	const hasMounted = useRef()

	useLayoutEffect(() => {
		if (hasMounted.current) {
			return handler()
		} else {
			hasMounted.current = true
		}
	}, dependencies)
}