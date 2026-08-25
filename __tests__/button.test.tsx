import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/src/components/ui/button'
import styles from '@/src/components/ui/button.module.css'

const cssPath = join(
  process.cwd(),
  'src',
  'components',
  'ui',
  'button.module.css',
)
const css = readFileSync(cssPath, 'utf8')

const sections: Record<string, string> = {}
for (const m of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
  sections[m[1]!] = m[2]!
}

function block(name: string): string {
  return sections[name] ?? ''
}

describe('Button', () => {
  it.each(['primary', 'secondary', 'ghost', 'disabled'] as const)(
    'renders %s variant with the token-driven border and background',
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>)
      const btn = screen.getByRole('button', { name: variant })
      expect(btn.className).toContain(styles.button)
      expect(btn.className).toContain(styles[variant])
    },
  )

  it('primary uses primary fill, surface text, primary border and hover token', () => {
    const b = block('primary')
    expect(b).toContain('background: var(--colors-primary)')
    expect(b).toContain('color: var(--colors-surface)')
    expect(b).toContain('border: 1px solid var(--colors-primary)')
    expect(b).toContain('padding: 12px 25px')
    expect(css).toContain('.primary:hover')
    expect(css).toContain('var(--colors-primary-hover)')
  })

  it('secondary uses surface fill, text border and text colour', () => {
    const b = block('secondary')
    expect(b).toContain('background: var(--colors-surface)')
    expect(b).toContain('border: 1px solid var(--colors-text)')
    expect(b).toContain('color: var(--colors-text)')
  })

  it('ghost is transparent with a dashed divider border and neutral text', () => {
    const b = block('ghost')
    expect(b).toContain('background: transparent')
    expect(b).toContain('border: 1px dashed var(--colors-divider)')
    expect(b).toContain('color: var(--colors-text-muted)')
  })

  it('disabled uses disabled fill, not-allowed cursor and motion transition', () => {
    const b = block('disabled')
    expect(b).toContain('background: var(--colors-disabled)')
    expect(b).toContain('cursor: not-allowed')
    expect(block('button')).toContain('transition: var(--motion-base)')
  })

  it('disabled buttons do not fire onClick', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Disabled' })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('maps the disabled prop onto the disabled variant', () => {
    render(<Button disabled>X</Button>)
    const btn = screen.getByRole('button', { name: 'X' })
    expect(btn.className).toContain(styles.disabled)
  })
})
