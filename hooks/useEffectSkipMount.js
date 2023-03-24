import { useEffect, useRef } from 'react'

export default function useEffectSkipMount(handler, dependencies) {
	// Turns out that when React runs in "strict" mode, it calls the effects twice on mount.
	// https://beta.reactjs.org/reference/react/StrictMode
	// So just the simple `hasMounted.current = true` check won't work in those cases
	// and it has to also manually compare "previous dependencies" with "new dependencies".
	const prevDependencies = useRef(dependencies)

	const hasMounted = useRef()

	useEffect(() => {
		if (hasMounted.current) {
			if (!arraysAreEqual(dependencies, prevDependencies.current)) {
				const cleanUpFunction = handler()
				if (cleanUpFunction) {
					throw new Error('`useEffectSkipMount()`\'s handler function can\'t return a clean-up function because it wouldn\'t work correctly')
				}
			}
		} else {
			hasMounted.current = true
		}
	}, dependencies)
}

function arraysAreEqual(a, b) {
	if (a.length !== b.length) {
		return false
	}
	let i = 0
	while (i < a.length) {
		if (a[i] !== b[i]) {
			return false
		}
		i++
	}
	return true
}