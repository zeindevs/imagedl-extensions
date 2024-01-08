type Task = {
  imageProcessed: number
  images: string[]
  options: Options
  next: () => void
}

type Message = {
  type: string
  allImages: string[]
  linkedImages: string[]
  origin: string
}

export type Options = {
  folder_name: string
  active_tab_origin: string
  new_file_name?: string
}

const unique = (values: any): Array<any> => [...new Set(values)];

const normalizeSlashes = (filename: string) => filename.replace(/\\/g, '/').replace(/\/{2,}/g, '/')

const tasks: Set<Task> = new Set()

const startDownload = (
  message: any,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => {
  if (!(message && message.type === 'downloadImages')) return

  downloadImages({
    imageProcessed: 0,
    images: message.images,
    options: message.options,
    next() {
      this.imageProcessed += 1
      if (this.imageProcessed === this.images.length) {
        tasks.delete(this)
      }
    },
  }).then(sendResponse)

  return true
}

const downloadImages = async (task: Task) => {
  tasks.add(task)

  try {
    for (const image of task.images) {
      await new Promise((resolve) => {
        chrome.downloads.download({ url: image }, (downloadId: number) => {
          if (downloadId == null) {
            if (chrome.runtime.lastError) {
              console.error(`${image}:`, chrome.runtime.lastError)
            }
            task.next()
          }
          resolve(true)
        })
      })
    }
  } catch (err) {
    console.error(err)
  }

  return true
}

const suggestNewFilename = (
  item: { filename: string },
  suggest: (suggestion?: chrome.downloads.DownloadFilenameSuggestion) => void,
) => {
  const task = [...tasks][0]
  if (!task) {
    suggest()
    return
  }

  let newFilename = ''
  if (task.options.folder_name) {
    newFilename += `${task.options.folder_name}/`
  }

  if (task.options.new_file_name) {
    const regex = /(?:\.([^.]+))?$/
    const extension = regex.exec(item.filename)![1]
    const digit = task.images.length.toString().length
    const formatImageNumber = `${task.imageProcessed + 1}`.padStart(digit, '0')
    newFilename += `${task.options.new_file_name}${formatImageNumber}.${extension}`
  } else {
    newFilename += item.filename
  }

  suggest({ filename: normalizeSlashes(newFilename) })

  task.next()
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'options.html' })
  } else if (
    details.reason === 'update' &&
    /^(((0|1)\..*)|(2\.(0|1)(\..*)?))$/.test(details.previousVersion!)
  ) {
    chrome.storage.sync.clear()
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  try {
    chrome.tabs.query({ active: true, lastFocusedWindow: true, windowId: activeInfo.windowId }, ([tab]) => {   
      if (tab?.url && !tab?.url?.includes("chrome://")) {
        chrome.scripting.executeScript({
          target: {
            tabId: tab?.id!,
            allFrames: true
          },
          files: ['image-extractor.js'],
        })
      } else {
        chrome.action.setBadgeText({ text: '0' })
      }
    })
  } catch (err) {
    console.error(err)
  }
});

chrome.tabs.onUpdated.addListener(() => {
  try {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {   
      if (tab?.url && !tab?.url?.includes("chrome://")) {
        chrome.scripting.executeScript({
          target: {
            tabId: tab?.id!,
            allFrames: true
          },
          files: ['image-extractor.js'],
        })
      } else {
        chrome.action.setBadgeText({ text: '0' })
      }
    })
  } catch (err) {
    console.error(err)
  }
});

chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type !== 'sendImages') return
  const images = unique([...message.allImages, ...message.linkedImages])
  chrome.action.setBadgeText({ text: `${images.length}` })
})

chrome.runtime.onMessage.addListener(startDownload)
chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename)
