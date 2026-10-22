/* eslint-disable react-refresh/only-export-components, react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, useEntityForm } from '@/components/form/form-dialog'
import { userSchema } from '@/schemas/user'
import { useCreateUser, useDeleteUser, useUpdateUser } from '@/services/user'

export const userFields = [
  { name: 'firstname', label: 'First name' }, { name: 'lastname', label: 'Last name' },
  { name: 'email', label: 'Email', type: 'email' }, { name: 'phone_number', label: 'Phone number', type: 'tel' },
  { name: 'username', label: 'Username' }, { name: 'birthday', label: 'Birthday', type: 'date' },
  { name: 'avatar', label: 'Avatar URL', type: 'url', className: 'sm:col-span-2' },
]

export function UserForm({ user, show, onHide, onReload }) {
  const id = entityId(user)
  const createItem = useCreateUser(); const updateItem = useUpdateUser(); const deleteItem = useDeleteUser()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ firstname: user?.firstname ?? user?.firstName ?? '', lastname: user?.lastname ?? user?.lastName ?? '', email: user?.email ?? '', phone_number: user?.phone_number ?? user?.phone ?? '', username: user?.username ?? '', birthday: user?.birthday?.slice?.(0, 10) ?? '', avatar: user?.avatar ?? user?.image ?? '' }), [user])
  const form = useEntityForm({ defaultValues: defaults, schema: userSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync(id); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={userFields} title={id ? 'Edit user' : 'Create user'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
