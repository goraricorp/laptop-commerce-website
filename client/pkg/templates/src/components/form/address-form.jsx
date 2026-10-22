/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, useEntityForm } from '@/components/form/form-dialog'
import { addressSchema } from '@/schemas/address'
import { useCreateAddress, useDeleteAddress, useUpdateAddress } from '@/services/address'

const emptyAddress = { type: '', tower: '', street: '', district: '', city: '', state: '', country: '' }
const fields = [
  { name: 'type', label: 'Address type', type: 'select', options: [{ value: 'Home', label: 'Home' }, { value: 'Company', label: 'Company' }] },
  { name: 'tower', label: 'Tower' }, { name: 'street', label: 'Street' }, { name: 'district', label: 'District' },
  { name: 'city', label: 'City' }, { name: 'state', label: 'State' }, { name: 'country', label: 'Country' },
]

export function AddressForm({ address, show, onHide, onReload }) {
  const id = entityId(address)
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const defaults = useMemo(() => ({ ...emptyAddress, ...address }), [address])
  const mutation = id ? updateAddress : createAddress
  const form = useEntityForm({
    defaultValues: defaults, schema: addressSchema, resetKey: `${show}-${id}`,
    onSubmit: async (data) => {
      await mutation.mutateAsync(id ? { id, data } : data)
      await onReload?.(); onHide?.()
    },
  })
  const remove = async () => { await deleteAddress.mutateAsync(id); await onReload?.(); onHide?.() }

  return <FormDialog form={form} fields={fields} title={id ? 'Edit address' : 'Create address'} description="Enter the delivery address details." open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteAddress.error} entityId={id} onDelete={remove} isDeleting={deleteAddress.isPending} />
}

export const Address = AddressForm
