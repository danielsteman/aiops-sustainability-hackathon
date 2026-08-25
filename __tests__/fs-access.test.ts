import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  saveDataset,
  openDataset,
  restoreHandle,
  reconnect,
  extractDroppedFile,
} from '@/src/persistence/fs-access'
import type { Dataset } from '@/src/domain/types'

function loadDataset(): Dataset {
  const raw = readFileSync(
    join(process.cwd(), 'docs', 'sample-data.json'),
    'utf8',
  )
  return JSON.parse(raw) as Dataset
}

function makeWritable() {
  const calls: string[] = []
  const writable = {
    write: vi.fn(async (data: string) => {
      calls.push(data)
    }),
    truncate: vi.fn(async () => {
      calls.push('truncate')
    }),
    close: vi.fn(async () => {}),
  }
  return {
    writable: writable as unknown as FileSystemWritableFileStream,
    calls,
    spies: writable,
  }
}

function makeHandle(
  overrides: Partial<FileSystemFileHandle> = {},
): FileSystemFileHandle {
  return { ...overrides } as FileSystemFileHandle
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('saveDataset', () => {
  it('truncates before writing and closes the stream', async () => {
    const { writable, calls, spies } = makeWritable()
    const handle = makeHandle({ createWritable: vi.fn(async () => writable) })
    const dataset = loadDataset()

    await saveDataset(handle, dataset)

    expect(calls[0]).toBe('truncate')
    const written = calls.find((c) => c !== 'truncate')
    expect(written).toContain('\n  "schema_version"')
    expect(written?.endsWith('\n')).toBe(true)
    expect(spies.close).toHaveBeenCalled()
  })
})

describe('openDataset', () => {
  it('restricts the picker to JSON and returns handle + text', async () => {
    const file = new File(['{"schema_version":"1.0"}'], 'data.json')
    const handle = makeHandle({ getFile: vi.fn(async () => file) })
    const picker = vi.fn(async () => [handle])
    vi.stubGlobal('showOpenFilePicker', picker)

    const result = await openDataset()

    expect(picker).toHaveBeenCalledWith(
      expect.objectContaining({
        types: [
          {
            description: 'LCA dataset',
            accept: { 'application/json': ['.json'] },
          },
        ],
      }),
    )
    expect(result.handle).toBe(handle)
    expect(result.text).toBe('{"schema_version":"1.0"}')
    vi.unstubAllGlobals()
  })
})

describe('restoreHandle', () => {
  it('returns granted with text when permission is granted', async () => {
    const file = new File(['{"a":1}'], 'data.json')
    const handle = makeHandle({
      queryPermission: vi.fn(async () => 'granted' as const),
      getFile: vi.fn(async () => file),
    })
    const result = await restoreHandle(handle)
    expect(result.status).toBe('granted')
    if (result.status === 'granted') expect(result.saved.text).toBe('{"a":1}')
  })

  it('returns prompt without auto-requesting when permission is prompt', async () => {
    const handle = makeHandle({
      queryPermission: vi.fn(async () => 'prompt' as const),
    })
    const result = await restoreHandle(handle)
    expect(result.status).toBe('prompt')
    expect(handle.requestPermission).toBeUndefined()
  })
})

describe('reconnect', () => {
  it('grants access after requestPermission when the user allows it', async () => {
    const file = new File(['{"a":1}'], 'data.json')
    const handle = makeHandle({
      requestPermission: vi.fn(async () => 'granted' as const),
      getFile: vi.fn(async () => file),
    })
    const result = await reconnect(handle)
    expect(result.status).toBe('granted')
    if (result.status === 'granted') expect(result.saved.text).toBe('{"a":1}')
  })

  it('returns prompt when the user denies permission', async () => {
    const handle = makeHandle({
      requestPermission: vi.fn(async () => 'denied' as const),
    })
    const result = await reconnect(handle)
    expect(result.status).toBe('prompt')
  })
})

describe('extractDroppedFile', () => {
  function makeDataTransfer(items: DataTransferItem[]): DataTransfer {
    return { items } as unknown as DataTransfer
  }

  it('returns a ready dropped file with a writable handle', async () => {
    const file = new File(['{"a":1}'], 'data.json')
    const handle = makeHandle({})
    const dt = makeDataTransfer([makeDataTransferItem('file', { handle, file })])
    const result = await extractDroppedFile(dt)
    expect(result?.status).toBe('ready')
    if (result?.status === 'ready') {
      expect(result.handle).toBe(handle)
      expect(result.text).toBe('{"a":1}')
    }
  })

  it('returns a no-handle result when the browser refuses a handle', async () => {
    const file = new File(['{"a":1}'], 'data.json')
    const dt = makeDataTransfer([makeDataTransferItem('file', { handle: null, file })])
    const result = await extractDroppedFile(dt)
    expect(result?.status).toBe('no-handle')
    if (result?.status === 'no-handle') expect(result.text).toBe('{"a":1}')
  })

  it('returns null when the drop contains no files', async () => {
    const dt = makeDataTransfer([makeDataTransferItem('string', { handle: null })])
    const result = await extractDroppedFile(dt)
    expect(result).toBeNull()
  })
})

function makeDataTransferItem(
  kind: string,
  opts: { handle: FileSystemFileHandle | null; file?: File },
): DataTransferItem {
  return {
    kind,
    getAsFile: () => opts.file ?? new File(['x'], 'x'),
    getAsFileSystemHandle: async () => opts.handle,
  } as unknown as DataTransferItem
}
