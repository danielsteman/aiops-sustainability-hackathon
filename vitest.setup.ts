import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    return { src, alt, props }
  },
}))
