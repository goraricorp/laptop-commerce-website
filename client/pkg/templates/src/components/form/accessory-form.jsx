/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, listData, useEntityForm } from '@/components/form/form-dialog'
import { accessorySchema } from '@/schemas/accessory'
import { useCreateAccessory, useDeleteAccessory, useUpdateAccessory } from '@/services/accessory'
import { useProducts } from '@/services/product'

export function AccessoryForm({ accessory, address, show, onHide, onReload }) {
  const item = accessory ?? address
  const id = entityId(item)
  const products = listData(useProducts().data)
  const createItem = useCreateAccessory(); const updateItem = useUpdateAccessory(); const deleteItem = useDeleteAccessory()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ product_id: item?.product_id ?? '', nums_key: item?.nums_key ?? 0, switch_type: item?.switch_type ?? '', connection: item?.connection ?? '', price: item?.price ?? 0 }), [item])
  const fields = useMemo(() => [
    { name: 'product_id', label: 'Product', type: 'select', options: products.map((product) => ({ value: product.id ?? product.idproduct, label: product.product_name ?? product.name })) },
    { name: 'nums_key', label: 'Number of keys', type: 'number', min: 0 }, { name: 'switch_type', label: 'Switch type' },
    { name: 'connection', label: 'Connection' }, { name: 'price', label: 'Price', type: 'number', min: 0 },
  ], [products])
  const form = useEntityForm({ defaultValues: defaults, schema: accessorySchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit accessory' : 'Create accessory'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
