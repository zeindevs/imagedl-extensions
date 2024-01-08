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