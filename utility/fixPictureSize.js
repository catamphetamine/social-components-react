import getImageSize from './getImageSize.js'

// `lynxchan` doesn't provide `width` and `height`
// neither for the picture not for the thumbnail
// in `/catalog.json` API response (which is a bug).
// http://lynxhub.com/lynxchan/res/722.html#q984
export function fixAttachmentPictureSizes(attachments) {
	return Promise.all(attachments.map(async (attachment) => {
		switch (attachment.type) {
			case 'picture':
				// Don't re-fetch the image again after it
				// has been hidden and then shown again.
				if (attachment.picture.sizeHasBeenFixed) {
					break
				}
				// Not using `Promise.all` here because the URLs
				// aren't guaranteed to be valid.
				// (the original image URL is not always guessed)
				//
				// Load the thumbnail first for better UX.
				let thumbnailSize
				const thumbnailSizeUrl = attachment.picture.sizes[0].url
				try {
					thumbnailSize = await getImageSize(thumbnailSizeUrl)
				} catch (error) {
					console.error(error)
				} finally {
					// Set the flag so that it doesn't re-fetch the image again
					// after it has been hidden and then shown again.
					// Even if fetching the image errored, it just means
					// that it would most likely error again on retry.
					attachment.picture.sizeHasBeenFixed = true
				}
				if (thumbnailSize) {
					attachment.picture = {
						...attachment.picture,
						sizes: [{
							...attachment.picture.sizes[0],
							...thumbnailSize
						}]
					}
					// `fixAttachmentPictureSizes()` gets the correct image sizes
					// but for some reason React doesn't apply the `style` changes to the DOM.
					// It's most likely a bug in React.
					// https://github.com/facebook/react/issues/16357
					// `<PostAttachment/>` does pass the correct `style` to `<ButtonOrLink/>`
					// but the `style` doesn't get applied in the DOM.
					// This is a workaround for that bug: applies the changes to the DOM
					// that aren't applied by React (React will apply the changes on subsequent updates).
					// There also might be several elements corresponding to the attachment
					// in cases when "post thumbnail" is rendered, so using `document.querySelectorAll()`.
					// If the component is unmounted before this code executes,
					// then the `thumbnails` array will be empty.
					const thumbnails = document.querySelectorAll(`.PostAttachmentThumbnail img[src="${thumbnailSizeUrl}"]`)
					for (const thumbnail of thumbnails) {
						const borderWidth = parseInt(getComputedStyle(thumbnail.parentNode).borderWidth)
						thumbnail.parentNode.style.width = thumbnailSize.width + 2 * borderWidth + 'px'
						thumbnail.parentNode.style.height = thumbnailSize.height + 2 * borderWidth + 'px'
					}
					// Not fetching the "original images" because that would be extra bandwidth.
					// Instead assuming the "original image" is big enough.
					const originalSize = {}
					const aspectRatio = thumbnailSize.width / thumbnailSize.height
					if (thumbnailSize.width > thumbnailSize.height) {
						originalSize.width = 1280
						originalSize.height = Math.round(originalSize.width / aspectRatio)
					} else {
						originalSize.height = 1024
						originalSize.width = Math.round(originalSize.height * aspectRatio)
					}
					attachment.picture = {
						...attachment.picture,
						...originalSize
					}
				}
				break
		}
	})).then(() => true)
}

const EXT_REGEXP = /\.[a-z]+$/
export async function getOriginalPictureSizeAndUrl(attachment) {
	const picture = attachment.picture
	// Images from `kohlchan.net` before moving to `lynxchan` in May 2019
	// have incorrect URLs: they don't have the extension part.
	// For example:
	// Exists: https://kohlchan.net/.media/82b9c3a866f6233f1c0253d3eb819ea5-imagepng
	// Not exists: https://kohlchan.net/.media/82b9c3a866f6233f1c0253d3eb819ea5-imagepng.png
	let originalSize
	let originalSizeUrl = picture.url
	try {
		originalSize = await getImageSize(originalSizeUrl)
	} catch (error) {
		console.error(error)
		try {
			// Try an image with no file extension.
			// (kohlchan.net workaround).
			originalSizeUrl = picture.url.replace(EXT_REGEXP, '')
			originalSize = await getImageSize(originalSizeUrl)
		} catch (error) {
			console.error(error)
			// // Original image URL not guessed.
			// // Use thumbnail image as a stub.
			// originalSize = picture.sizes[0]
			// originalSizeUrl = picture.sizes[0].url
		}
	}
	if (originalSize) {
		attachment.picture = {
			...picture,
			...originalSize,
			url: originalSizeUrl
		}
	}
}