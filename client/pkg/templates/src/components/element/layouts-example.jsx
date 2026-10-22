/* eslint-disable react/prop-types */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LayoutWrapper({ img, alt, title, explanation }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{explanation}</CardDescription></CardHeader>
      <CardContent>{img && <img src={img} alt={alt ?? title} className="h-auto w-full rounded-md object-cover" />}</CardContent>
    </Card>
  )
}
