import { useRef, useEffect, useLayoutEffect, useCallback } from 'react'

export default function useMount() {
	const isMountedRef = useRef(false)

	const isMounted = useCallback(() => {
		return isMountedRef.current
	}, [])

	const onMount = useCallback(() => {
		// // `useEffect()` runs after `useLayoutEffect()`.
		// // `useEffect()`'s cleanup function runs after
		// // the component is unmounted.
		// useEffect(() => {
		// 	isMountedRef.current = true
		// }, [])
		// `useLayoutEffect()` runs before `useEffect()`.
		// `useLayoutEffect()`'s cleanup function runs before
		// the component is unmounted.
		useLayoutEffect(() => {
			isMountedRef.current = true
			return () => isMountedRef.current = false
		}, [])
	}, [])

	return [isMounted, onMount]
}