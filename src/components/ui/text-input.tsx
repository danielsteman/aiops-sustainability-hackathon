import type { InputHTMLAttributes } from 'react'
import styles from './text-input.module.css'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  numeric?: boolean
}

export function TextInput({
  error,
  numeric,
  className,
  ...props
}: TextInputProps) {
  const stateClass = error ? styles.error : styles.default
  const classes = [
    styles.input,
    stateClass,
    numeric ? styles.numeric : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <label className={styles.field}>
      <input
        className={classes}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <span className={styles.helper}>{error}</span>}
    </label>
  )
}
