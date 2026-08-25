'use client'

import { redirect } from 'next/navigation'
import { useStore } from '@/src/store/store'

export function homeRoute(hasDataset: boolean): '/products' | '/import' {
  return hasDataset ? '/products' : '/import'
}

export default function SiteIndex(): never {
  const { state } = useStore()
  redirect(homeRoute(state.present.dataset !== null))
}
