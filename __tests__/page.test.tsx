import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Home from '@/app/(site)/page'

describe('Home page', () => {
  it('renders the page heading', () => {
    render(<Home />)
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'AIOps Sustainability Hackathon',
      }),
    ).toBeInTheDocument()
  })

  it('increments the counter when the button is clicked', () => {
    render(<Home />)
    const button = screen.getByRole('button', { name: /clicked 0 times/i })
    fireEvent.click(button)
    expect(
      screen.getByRole('button', { name: /clicked 1 time/i }),
    ).toBeInTheDocument()
  })
})