import { useEffect, useRef } from 'react'

export default function useEffectSkipMount(handler, dependencies) {
	const hasMounted = useRef()

	useEffect(() => {
		if (hasMounted.current) {
			return handler()
		} else {
			hasMounted.current = true
		}
	}, dependencies)
}