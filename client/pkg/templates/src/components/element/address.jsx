/* eslint-disable react/prop-types */
import { useState } from 'react'
import { PencilIcon } from 'lucide-react'

import { Address } from '@/components/form/address-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AddressItem({ item, onReload }) {
  const [editing, setEditing] = useState(false)
  if (!item) return null

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{item.type || 'Địa chỉ'}</CardTitle>
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label="Sửa địa chỉ"><PencilIcon /></Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>{[item.tower, item.street].filter(Boolean).join(', ')}</p>
          <p>{[item.district, item.city, item.state].filter(Boolean).join(', ')}</p>
          <p>{item.country}</p>
        </CardContent>
      </Card>
      <Address address={item} show={editing} onHide={() => setEditing(false)} onReload={onReload} />
    </>
  )
}
