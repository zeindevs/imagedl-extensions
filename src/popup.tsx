import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'

import { DownloadIcon, EyeIcon } from 'lucide-react'
import favicon from '/favicon.png'
import { rules } from './rules'
import type { DownloadMessage, Image, Options } from './types'
import { cn, removeSpecialCharacters, unique } from './utils/utils'

const App = () => {
	const [options, setOptions] = useState<Options | null>(null)
	const [selectedAll, setSelectedAll] = useState<boolean>(false)
	const [selected, setSelected] = useState<Array<string>>([])
	const [allImages, setAllImages] = useState<Array<string>>([])
	const [images, setImages] = useState<Image[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [downloadProgress, setDownloadProgress] = useState(false)
	const imageRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		chrome.storage.sync.get().then((items) => {
			setOptions(
				(items as Options) || { folder_name: '', active_tab_origin: '' },
			)
		})
	}, [])

	useEffect(() => {
		if (!options) return
		chrome.storage.sync.set(options)
	}, [options])

	useEffect(() => {
		chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
			chrome.action.setBadgeText({
				text: `${allImages.length}`,
				tabId: tab?.id,
			})
		})
	}, [allImages])

	useEffect(() => {
		setLoading(true)

		const updatePopupData = (message: any) => {
			if (message.type !== 'sendImages') return

			setAllImages((allImages) => unique([...allImages, ...message.allImages]))

			setOptions((prev: any) => ({
				...prev,
				active_tab_origin: message.origin,
			}))

			chrome.declarativeNetRequest.updateDynamicRules({
				removeRuleIds: rules(message.origin).map((rule) => rule.id),
				addRules: rules(message.origin),
			})
		}

		chrome.runtime.onMessage.addListener(updatePopupData)

		chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
			if (tab?.url && !tab?.url?.includes('chrome://')) {
				chrome.scripting.executeScript({
					target: {
						tabId: tab.id!,
					},
					files: ['inject.js'],
				})
			} else {
				chrome.action.setBadgeText({ text: '0', tabId: tab?.id })
			}
		})

		return () => chrome.runtime.onMessage.removeListener(updatePopupData)
	}, [])

	const filterImages = useCallback(() => {
		const tmp: Image[] = allImages?.map((url, index) => {
			const image: HTMLImageElement = imageRef.current?.querySelector(
				`img[src="${encodeURI(url)}"]`,
			)!
			return {
				url: url,
				width: image?.naturalWidth,
				height: image?.naturalHeight,
				alt: `${index + 1}`,
			}
		})

		setImages(tmp)
		setLoading(false)
	}, [allImages])

	const onSelected = (
		e: FormEvent<HTMLInputElement>,
		index: number,
		url = '',
	) => {
		if (e.currentTarget?.checked || selected.indexOf(url) === -1) {
			setSelected((prev) => [...prev, allImages[index]])
		} else {
			setSelected((prev) => [...prev.filter((x) => x !== allImages[index])])
		}
	}

	const onSelectedImage = (index: number, url = '') => {
		if (selected.indexOf(url) === -1) {
			setSelected((prev) => [...prev, allImages[index]])
		} else {
			setSelected((prev) => [...prev.filter((x) => x !== allImages[index])])
		}
	}

	const onSelectedAll = () => {
		if (!selectedAll) {
			setSelected([...allImages])
		} else {
			setSelected([])
		}
		setSelectedAll(!selectedAll)
	}

	const onSaveJSON = () => {
		chrome.runtime.sendMessage<DownloadMessage>({
			type: 'saveJSON',
			images: selected,
			options,
		})
	}

	const downloadImages = async () => {
		setDownloadProgress(true)
		chrome.runtime.sendMessage<DownloadMessage>(
			{
				type: 'downloadImages',
				images: selected,
				options,
			},
			() => setDownloadProgress(false),
		)
	}

	const downloadImage = async (url: string) => {
		setDownloadProgress(true)
		chrome.runtime.sendMessage<DownloadMessage>(
			{
				type: 'downloadImages',
				images: [url],
				options,
			},
			() => setDownloadProgress(false),
		)
	}

	return (
		<div className="bg-zinc-950">
			<header className="sticky top-0 z-10">
				<div className="bg-zinc-950 p-3">
					<div className="flex items-center gap-2">
						<div className="h-9 w-9">
							<img
								src={favicon}
								alt="Logo"
								className="h-full w-full"
								crossOrigin="anonymous"
							/>
						</div>
						<h1 className="font-bold text-lg">Image Downloader</h1>
					</div>
				</div>
				<div className="bg-zinc-900 p-2">
					<button
						type="button"
						className="flex items-center gap-2"
						onClick={onSelectedAll}
					>
						<input
							type="checkbox"
							checked={selectedAll}
							onChange={onSelectedAll}
						/>
						<span>
							Select All ({selected.length}/{allImages.length})
						</span>
					</button>
				</div>
			</header>
			<div
				ref={imageRef}
				className="grid hidden h-full max-h-[450px] w-full grid-cols-2 gap-2 overflow-y-auto p-2"
			>
				{allImages?.map((url, index) => (
					<img
						key={index}
						src={encodeURI(url)}
						alt={`${index + 1}`}
						onLoad={filterImages}
					/>
				))}
			</div>
			{!loading && images.length > 0 ? (
				<div className="grid h-full max-h-[450px] w-full grid-cols-2 gap-2 overflow-y-auto p-2">
					{images?.map((image, index) => (
						<div
							key={index}
							className="group relative flex min-h-[80px] min-w-[150px] items-center justify-center bg-zinc-900"
						>
							<button
								type="button"
								onClick={() => onSelectedImage(index, image.url)}
							>
								<img
									src={encodeURI(image.url)}
									alt={image.alt}
									className="w-auto object-contain group-hover:brightness-50"
								/>
							</button>
							<div className="absolute right-0 bottom-0 left-0 z-10 flex flex-col truncate bg-zinc-800/50 p-1 text-xs opacity-0 group-hover:opacity-100">
								<p>
									{image.width}x{image.height}
								</p>
								<p>{image.url}</p>
							</div>
							<div className="absolute top-0 right-0 left-0 flex items-center justify-between gap-2 p-1">
								<div className="">
									<input
										type="checkbox"
										checked={!!selected.find((x) => x === image.url)}
										className="h-5 w-5 rounded bg-zinc-800/60"
										onChange={(e) => onSelected(e, index, image.url)}
									/>
								</div>
								<div className="flex items-center justify-between gap-2">
									<a
										href={image.url}
										target="_blank"
										className="flex items-center gap-2 rounded bg-zinc-800/60 px-2 py-1.5 hover:bg-blue-500"
										rel="noreferrer"
									>
										<EyeIcon className="h-4 w-4" />
									</a>
									<button
										type="button"
										className="flex items-center gap-2 rounded bg-zinc-800/60 px-2 py-1.5 hover:bg-blue-500"
										onClick={() => downloadImage(image.url)}
									>
										<DownloadIcon className="h-4 w-4" />
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="grid h-full max-h-[450px] w-full grid-cols-2 gap-2 overflow-y-auto p-2">
					{[...Array(10)]?.map((_url, index) => (
						<div
							key={index}
							className="h-[160px] min-w-[150px] animate-pulse bg-zinc-800"
						/>
					))}
				</div>
			)}
			<footer className="flex items-center justify-between gap-2 bg-zinc-900 p-2">
				<input
					type="text"
					placeholder="Save to sub folder"
					className="w-full rounded border border-zinc-800 px-3 py-1.5 outline-none focus:border-blue-500"
					value={options?.folder_name}
					onChange={({ target }) => {
						setOptions((options: any) => ({
							...options,
							folder_name: removeSpecialCharacters(target.value),
						}))
					}}
				/>
				<button
					type="button"
					className={cn(
						'whitespace-nowrap rounded border px-3 py-1.5 text-center',
						selected.length <= 0
							? 'border-zinc-800 bg-zinc-900 text-zinc-500'
							: 'border-zinc-700 bg-zinc-800 hover:bg-zinc-800/80 focus:border-blue-500',
					)}
					onClick={onSaveJSON}
					disabled={selected.length <= 0}
				>
					Save as JSON
				</button>
				<button
					type="button"
					className={cn(
						'rounded border px-3 py-1.5 text-center ',
						downloadProgress || selected.length <= 0
							? 'border-zinc-800 bg-zinc-900 text-zinc-500'
							: 'border-zinc-700 bg-zinc-800 hover:bg-zinc-800/80 focus:border-blue-500',
					)}
					onClick={downloadImages}
					disabled={downloadProgress || selected.length <= 0}
				>
					{downloadProgress ? 'Downloading...' : 'Download'}
				</button>
			</footer>
		</div>
	)
}

ReactDOM.createRoot(document.querySelector<HTMLDivElement>('#app')!).render(
	<App />,
)
