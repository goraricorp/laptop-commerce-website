/* eslint-disable react/prop-types */
import { Link } from '@tanstack/react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function OrderExpand({ order }) {
  const details = order?.bill_details ?? []
  const subtotal = details.reduce((sum, detail) => sum + Number(detail.price || 0) * Number(detail.quantity || 0), 0)
  const discount = subtotal * Number(order?.discount?.percentage_discount || 0) / 100
  const total = order?.price ?? subtotal - discount

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4"><div className="flex flex-col gap-2"><CardTitle>Đơn hàng #{order?.id}</CardTitle><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{order?.status ?? 'Đang chờ'}</Badge><span className="text-sm text-muted-foreground">{order?.date ? new Date(order.date).toLocaleString('vi-VN') : ''}</span></div></div><Button nativeButton={false} render={<Link to={`/user/bill?id=${order?.id}`} />}>Chi tiết</Button></CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Table><TableHeader><TableRow><TableHead>Sản phẩm</TableHead><TableHead>Giá</TableHead><TableHead>Số lượng</TableHead><TableHead className="text-right">Thành tiền</TableHead></TableRow></TableHeader><TableBody>{details.map((item, index) => <TableRow key={item.id ?? index}><TableCell><div><p className="font-medium">{[item.brand, item.product].filter(Boolean).join(' ')}</p><p className="max-w-md truncate text-xs text-muted-foreground">{[item.configuration?.cpu, item.configuration?.gpu, item.configuration?.ram && `${item.configuration.ram} GB RAM`, item.configuration?.storage && `${item.configuration.storage} GB`].filter(Boolean).join(' · ')}</p></div></TableCell><TableCell>{money.format(item.price ?? 0)}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{money.format((item.price ?? 0) * (item.quantity ?? 0))}</TableCell></TableRow>)}</TableBody></Table>
        <dl className="ml-auto grid max-w-xs grid-cols-2 gap-2 text-sm"><dt className="text-muted-foreground">Tạm tính</dt><dd className="text-right">{money.format(subtotal)}</dd><dt className="text-muted-foreground">Giảm giá</dt><dd className="text-right">−{money.format(discount)}</dd><dt className="font-semibold">Tổng cộng</dt><dd className="text-right font-semibold">{money.format(total)}</dd></dl>
      </CardContent>
    </Card>
  )
}
