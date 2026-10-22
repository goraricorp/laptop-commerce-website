import { useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'

import { Cart } from '@/components/element/cart'
import { Customizer } from '@/components/element/customizer'
import { Notification } from '@/components/element/notification'
import { Shortcut } from '@/components/element/shortcut'
import { Button } from '@/components/ui/button'

export function NavElement() {
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-2">
      <Button aria-label="Tìm kiếm" className="size-9 rounded-md" onClick={() => navigate({ to: '/product/$type', params: { type: 'all' } })} size="icon" variant="ghost"><Search className="size-4" /></Button>
      <Cart />
      <Customizer />
      <Notification />
      <Shortcut />
    </div>
  )
}
