/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, listData, useEntityForm } from '@/components/form/form-dialog'
import { descriptionSchema } from '@/schemas/description'
import { useCreateDescription, useDeleteDescription, useUpdateDescription } from '@/services/description'
import { useProducts } from '@/services/product'

export function DescriptionForm({ description, show, onHide, onReload }) {
  const id = entityId(description)
  const products = listData(useProducts().data)
  const createItem = useCreateDescription(); const updateItem = useUpdateDescription(); const deleteItem = useDeleteDescription()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ product_id: description?.product_id ?? description?.product?.id ?? '', title_description: description?.title_description ?? '', sub_description: description?.sub_description ?? '', img_description: description?.img_description ?? '' }), [description])
  const fields = useMemo(() => [
    { name: 'product_id', label: 'Product', type: 'select', options: products.map((product) => ({ value: product.id ?? product.idproduct, label: product.product_name ?? product.name })) },
    { name: 'title_description', label: 'Title' }, { name: 'sub_description', label: 'Description', type: 'textarea', className: 'sm:col-span-2', rows: 6 },
    { name: 'img_description', label: 'Image URL', type: 'url', className: 'sm:col-span-2' },
  ], [products])
  const form = useEntityForm({ defaultValues: defaults, schema: descriptionSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit description' : 'Create description'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
