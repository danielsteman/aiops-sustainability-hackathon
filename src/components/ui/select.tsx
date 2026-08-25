import { Tag } from './tag'
import { ChevronDownIcon } from '@/src/components/icons/chevron-down'
import styles from './select.module.css'

export interface SelectOption {
  label: string
  value: string
  region?: string | null
}

interface SelectProps {
  value?: SelectOption
  placeholder?: string
}

export function Select({ value, placeholder }: SelectProps) {
  return (
    <div className={styles.select}>
      <span className={styles.value}>{value?.label ?? placeholder ?? '—'}</span>
      {value?.region !== undefined && value.region !== null && (
        <Tag variant="region" region={value.region} />
      )}
      <ChevronDownIcon className={styles.chevron} />
    </div>
  )
}
