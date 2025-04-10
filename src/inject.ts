;(() => {
	const imageUrlRegex =
		/(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*\.(?:bmp|gif|ico|jfif|jpe?g|png|svg|tiff?|webp))(?:\?([^#]*))?(?:#(.*))?/i

	type Message = {
		type: string
		allImages: string[]
		linkedImages: string[]
		origin: string
	}

	const isTruthy = (value: any): boolean => !!value

	const toArray = (values: Set<any> | any): any[] => [...values]

	const unique = (values: Array<any>): any[] => toArray(new Set(values))

	const isImageURL = (url: string): boolean => {
		return url?.indexOf('data:image') === 0 || imageUrlRegex?.test(url)
	}

	const extractURLFromStyle = (style: string): string => {
		return style?.replace(/^.*url\(["']?/, '').replace(/["']?\).*$/, '')
	}

	const relativeUrlToAbsolute = (url: string | undefined): string => {
		return url?.indexOf('/') === 0 ? `${window.location.origin}${url}` : url!
	}

	const extractImagesFromSelector = (selector: string) => {
		return unique(
			toArray(document.querySelectorAll(selector))
				.map(extractImageFromElement)
				.filter(isTruthy)
				.map(relativeUrlToAbsolute),
		)
	}

	const extractImageFromElement = (
		element: HTMLImageElement | HTMLLinkElement | HTMLLinkElement,
	) => {
		if (element instanceof HTMLImageElement) {
			if (element.tagName.toLowerCase() === 'img') {
				const src = element.src
				const hashIndex = src?.indexOf('#')
				return hashIndex >= 0 ? src.substring(0, hashIndex) : src
			}

			if (element.tagName.toLowerCase() === 'image') {
				const src = element.getAttribute('xlink:href')!
				const hashIndex = src?.indexOf('#')
				return hashIndex >= 0 ? src.substring(0, hashIndex) : src
			}
		}

		if (element instanceof HTMLLinkElement) {
			if (element.tagName.toLowerCase() === 'a') {
				const href = element.href
				if (isImageURL(href)) {
					return href
				}
			}
		}

		const backgroundImage = window.getComputedStyle(element).backgroundImage

		if (backgroundImage) {
			const parsedURL = extractURLFromStyle(backgroundImage)
			if (isImageURL(parsedURL)) {
				return parsedURL
			}
		}
	}

	chrome.runtime.sendMessage<Message>({
		type: 'sendImages',
		allImages: extractImagesFromSelector('img, image, a, [class], [style]'),
		linkedImages: extractImagesFromSelector('a'),
		origin: window.location.origin,
	})
})()
