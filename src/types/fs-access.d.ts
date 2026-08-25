interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource): Promise<void>
  truncate(size: number): Promise<void>
  close(): Promise<void>
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}

interface OpenFilePickerOptions {
  multiple?: boolean
  types?: FilePickerAcceptType[]
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerAcceptType[]
}

interface FileSystemFileHandle {
  getFile(): Promise<File>
  createWritable(options?: {
    keepExistingData?: boolean
  }): Promise<FileSystemWritableFileStream>
  queryPermission(options?: {
    mode: 'read' | 'readwrite'
  }): Promise<PermissionState>
  requestPermission(options?: {
    mode: 'read' | 'readwrite'
  }): Promise<PermissionState>
}

interface Window {
  showOpenFilePicker(
    options?: OpenFilePickerOptions,
  ): Promise<[FileSystemFileHandle, ...FileSystemFileHandle[]]>
  showSaveFilePicker(
    options?: SaveFilePickerOptions,
  ): Promise<FileSystemFileHandle>
}

interface DataTransferItem {
  getAsFileSystemHandle(): Promise<FileSystemFileHandle | null>
}
