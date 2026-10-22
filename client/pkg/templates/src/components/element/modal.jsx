/* eslint-disable react/prop-types */
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export { AccessoryForm } from '@/components/form/accessory-form'
export { Address, AddressForm } from '@/components/form/address-form'
export { CategoryForm } from '@/components/form/category-form'
export { ColorForm } from '@/components/form/color-form'
export { ConfigurationForm } from '@/components/form/configuration-form'
export { DescriptionForm } from '@/components/form/description-form'
export { NameForm } from '@/components/form/name-form'
export { ProductForm } from '@/components/form/product-form'
export { RatingForm } from '@/components/form/rating-form'
export { StatisticView } from '@/components/form/statistic-view'
export { UserForm } from '@/components/form/legacy-user-form'
export { VoucherForm } from '@/components/form/voucher-form'

const iconByType = { danger: AlertCircleIcon, error: AlertCircleIcon, info: InfoIcon, success: CheckCircle2Icon, warning: TriangleAlertIcon }

export function ConfirmModal({ title = 'Confirm action', message, show, onHide, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', destructive = true }) {
  return <Dialog open={Boolean(show)} onOpenChange={(open) => !open && onHide?.()}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle>{message && <DialogDescription>{message}</DialogDescription>}</DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={onHide}>{cancelText}</Button><Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>{confirmText}</Button></DialogFooter></DialogContent></Dialog>
}

export function NotifyModal({ title = 'Notification', message, type = 'info', show, onHide }) {
  const Icon = iconByType[type] ?? InfoIcon
  return <Dialog open={Boolean(show)} onOpenChange={(open) => !open && onHide?.()}><DialogContent><DialogHeader><div className="flex items-center gap-3"><span className="rounded-full bg-muted p-2"><Icon className="size-5" /></span><DialogTitle>{title}</DialogTitle></div>{message && <DialogDescription>{message}</DialogDescription>}</DialogHeader><DialogFooter><Button type="button" onClick={onHide}>Close</Button></DialogFooter></DialogContent></Dialog>
}
