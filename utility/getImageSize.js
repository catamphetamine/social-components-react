// Gets image size.
// Returns a `Promise`.
export default function getImageSize(url) {
	return new Promise((resolve, reject) => {
		const image = new Image()
		image.onload = () => resolve({ width: image.width, height: image.height })
		// Won't trigger an "error" event if an image
		// is returned with status `404 Not found`.
		image.onerror = (event) => {
			if (event.path && event.path[0]) {
				console.error(`Image not found: ${event.path[0].src}`)
			}
			const error = new Error('IMAGE_NOT_FOUND')
			error.url = url
			error.event = event
			reject(error)
		}
		image.src = url
	})
}

// export async function getImageSizes(urls) {
// 	const images = []
// 	for (const url of urls) {
// 		try {
// 			images.push({
// 				url,
// 				...(await getImageSize(url))
// 			})
// 		} catch (error) {
// 			console.error(error)
// 		}
// 	}
// 	return images
// }