import { FormEvent, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { FaDownload, FaEye } from 'react-icons/fa6'

import './popup.css'
import { DownloadMessage } from './types'
import { cn, removeSpecialCharacters, unique } from './utils/utils'
import viteSvg from '/vite.svg'

const App = () => {
  const [options, setOptions] = useState(localStorage)

  const [selectedAll, setSelectedAll] = useState<boolean>(false)
  const [selected, setSelected] = useState<Array<string>>([])
  const [allImages, setAllImages] = useState<Array<string>>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [downloadProgress, setDownloadProgress] = useState(false)

  const updatePopupData = (message: any) => {
    if (message.type !== 'sendImages') return

    setAllImages((allImages) => unique([...allImages, ...message.allImages]))

    localStorage.active_tab_origin = message.origin

    setLoading(false)
  }

  useEffect(() => {
    Object.assign(localStorage, options)
  }, [options])

  useEffect(() => {
    setLoading(true)

    chrome.runtime.onMessage.addListener(updatePopupData)

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url && !tabs[0]?.url?.includes('chrome://')) {
        chrome.tabs.executeScript(tabs[0].id!, {
          file: 'image-extractor.js',
        })
      } else {
        chrome.browserAction.setBadgeText({ text: '0', tabId: tabs[0].id! })
      }
    })

    return () => chrome.runtime.onMessage.removeListener(updatePopupData)
  }, [])

  const onSelected = (
    e: FormEvent<HTMLInputElement>,
    index: number,
    url: string = '',
  ) => {
    if (e.currentTarget?.checked || selected.indexOf(url) === -1) {
      setSelected((prev) => [...prev, allImages[index]])
    } else {
      setSelected((prev) => [...prev.filter((x) => x != allImages[index])])
    }
  }

  const onSelectedImage = (index: number, url: string = '') => {
    if (selected.indexOf(url) === -1) {
      setSelected((prev) => [...prev, allImages[index]])
    } else {
      setSelected((prev) => [...prev.filter((x) => x != allImages[index])])
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

  const downloadImages = async () => {
    setDownloadProgress(true)
    chrome.runtime.sendMessage<DownloadMessage>(
      {
        type: 'downloadImages',
        images: selected,
        options,
      },
      () => {
        setDownloadProgress(false)
      },
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
      () => {
        setDownloadProgress(false)
      },
    )
  }

  return (
    <div className="bg-zinc-950">
      <header className="sticky top-0 z-10">
        <div className="bg-zinc-950 p-3">
          <div className="flex items-center gap-2">
            <div className="h-18 w-18">
              <img src={viteSvg} alt="Logo" className="w-full h-full" />
            </div>
            <h1 className="text-lg font-bold">Image Downloader</h1>
          </div>
        </div>
        <div className="bg-zinc-900 p-2">
          <button className="flex items-center gap-2" onClick={onSelectedAll}>
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
      {!loading ? (
        <>
          <div className="w-full grid grid-cols-2 p-2 gap-2 max-h-[460px] h-full overflow-y-auto">
            {allImages?.map((url, index) => (
              <div
                key={index}
                className="relative flex items-center justify-center min-w-[150px] min-h-[80px] bg-zinc-900 group"
              >
                <img
                  src={encodeURI(url)}
                  alt={url.split('/')[-1]}
                  className="w-auto object-contain group-hover:brightness-50"
                  onClick={() => onSelectedImage(index, url)}
                />
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 p-1">
                  <div className="">
                    <input
                      type="checkbox"
                      checked={selected.find((x) => x === url) ? true : false}
                      className="h-5 w-5 bg-zinc-800/60 rounded"
                      onChange={(e) => onSelected(e, index, url)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={url}
                      target="_blank"
                      className="flex items-center gap-2 py-1.5 px-2 bg-zinc-800/60 hover:bg-blue-500 rounded"
                    >
                      <FaEye className="h-4 w-4" />
                    </a>
                    <button
                      className="flex items-center gap-2 py-1.5 px-2 bg-zinc-800/60 hover:bg-blue-500 rounded"
                      onClick={() => downloadImage(url)}
                    >
                      <FaDownload className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="w-full grid grid-cols-2 p-2 gap-2 max-h-[460px] h-full overflow-y-auto">
            {[...Array(10)]?.map((_url, index) => (
              <div
                key={index}
                className="min-w-[150px] h-[160px] bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        </>
      )}
      <footer className="bg-zinc-900 p-2 flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Save to sub folder"
          className="py-1.5 px-3 outline-none border border-zinc-800 rounded w-full focus:border-blue-500"
          value={options.folder_name}
          onChange={({ target }) => {
            setOptions((options) => ({
              ...options,
              folder_name: removeSpecialCharacters(target.value),
            }))
          }}
        />
        <button
          className={cn(
            'py-1.5 px-3 text-center border rounded ',
            downloadProgress || allImages.length <= 0
              ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
              : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-800/80 focus:border-blue-500',
          )}
          onClick={downloadImages}
          disabled={downloadProgress || allImages.length <= 0}
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
