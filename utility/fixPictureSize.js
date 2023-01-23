import getImageSize from './getImageSize.js'

// In `lynxchan` engine, in `/catalog.json` API response, there're no `files` array.
// There're only two properties — `thumb` and `mime` — and no `width` or `height`, which is a bug.
// https://gitlab.com/catamphetamine/imageboard/-/blob/master/docs/engines/lynxchan-issues.md#no-thread-thumbnail-size-in-catalog-api-response
//
// The bug is not present on `kohlchan.net` (as of 2022) because they're using their own fork of `lynxchan`.
// The bug could be observed at the offical `lynxchan` demo site by looking at the JSON API response:
// https://<website>/<board>/catalog.json.
//
// This function works around that bug by loading the thumbnail image
// of every attachment and then reading the actual `width` and `height`
// of the thumbnails to set the `width` and `height` of the picture attachments.
//
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
					// Set the correct thumbnail size in a picture attachment.
					attachment.picture = {
						...attachment.picture,
						sizes: [{
							...attachment.picture.sizes[0],
							...thumbnailSize
						}]
					}
					// Fix React bug.
					fixReactThumbnailElementSize(thumbnailSize, thumbnailSizeUrl)
					// Set the correct picture size.
					attachment.picture = {
						...attachment.picture,
						...getOriginalPictureSize(thumbnailSize)
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

// These values are somewhat "comfortable" dimensions
// for a "statistically average" image attachment.
// "Comfortable" means "comfortable for viewing on a desktop monitor in a slideshow".
const ORIGINAL_IMAGE_DUMMY_WIDTH = 1280
const ORIGINAL_IMAGE_DUMMY_HEIGHT = 1024

function getOriginalPictureSize(thumbnailSize) {
	// Not fetching the "original images" to get their size because that would be
	// a lot of unneeded bandwidth usage and unnecessary file server load.
	// Instead, just setting the original image size to be a "dummy" one.
	// The rationale is that the user can still enlarge it if the actual image
	// resolution is higher than the "dummy" one.
	// And if the actual image resolution is lower than that then it'll just be
	// "zoomed in" a little bit which is not critical too.
	const aspectRatio = thumbnailSize.width / thumbnailSize.height
	if (aspectRatio > 1) {
		return {
			width: ORIGINAL_IMAGE_DUMMY_WIDTH,
			height: Math.round(ORIGINAL_IMAGE_DUMMY_WIDTH / aspectRatio)
		}
	} else {
		return {
			height: ORIGINAL_IMAGE_DUMMY_HEIGHT,
			width: Math.round(ORIGINAL_IMAGE_DUMMY_HEIGHT * aspectRatio)
		}
	}
}

function fixReactThumbnailElementSize(thumbnailSize, thumbnailSizeUrl) {
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
}