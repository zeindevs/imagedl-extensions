export type Task = {
  imageProcessed: number
  images: string[]
  options: any
  next: (value: unknown) => void
}

export type DownloadMessage = {
  type: string
  images: string[]
  options: any
}

export type Message = {
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


export type Image = { 
  url: string,
  width: number,
  height: number,
  alt: string
}