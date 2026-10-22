/* eslint-disable react/prop-types */
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function VoucherItem({ voucher }) {
  if (!voucher) return null
  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-[10rem_1fr]">
        {voucher.image && <img src={voucher.image} alt="" className="h-full min-h-40 w-full object-cover" />}
        <div>
          <CardHeader>
            <div className="flex items-center justify-between gap-3"><CardTitle>{voucher.discount_name ?? 'Voucher'}</CardTitle><Badge>{voucher.percentage}% off</Badge></div>
            <CardDescription>Maximum discount: {voucher.max ?? voucher.value_discount}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Valid until {voucher.end_date ? new Date(voucher.end_date).toLocaleDateString() : 'further notice'}</CardContent>
        </div>
      </div>
    </Card>
  )
}
