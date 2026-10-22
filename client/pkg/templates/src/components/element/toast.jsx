/* eslint-disable react/prop-types */
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toast as ShadcnToast, ToastClose, ToastContent, ToastDescription, ToastTitle, toast } from '@/components/ui/toast'

export function Toast({ title = 'Notification', message, open = true, type = 'info' }) {
  if (!open) return null
  return <ShadcnToast><ToastContent><div className="min-w-0 flex-1"><ToastTitle>{title}</ToastTitle><ToastDescription>{message ?? type}</ToastDescription></div><ToastClose /></ToastContent></ShadcnToast>
}

export function ToastBox({ title = 'Toast', type = 'info', position, message }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><Button type="button" onClick={() => toast.add({ title, description: message, type, position })}>Show notification</Button></CardContent></Card>
}

export function ToastDemo() {
  const [count, setCount] = useState(0)
  return <Button type="button" onClick={() => { const next = count + 1; setCount(next); toast.add({ title: `Notification ${next}`, description: 'This notification uses the Shadcn toast manager.', type: 'info' }) }}>Show toast</Button>
}
