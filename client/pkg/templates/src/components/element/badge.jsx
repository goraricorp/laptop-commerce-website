/* eslint-disable react/prop-types */
import { Badge } from '@/components/ui/badge'

export function CategoryBadge({ cate, icon, color }) {
  return (
    <Badge variant="outline" className="gap-1.5" style={color ? { borderColor: color, color } : undefined}>
      {icon && <i className={icon} aria-hidden="true" />}{cate}
    </Badge>
  )
}
