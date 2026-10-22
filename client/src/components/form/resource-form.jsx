import { TableIdentity } from "@/components/element/table-identity";
("use client");

import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Pencil, Plus, RefreshCw } from "lucide-react";
import {
  DataTable,
  DataTableColumnHeader,
} from "@/components/custom/data-table";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { adminResourceLabels } from "@/config/admin-resources";
import { buildResourceFields } from "@/config/resource-form";
import {
  resourceTableKeys,
  productBrandIdentity,
  tableIdentityKey,
  tableIdentity,
  tableRelations,
  tableValue,
} from "@/lib/utils/admin-table";
import { useTableRelations } from "@/hooks/use-table-relations";
const emptyRows = [];
function defaultResourceId(row) {
  return row.id;
}
function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
    return new Date(value).toLocaleString("vi-VN");
  return String(value);
}
export function ResourceForm({
  title,
  description,
  services,
  schemas,
  resources,
  resourceIds = {},
  resourceLabels = {},
  readOnlyResources = [],
  createOnlyResources = [],
  disableCreateResources = [],
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const availableResources =
    resources?.filter((name) => services[name] && schemas[name]) ??
    Object.keys(services).filter((name) => schemas[name]);
  const [resource, setResource] = useState(availableResources[0]);
  const resourceService = services[resource];
  const resourceSchema = schemas[resource];
  const [page, setPage] = useState(1);
  const list = resourceService.getMany({
    page,
    limit: 50,
  });
  const fields = useMemo(
    () => buildResourceFields(resourceSchema),
    [resourceSchema],
  );
  const sourceRows = list.data?.items;
  const rows = sourceRows ?? emptyRows;
  const visibleKeys = useMemo(
    () => resourceTableKeys(rows, resource),
    [rows, resource],
  );
  const primaryKey = tableIdentityKey(resource, rows);
  const relations = useTableRelations(rows, visibleKeys);
  // Refresh accessor caches when asynchronous names arrive (sorting/search).
  const tableRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        __displayValues: Object.fromEntries(
          visibleKeys.map((key) => [
            key,
            key === primaryKey
              ? Object.values(tableIdentity(resource, row, relations.labels))
                  .slice(0, 2)
                  .join(" ")
              : tableValue(row, key, relations.labels),
          ]),
        ),
      })),
    [rows, visibleKeys, relations.labels, resource, primaryKey],
  );
  const isReadOnly = readOnlyResources.includes(resource);
  const isCreateOnly = createOnlyResources.includes(resource);
  const isCreateDisabled = disableCreateResources.includes(resource);
  function changeResource(nextResource) {
    setResource(nextResource);
    setPage(1);
  }
  function createRecord() {
    void navigate({
      search:
        availableResources.length > 1
          ? {
              resource,
            }
          : {},
      to: `${pathname.replace(/\/$/, "")}/create`,
    });
  }
  function editRecord(row) {
    const id = (resourceIds[resource] ?? defaultResourceId)(row);
    void navigate({
      search:
        availableResources.length > 1
          ? {
              resource,
            }
          : {},
      to: `${pathname.replace(/\/$/, "")}/edit/${encodeURIComponent(String(id))}`,
    });
  }
  const requestError = list.error;
  const label =
    resourceLabels[resource] ?? adminResourceLabels[resource] ?? resource;
  const columns = [
    ...visibleKeys.map((column) => ({
      id: column,
      accessorFn: (row) => row.__displayValues[column],
      header: ({ column: tableColumn }) => (
        <DataTableColumnHeader
          column={tableColumn}
          title={
            (resource === "products" && column === "brandId"
              ? "Thương hiệu / Loại sản phẩm"
              : ["isActive", "banned"].includes(column)
                ? "Trạng thái"
                : column === "__identity"
                  ? "Thông tin"
                  : fields.find((field) => field.name === column)?.label) ??
            (tableRelations[column]
              ? adminResourceLabels[tableRelations[column]]
              : column)
          }
        />
      ),
      cell: ({ row }) => {
        if (resource === "products" && column === "brandId")
          return (
            <TableIdentity
              {...productBrandIdentity(
                row.original,
                relations.labels,
                relations.items.brands,
              )}
            />
          );
        if (column === primaryKey)
          return (
            <TableIdentity
              {...tableIdentity(resource, row.original, relations.labels)}
            />
          );
        const value = tableValue(row.original, column, relations.labels);
        if (column === "banned")
          return (
            <Badge variant={value ? "secondary" : "default"}>
              {value ? "Ngừng hoạt động" : "Đang hoạt động"}
            </Badge>
          );
        if (column === "isActive")
          return (
            <Badge variant={value ? "default" : "secondary"}>
              {value ? "Đang hoạt động" : "Ngừng hoạt động"}
            </Badge>
          );
        if (column === "status") {
          const labels = {
            active: "Đang hoạt động",
            inactive: "Ngừng hoạt động",
            draft: "Bản nháp",
            archived: "Đã lưu trữ",
            discontinued: "Ngừng kinh doanh",
            out_of_stock: "Hết hàng",
          };
          return (
            <Badge variant={value === "active" ? "default" : "secondary"}>
              {labels[value] ?? displayValue(value)}
            </Badge>
          );
        }
        return (
          <span className="block max-w-64 truncate">
            {tableRelations[column] &&
            row.original[column] &&
            relations.isPending
              ? "Đang tải tên…"
              : displayValue(value)}
          </span>
        );
      },
    })),
    {
      id: "actions",
      enableSorting: false,
      header: () => <span className="block text-right">Thao tác</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            aria-label={`Sửa ${label}`}
            disabled={isReadOnly || isCreateOnly}
            onClick={(event) => {
              event.stopPropagation();
              editRecord(row.original);
            }}
            size="icon"
            variant="ghost"
          >
            <Pencil data-icon="inline-start" />
          </Button>
        </div>
      ),
    },
  ];
  const searchColumn =
    visibleKeys.find((column) =>
      ["name", "email", "code", "title", "productName", "subject"].includes(
        column,
      ),
    ) ?? visibleKeys[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          {availableResources.length > 1 ? (
            <NativeSelect
              className="min-w-52"
              value={resource}
              onChange={(event) => changeResource(event.target.value)}
            >
              {availableResources.map((name) => (
                <NativeSelectOption key={name} value={name}>
                  {resourceLabels[name] ?? adminResourceLabels[name] ?? name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          ) : (
            <h3 className="text-base font-semibold">{label}</h3>
          )}
          <Button
            disabled={list.isFetching}
            onClick={() => void list.refetch()}
            type="button"
            variant="outline"
          >
            {list.isFetching ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCw data-icon="inline-start" />
            )}
            Làm mới
          </Button>
          {!isReadOnly && !isCreateDisabled ? (
            <Button className="sm:ml-auto" onClick={createRecord} type="button">
              <Plus data-icon="inline-start" />
              Thêm mới
            </Button>
          ) : (
            <Badge className="sm:ml-auto" variant="secondary">
              {isReadOnly ? "Chỉ đọc" : "Không tạo trực tiếp"}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground">
            {list.data?.total ?? 0} bản ghi
          </span>
        </div>

        {requestError || relations.error ? (
          <Alert variant="destructive">
            <AlertTitle>Yêu cầu thất bại</AlertTitle>
            <AlertDescription>
              {requestError?.message ??
                `Không tải được tên bản ghi liên quan: ${relations.error.message}`}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            disabled={page <= 1 || list.isFetching}
            onClick={() => setPage((value) => value - 1)}
          >
            Trang dữ liệu trước
          </Button>
          <span>
            Trang {page} /{" "}
            {Math.max(1, Math.ceil((list.data?.total ?? 0) / 50))}
          </span>
          <Button
            variant="outline"
            disabled={page * 50 >= (list.data?.total ?? 0) || list.isFetching}
            onClick={() => setPage((value) => value + 1)}
          >
            Trang dữ liệu sau
          </Button>
        </div>
        <DataTable
          key={`${resource}:${page}`}
          columns={columns}
          data={tableRows}
          emptyMessage="Không có dữ liệu"
          getRowId={(row) =>
            String((resourceIds[resource] ?? defaultResourceId)(row))
          }
          initialPageSize={25}
          pageSizeOptions={[10, 25, 50, 100]}
          search={
            searchColumn
              ? {
                  column: searchColumn,
                  placeholder: `Tìm ${label.toLocaleLowerCase("vi")}…`,
                }
              : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
ResourceForm.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  services: PropTypes.object,
  schemas: PropTypes.object,
  resources: PropTypes.array,
  resourceIds: PropTypes.node,
  resourceLabels: PropTypes.node,
  readOnlyResources: PropTypes.node,
  createOnlyResources: PropTypes.node,
  disableCreateResources: PropTypes.node,
};
