/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, listData, useEntityForm } from '@/components/form/form-dialog'
import { productSchema } from '@/schemas/product'
import { useCategories } from '@/services/category'
import { useCreateProduct, useDeleteProduct, useUpdateProduct } from '@/services/product'

const emptyProduct = { category_id: '', product_name: '', brand: '', product_image: '', status: 1, type: 'office' }

export function ProductForm({ product, show, onHide, onReload }) {
  const id = entityId(product)
  const categories = listData(useCategories().data)
  const createItem = useCreateProduct(); const updateItem = useUpdateProduct(); const deleteItem = useDeleteProduct()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ ...emptyProduct, ...product, category_id: product?.category_id ?? product?.category?.id ?? product?.idcategory ?? '' }), [product])
  const fields = useMemo(() => [
    { name: 'category_id', label: 'Category', type: 'select', options: categories.map((category) => ({ value: category.id ?? category.idcategory, label: category.category_name ?? category.name })) },
    { name: 'product_name', label: 'Product name' }, { name: 'brand', label: 'Brand' }, { name: 'product_image', label: 'Image URL', type: 'url' },
    { name: 'status', label: 'Status', type: 'select', options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] },
    { name: 'type', label: 'Type', type: 'select', options: [{ value: 'office', label: 'Office' }, { value: 'gaming', label: 'Gaming' }, { value: 'workstation', label: 'Workstation' }] },
  ], [categories])
  const form = useEntityForm({ defaultValues: defaults, schema: productSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit product' : 'Create product'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
