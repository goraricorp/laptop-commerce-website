import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import PropTypes from "prop-types";
import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";

import { Button } from "@/components/ui/button";
export function RelationPicker({
  resource,
  value,
  onChange,
  label,
  filters = {},
  nullable = true,
  disabled = false,
  invalid = false,
}) {
  const [q, setQ] = useState(""),
    [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["picker", resource, q, page, filters],
    queryFn: () =>
      caller({
        url: `/admin/pickers/${resource}`,
        query: {
          ...filters,
          q,
          page,
          limit: 20,
        },
      }),
  });
  const selected = useQuery({
    queryKey: ["picker-selected", resource, value, filters],
    queryFn: () =>
      caller({
        url: `/admin/pickers/${resource}/${value}`,
        query: filters,
      }),
    enabled: Boolean(value),
  });
  const inputId = useId();
  const rows = query.data?.items ?? [];
  const current = selected.data?.items?.[0];
  const items =
    current && !rows.some((row) => row.id === value)
      ? [current, ...rows]
      : rows;
  const selectedItem = items.find((row) => row.id === value) ?? null;
  const display = (item) =>
    item ? [item.label, item.sku, item.email].filter(Boolean).join(" · ") : "";
  return (
    <FieldGroup className="gap-3">
      <Field data-disabled={disabled} data-invalid={invalid}>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        <Combobox
          items={items}
          value={selectedItem}
          isItemEqualToValue={(item, selectedValue) =>
            item.id === selectedValue.id
          }
          itemToStringLabel={display}
          itemToStringValue={(item) => item.id}
          onValueChange={(item) => onChange(item?.id ?? null)}
          onInputValueChange={(next, details) => {
            if (
              ["input-change", "input-clear", "clear-press"].includes(
                details.reason,
              )
            ) {
              setQ(next);
              setPage(1);
            }
          }}
          filter={null}
          disabled={disabled}
          required={!nullable}
        >
          <ComboboxInput
            id={inputId}
            aria-label={label}
            aria-invalid={invalid}
            disabled={disabled}
            placeholder={`Tìm ${label.toLowerCase()}…`}
            showClear={nullable}
          />
          <ComboboxContent>
            <ComboboxEmpty>
              {query.isPending ? "Đang tìm…" : "Không có lựa chọn phù hợp."}
            </ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item.id} value={item}>
                  {display(item)}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </Field>
      {query.isPending && <Skeleton className="h-4 w-32" />}
      {(query.isError || selected.isError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {query.error?.message ?? selected.error.message}
          </AlertDescription>
        </Alert>
      )}
      <Pagination
        aria-label={`Phân trang ${label.toLowerCase()}`}
        className="justify-start"
      >
        <PaginationContent>
          <PaginationItem>
            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={page === 1 || disabled || query.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span>Trang {page}</span>
          </PaginationItem>
          <PaginationItem>
            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={
                page * 20 >= (query.data?.total ?? 0) ||
                disabled ||
                query.isFetching
              }
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </FieldGroup>
  );
}
RelationPicker.propTypes = {
  resource: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  filters: PropTypes.object,
  nullable: PropTypes.bool,
  disabled: PropTypes.bool,
  invalid: PropTypes.bool,
};
