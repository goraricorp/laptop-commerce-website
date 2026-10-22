/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, listData, useEntityForm } from '@/components/form/form-dialog'
import { colorSchema } from '@/schemas/color'
import { useCreateColor, useDeleteColor, useUpdateColor } from '@/services/color'
import { useProducts } from '@/services/product'

export function ColorForm({ color, show, onHide, onReload }) {
  const id = entityId(color)
  const products = listData(useProducts().data)
  const createItem = useCreateColor(); const updateItem = useUpdateColor(); const deleteItem = useDeleteColor()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ product_id: color?.product_id ?? color?.product?.id ?? '', color: color?.color ?? '' }), [color])
  const fields = useMemo(() => [{ name: 'product_id', label: 'Product', type: 'select', options: products.map((product) => ({ value: product.id ?? product.idproduct, label: product.product_name ?? product.name })) }, { name: 'color', label: 'Color' }], [products])
  const form = useEntityForm({ defaultValues: defaults, schema: colorSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit color' : 'Create color'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
