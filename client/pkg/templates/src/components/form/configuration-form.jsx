/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, listData, useEntityForm } from '@/components/form/form-dialog'
import { configurationSchema } from '@/schemas/configuration'
import { useCreateConfiguration, useDeleteConfiguration, useUpdateConfiguration } from '@/services/configuration'
import { useProducts } from '@/services/product'

const emptyConfiguration = { product_id: '', cpu: '', ram: '', gpu: 'Onboard', storage: '', screen: '', resolution: '', price: 0, quantity: 0 }

export function ConfigurationForm({ configuration, show, onHide, onReload }) {
  const id = entityId(configuration)
  const products = listData(useProducts().data)
  const createItem = useCreateConfiguration(); const updateItem = useUpdateConfiguration(); const deleteItem = useDeleteConfiguration()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ ...emptyConfiguration, ...configuration, product_id: configuration?.product_id ?? configuration?.product?.id ?? '' }), [configuration])
  const fields = useMemo(() => [
    { name: 'product_id', label: 'Product', type: 'select', options: products.map((product) => ({ value: product.id ?? product.idproduct, label: product.product_name ?? product.name })) },
    { name: 'cpu', label: 'CPU' }, { name: 'gpu', label: 'GPU' }, { name: 'ram', label: 'RAM (GB)', type: 'number', min: 1 },
    { name: 'storage', label: 'Storage (GB)', type: 'number', min: 1 }, { name: 'screen', label: 'Screen size', type: 'number', min: 1, step: '0.1' },
    { name: 'resolution', label: 'Resolution' }, { name: 'price', label: 'Price', type: 'number', min: 0 }, { name: 'quantity', label: 'Quantity', type: 'number', min: 0 },
  ], [products])
  const form = useEntityForm({ defaultValues: defaults, schema: configurationSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit configuration' : 'Create configuration'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
