/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, useEntityForm } from '@/components/form/form-dialog'
import { userSchema } from '@/schemas/user'
import { useUpdateUser } from '@/services/user'
import { userFields } from '@/components/form/legacy-user-form'

export function NameForm({ name, show, onHide, onReload }) {
  const id = entityId(name)
  const updateItem = useUpdateUser()
  const defaults = useMemo(() => ({ firstname: name?.firstname ?? '', lastname: name?.lastname ?? '', email: name?.email ?? '', phone_number: name?.phone_number ?? '', username: name?.username ?? '', birthday: name?.birthday?.slice?.(0, 10) ?? '', avatar: name?.avatar ?? '' }), [name])
  const form = useEntityForm({ defaultValues: defaults, schema: userSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await updateItem.mutateAsync({ id, data }); await onReload?.(); onHide?.() } })
  return <FormDialog form={form} fields={userFields} title="Edit account name" open={show} onOpenChange={(open) => !open && onHide?.()} error={updateItem.error} />
}
