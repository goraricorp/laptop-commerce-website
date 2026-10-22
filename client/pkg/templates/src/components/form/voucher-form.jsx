/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, useEntityForm } from '@/components/form/form-dialog'
import { discountSchema } from '@/schemas/discount'
import { useCreateDiscount, useDeleteDiscount, useUpdateDiscount } from '@/services/discount'

const emptyDiscount = { discount_name: '', percentage_discount: 0, value_discount: 0, start_date: '', end_date: '', status: 0 }
const fields = [
  { name: 'discount_name', label: 'Discount name' }, { name: 'percentage_discount', label: 'Percentage', type: 'number', min: 0, max: 100 },
  { name: 'value_discount', label: 'Maximum value', type: 'number', min: 0 }, { name: 'start_date', label: 'Start date', type: 'date' },
  { name: 'end_date', label: 'End date', type: 'date' }, { name: 'status', label: 'Status', type: 'select', options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] },
]

export function VoucherForm({ voucher, show, onHide, onReload }) {
  const id = entityId(voucher)
  const createItem = useCreateDiscount(); const updateItem = useUpdateDiscount(); const deleteItem = useDeleteDiscount()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ ...emptyDiscount, ...voucher, start_date: voucher?.start_date?.slice?.(0, 10) ?? '', end_date: voucher?.end_date?.slice?.(0, 10) ?? '' }), [voucher])
  const form = useEntityForm({ defaultValues: defaults, schema: discountSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit voucher' : 'Create voucher'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
