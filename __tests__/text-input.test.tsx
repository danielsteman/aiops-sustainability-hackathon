import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { TextInput } from '@/src/components/ui/text-input'
import styles from '@/src/components/ui/text-input.module.css'

const css = readFileSync(
  join(process.cwd(), 'src', 'components', 'ui', 'text-input.module.css'),
  'utf8',
)

const sections: Record<string, string> = {}
for (const m of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
  sections[m[1]!] = m[2]!
}

describe('TextInput', () => {
  it('default state uses a divider border', () => {
    const { container } = render(<TextInput aria-label="name" />)
    const input = container.querySelector('input')!
    expect(input.className).toContain(styles.input)
    expect(sections.input).toContain('border: 1px solid var(--colors-divider)')
  })

  it('hover state uses a neutral border', () => {
    expect(css).toContain('.input:hover')
    expect(css).toContain('border-color: var(--colors-text-muted)')
  })

  it('focus state uses a green border', () => {
    expect(css).toContain('.input:focus')
    expect(css).toContain('border-color: var(--colors-primary)')
  })

  it('error state uses a red border and shows red 14px helper text', () => {
    const { container } = render(
      <TextInput aria-label="name" error="Required" />,
    )
    const input = container.querySelector('input')!
    expect(input.className).toContain(styles.error)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const helper = container.querySelector('span')!
    expect(helper.textContent).toBe('Required')
    expect(sections.error).toContain('border-color: var(--colors-error)')
    expect(sections.helper).toContain('color: var(--colors-error)')
    expect(sections.helper).toContain('font-size: 14px')
  })

  it('numeric variant right-aligns and applies tabular figures', () => {
    const { container } = render(<TextInput aria-label="num" numeric />)
    const input = container.querySelector('input')!
    expect(input.className).toContain(styles.numeric)
    expect(sections.numeric).toContain('text-align: right')
    expect(sections.numeric).toContain('font-variant-numeric: tabular-nums')
  })
})
