import { useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'

export function Scroll() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
