/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, useEntityForm } from '@/components/form/form-dialog'
import { categorySchema } from '@/schemas/category'
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from '@/services/category'

const emptyCategory = { category_name: '', category_description: '', category_image: '' }
const fields = [
  { name: 'category_name', label: 'Category name' },
  { name: 'category_description', label: 'Description', type: 'textarea', className: 'sm:col-span-2' },
  { name: 'category_image', label: 'Image URL', type: 'url', className: 'sm:col-span-2' },
]

export function CategoryForm({ category, show, onHide, onReload }) {
  const id = entityId(category)
  const createItem = useCreateCategory(); const updateItem = useUpdateCategory(); const deleteItem = useDeleteCategory()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ ...emptyCategory, ...category }), [category])
  const form = useEntityForm({ defaultValues: defaults, schema: categorySchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit category' : 'Create category'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
