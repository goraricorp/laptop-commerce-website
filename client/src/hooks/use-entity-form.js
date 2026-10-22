import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
export function useEntityForm({ defaultValues, schema, onSubmit, resetKey }) {
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => onSubmit(schema.parse(value)),
  });
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form, resetKey]);
  return form;
}
export function entityId(entity) {
  return (
    entity?.id ??
    entity?.idaddress ??
    entity?.idaccessory ??
    entity?.idcategory ??
    entity?.idcolor ??
    entity?.idconfiguration ??
    entity?.iddescription ??
    entity?.idproduct ??
    entity?.idrating ??
    entity?.iddiscount ??
    entity?.idaccount
  );
}
export function listData(result) {
  const data = result?.data ?? result ?? [];
  return Array.isArray(data) ? data : [];
}
