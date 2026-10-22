/* eslint-disable react/prop-types */
import { useState } from 'react'
import { ShieldCheckIcon } from 'lucide-react'

import { Spinner } from '@/components/element/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { request } from '@/services/http'

export function ReCaptchaComponent({ token, onSuccess, onError }) {
  const [status, setStatus] = useState('idle')
  const verify = async () => {
    if (!token) return
    setStatus('loading')
    try {
      const response = await request('/recaptcha/verify-captcha', { method: 'POST', body: { captcha: token } })
      if (!response.success) throw new Error(response.message ?? 'Verification failed')
      setStatus('success')
      onSuccess?.(response)
    } catch (error) {
      setStatus('error')
      onError?.(error.data ?? { message: error.message })
    }
  }
  return <Card><CardContent className="flex flex-col items-center gap-4 p-6"><ShieldCheckIcon className="size-8 text-primary" /><Button type="button" onClick={verify} disabled={!token || status === 'loading'}>{status === 'loading' ? <Spinner className="size-4" /> : null}{status === 'loading' ? 'Đang xác minh…' : 'Xác minh captcha'}</Button>{status === 'success' && <Alert><AlertDescription>Xác minh thành công.</AlertDescription></Alert>}{status === 'error' && <Alert variant="destructive"><AlertDescription>Xác minh thất bại.</AlertDescription></Alert>}</CardContent></Card>
}
