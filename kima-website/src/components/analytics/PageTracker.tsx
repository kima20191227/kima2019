'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
    })

    const send = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }))
        return
      }

      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    const idle = window.requestIdleCallback?.(send, { timeout: 2000 })
    if (idle === undefined) {
      const timeout = window.setTimeout(send, 1000)
      return () => window.clearTimeout(timeout)
    }

    return () => window.cancelIdleCallback?.(idle)
  }, [pathname])

  return null
}
