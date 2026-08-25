'use client'

import { Button } from '@/src/components/ui'
import { useNewProductModal } from '@/src/components/layout/new-product-modal'

export function NewProductAction() {
  const { open } = useNewProductModal()
  return (
    <Button onClick={open} type="button">
      New product
    </Button>
  )
}
