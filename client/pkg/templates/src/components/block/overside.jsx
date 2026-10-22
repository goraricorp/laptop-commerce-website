import { Link } from '@tanstack/react-router'
import { MessageCircleMore } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function Overside() {
  return (
    <Button className="fixed bottom-5 right-5 z-40 rounded-full shadow-lg" nativeButton={false} render={<Link to="/chatbot" />} size="icon-lg">
      <MessageCircleMore /><span className="sr-only">Mở trợ lý mua sắm</span>
    </Button>
  )
}
