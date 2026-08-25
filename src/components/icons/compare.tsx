import type { SVGProps } from 'react'

export function CompareIcon(props: SVGProps<SVGSVGElement>) {
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
        d="M4 3v12m0-4 10-4M8 4l-4 2m6 2-2-3m2 6 2-3m-5 5 3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
