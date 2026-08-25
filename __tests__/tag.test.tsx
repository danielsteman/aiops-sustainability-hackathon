import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render } from '@testing-library/react'
import { Tag } from '@/src/components/ui/tag'
import styles from '@/src/components/ui/tag.module.css'

const css = readFileSync(
  join(process.cwd(), 'src', 'components', 'ui', 'tag.module.css'),
  'utf8',
)

const sections: Record<string, string> = {}
for (const m of css.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
  sections[m[1]!] = m[2]!
}

describe('Tag', () => {
  it('renders region text with divider border and muted neutral text', () => {
    const { container } = render(<Tag variant="region" region="NL" />)
    const el = container.firstChild as HTMLElement
    expect(el.textContent).toBe('NL')
    expect(el.className).toContain(styles.region)
    expect(sections.region).toContain('border: 1px solid var(--colors-divider)')
    expect(sections.region).toContain('color: var(--colors-text-muted)')
    expect(sections.region).toContain('padding: 4px 7px')
  })

  it('region with null renders an em dash, not null or an empty box', () => {
    const { container } = render(<Tag variant="region" region={null} />)
    expect(container.firstChild?.textContent).toBe('—')
  })

  it('region renders em dash when region is undefined', () => {
    const { container } = render(<Tag variant="region" />)
    expect(container.firstChild?.textContent).toBe('—')
  })

  it('stage applies the stage colour as background with white text', () => {
    const { container } = render(
      <Tag variant="stage" stageIndex={1}>
        Processing
      </Tag>,
    )
    const c = container.firstChild as HTMLElement
    expect(c.style.backgroundColor).toBe('rgb(37, 99, 235)')
    expect(c.textContent).toBe('Processing')
    expect(sections.stage).toContain('color: var(--colors-surface)')
    expect(sections.stage).toContain('padding: 6px 10px')
  })

  it('better uses green text, green border and transparent fill with a check icon', () => {
    const { container } = render(<Tag variant="better">Better</Tag>)
    const c = container.firstChild as HTMLElement
    expect(c.className).toContain(styles.better)
    expect(sections.better).toContain('color: var(--colors-primary)')
    expect(sections.better).toContain('border: 1px solid var(--colors-primary)')
    expect(sections.better).toContain('background: transparent')
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('scaling uses a green border with a 15%-alpha green fill', () => {
    const { container } = render(<Tag variant="scaling">Scaling</Tag>)
    const c = container.firstChild as HTMLElement
    expect(c.className).toContain(styles.scaling)
    expect(sections.scaling).toContain(
      'border: 1px solid var(--colors-primary)',
    )
    expect(sections.scaling).toContain('15%')
    expect(container.querySelector('svg')).toBeNull()
  })
})
