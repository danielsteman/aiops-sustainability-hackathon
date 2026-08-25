import type { SVGProps } from 'react'

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3.5 6.5h6a3.5 3.5 0 1 1 0 7H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m6 3.5-2.5 3L6 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
