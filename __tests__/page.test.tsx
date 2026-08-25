import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import {
  BrowserSupportNotice,
  SUPPORT_NOTICE_HEADING,
  SUPPORT_NOTICE_BODY,
} from '@/src/persistence/browser-support'

const redirect = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ redirect }))

import Home from '@/app/(site)/page'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Home page', () => {
  it('sends the bare / route to the import step', () => {
    Home()
    expect(redirect).toHaveBeenCalledWith('/import')
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
