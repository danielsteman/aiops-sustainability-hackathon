import type { SVGProps } from 'react'

export function ProductsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3 5.5 9 2.5l6 3-6 3-6-3Zm0 0V12l6 3 6-3V5.5M9 8.5V15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
