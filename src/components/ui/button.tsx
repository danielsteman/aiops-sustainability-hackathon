'use client'

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'disabled'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({
  variant = 'primary',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const resolved = disabled ? 'disabled' : variant
  return (
    <button
      type="button"
      className={`${styles.button} ${styles[resolved]}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
