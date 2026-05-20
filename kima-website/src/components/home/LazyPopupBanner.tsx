'use client'

import dynamic from 'next/dynamic'

export const LazyPopupBanner = dynamic(
  () => import('@/components/home/PopupBanner').then((m) => m.PopupBanner),
  { ssr: false }
)
