export {}

declare global {
  interface Window {
    ytmp3?: {
      chooseDirectory: () => Promise<string | null>
      getDefaultDownloads: () => Promise<string>
      convert: (payload: ConvertPayload) => Promise<ConvertResult>
      openFile: (filePath: string) => Promise<FileOpenResult>
      search: (payload: SearchPayload) => Promise<SearchResult>
      minimizeWindow: () => Promise<void>
      toggleMaximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      onProgress: (callback: (event: ConvertProgress) => void) => () => void
    }
  }

  interface SearchPayload {
    query: string
  }

  interface YouTubeSearchItem {
    id: string
    title: string
    url: string
    channel?: string
    duration?: string
    thumbnail?: string
  }

  interface SearchResult {
    ok: boolean
    items?: YouTubeSearchItem[]
    error?: string
  }

  interface ConvertPayload {
    url: string
    outputDir: string
  }

  interface ConvertProgress {
    percent?: number
    text: string
    phase: 'starting' | 'downloading' | 'converting' | 'done' | 'error'
    outputFormat?: 'mp3' | 'audio'
  }

  interface ConvertResult {
    ok: boolean
    filePath?: string
    outputFormat?: 'mp3' | 'audio'
    error?: string
  }

  interface FileOpenResult {
    ok: boolean
    error?: string
  }
}
