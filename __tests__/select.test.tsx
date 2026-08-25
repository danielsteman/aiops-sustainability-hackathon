import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { Select } from '@/src/components/ui/select'
import styles from '@/src/components/ui/select.module.css'

const css = readFileSync(
  join(process.cwd(), 'src', 'components', 'ui', 'select.module.css'),
  'utf8',
)

const sections: Record<string, string> = {}
for (const m of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
  sections[m[1]!] = m[2]!
}

describe('Select', () => {
  it('renders the value plus a trailing region tag plus a chevron', () => {
    const { container } = render(
      <Select
        value={{
          label: 'Electricity, grid average',
          value: 'el_nl',
          region: 'NL',
        }}
      />,
    )
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain(styles.select)
    expect(root.textContent).toContain('Electricity, grid average')
    expect(root.textContent).toContain('NL')
    expect(container.querySelector('svg')).not.toBeNull()
    expect(sections.select).toContain('border: 1px solid var(--colors-divider)')
    expect(sections.select).toContain('border-radius: 4px')
  })

  it('omits the region tag when value has no region', () => {
    const { container } = render(
      <Select value={{ label: 'Sand', value: 'sand' }} />,
    )
    expect(container.firstChild?.textContent).toBe('Sand')
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('renders placeholder when there is no value', () => {
    const { container } = render(<Select placeholder="Select a material" />)
    expect(container.firstChild?.textContent).toContain('Select a material')
  })
})
