import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import Home from '@/app/(site)/page'
import {
  BrowserSupportNotice,
  SUPPORT_NOTICE_HEADING,
  SUPPORT_NOTICE_BODY,
} from '@/src/persistence/browser-support'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Home page', () => {
  it('renders the full-page notice when the File System Access API is missing', () => {
    vi.stubGlobal('showOpenFilePicker', undefined)
    render(<Home />)
    expect(
      screen.getByRole('heading', { level: 1, name: SUPPORT_NOTICE_HEADING }),
    ).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_NOTICE_BODY)).toBeInTheDocument()
    // No store-backed UI is initialised — no undo/redo or open controls.
    expect(
      screen.queryByRole('button', { name: /open file/i }),
    ).not.toBeInTheDocument()
  })

  it('initialises the app shell when the File System Access API is available', () => {
    vi.stubGlobal('showOpenFilePicker', vi.fn())
    render(<Home />)
    expect(
      screen.getByRole('button', { name: /open file/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save as/i })).toBeInTheDocument()
  })
})

describe('BrowserSupportNotice', () => {
  it('renders the fixed heading and body copy', () => {
    render(<BrowserSupportNotice />)
    expect(
      screen.getByRole('heading', { level: 1, name: SUPPORT_NOTICE_HEADING }),
    ).toBeInTheDocument()
    expect(screen.getByText(SUPPORT_NOTICE_BODY)).toBeInTheDocument()
  })
})
