export function createAnimationResult({
	animationDuration,
	cleanUp
}) {
	const { promise, cancel } = cancellableTimeout(animationDuration)

	let finished = false
	let cancelled = false

	return {
		animationDuration,
		promise: promise.then(() => {
			finished = true
			cleanUp()
		}),
		cancel: () => {
			if (!finished) {
				if (!cancelled) {
					cancel()
					cancelled = true
					cleanUp()
				}
			}
		}
	}
}

function cancellableTimeout(interval) {
	let timer
	const promise = new Promise((resolve) => {
		timer = setTimeout(resolve, interval)
	})
	return {
		promise,
		cancel: () => clearTimeout(timer)
	}
}