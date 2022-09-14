import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { throttle } from 'lodash-es'

import { startTouchDeviceDetection } from '../utility/touchDeviceDetection.js'
export { isTouchDevice } from '../utility/touchDeviceDetection.js'

// import { getViewportWidth, getViewportHeight } from 'web-browser-window'

export default function useDeviceInfo() {
	const onResize = useCallback(() => {
		// // // Didn't work for some weird reason:
		// // SCREEN_WIDTH_L = document.documentElement.style.getPropertyValue('--Window-minWidth--l')
		// // SCREEN_WIDTH_XL = document.documentElement.style.getPropertyValue('--Window-minWidth--xl')
		// SCREEN_WIDTH_L = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--Window-minWidth--l'))
		// SCREEN_WIDTH_XL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--Window-minWidth--xl'))
		// screenWidth = getViewportWidth()
		// // screenSize = getScreenSize(getViewportWidth() * getViewportHeight())
		// if (onScreenWidthChange) {
		// 	onScreenWidthChange(screenWidth)
		// }
	}, [])

	const onWindowResize = useCallback(() => {
		throttle((event) => onResize(), 100)
	}, [onResize])

	useEffect(() => {
		onResize()
		window.addEventListener('resize', onWindowResize)
		return () => {
			window.removeEventListener('resize', onWindowResize)
		}
	}, [])

	useEffect(() => {
		return startTouchDeviceDetection()
	}, [])
}

// let screenSize
// let screenWidth

// let SCREEN_WIDTH_L
// let SCREEN_WIDTH_XL

// export function isLargeScreenOrLarger(screenWidth) {
// 	return screenWidth >= SCREEN_WIDTH_L
// }

// export function isExtraLargeScreenOrLarger(screenWidth) {
// 	return screenWidth >= SCREEN_WIDTH_XL
// }

// // http://iosres.com/
// // iPhone XS Max: 414 x 896
// // iPad 11": 834 x 1194
// // iPad Air: 768 x 1024
// function getScreenSize(squarePixels) {
// 	if (squarePixels >= 1920 * 1080) {
// 		return 'L'
// 	} else if (squarePixels >= 1280 * 1024) {
// 		return 'M'
// 	} else if (squarePixels >= 768 * 1024) {
// 		return 'S'
// 	} else {
// 		return 'XS'
// 	}
// }
//
// export function isLargeScreenSizeOrLarger(screenSize) {
// 	return screenSize === 'L'
// }
//
// export function isMediumScreenSizeOrLarger() {
// 	return screenSize === 'M' || isLargeScreenSizeOrLarger()
// }