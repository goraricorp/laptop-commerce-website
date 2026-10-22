/* eslint-disable react/prop-types */

import { useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

import { Spinner } from '@/components/element/spinner'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export function LogoutButton({ children = 'Đăng xuất', ...props }) {
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const search = useRouterState({ select: (state) => state.location.search })
  const { logout } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleLogout() {
    setError(null)
    setIsSubmitting(true)
    try {
      await logout()
      const redirect = typeof search?.redirect === 'string' && search.redirect.startsWith('/') && !search.redirect.startsWith('//') ? search.redirect : '/'
      await navigate({ to: redirect, replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng xuất.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-2">
      <Button type="button" disabled={isSubmitting} onClick={() => void handleLogout()} {...props}>
        {isSubmitting ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
        {isSubmitting ? 'Đang đăng xuất…' : children}
      </Button>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
