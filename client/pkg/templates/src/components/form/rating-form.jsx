/* eslint-disable react/prop-types */
import { useMemo } from 'react'

import { entityId, FormDialog, useEntityForm } from '@/components/form/form-dialog'
import { ratingSchema } from '@/schemas/rating'
import { useCreateRating, useDeleteRating, useUpdateRating } from '@/services/rating'

export function RatingForm({ rate, prod, show, onHide, onReload }) {
  const id = entityId(rate)
  const productId = rate?.product_id ?? prod?.id ?? prod?.idproduct ?? ''
  const createItem = useCreateRating(); const updateItem = useUpdateRating(); const deleteItem = useDeleteRating()
  const mutation = id ? updateItem : createItem
  const defaults = useMemo(() => ({ product_id: productId, score: rate?.score ?? 5, comment: rate?.comment ?? '', rating_date: rate?.rating_date ?? null }), [productId, rate])
  const fields = [
    { name: 'score', label: 'Score', type: 'number', min: 1, max: 5 },
    { name: 'comment', label: 'Comment', type: 'textarea', className: 'sm:col-span-2', rows: 5 },
  ]
  const form = useEntityForm({ defaultValues: defaults, schema: ratingSchema, resetKey: `${show}-${id}`, onSubmit: async (data) => { await mutation.mutateAsync(id ? { id, data } : data); await onReload?.(); onHide?.() } })
  const remove = async () => { await deleteItem.mutateAsync({ id, productId }); await onReload?.(); onHide?.() }
  return <FormDialog form={form} fields={fields} title={id ? 'Edit rating' : 'Create rating'} open={show} onOpenChange={(open) => !open && onHide?.()} error={mutation.error ?? deleteItem.error} entityId={id} onDelete={remove} isDeleting={deleteItem.isPending} />
}
