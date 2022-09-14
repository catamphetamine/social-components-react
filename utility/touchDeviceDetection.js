let _isTouchDevice

export function startTouchDeviceDetection() {
	const onTouchStart = () => {
		_isTouchDevice = true
		window.removeEventListener('touchstart', onTouchStart)
	}
	window.addEventListener('touchstart', onTouchStart)
	return () => {
		window.removeEventListener('touchstart', onTouchStart)
	}
}

export function isTouchDevice() {
	return _isTouchDevice
}