"use client";

import type { ReactNode } from "react";
import type { ColumnDef, RowData, Table } from "@tanstack/react-table";
import {
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
});
export type DataTableColumn<TData extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  TData,
  unknown
>;
type DataTableProps<TData extends RowData> = {
  columns: ReadonlyArray<DataTableColumn<TData>>;
  data: ReadonlyArray<TData>;
  search?: {
    column: string;
    placeholder?: string;
  };
  hidePagination?: boolean;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  className?: string;
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: TData) => void;
  toolbar?: ReactNode;
};
type TableInstance<TData extends RowData> = Table<
  typeof dataTableFeatures,
  TData
>;
export function DataTableColumnHeader<TData extends RowData>({
  column,
  title,
  className,
}: {
  column: ReturnType<TableInstance<TData>["getColumn"]>;
  title: string;
  className?: string;
}) {
  if (!column?.getCanSort()) return <span className={className}>{title}</span>;
  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <Button
      className={cn("-ml-3 h-8 gap-2 px-3", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
      size="sm"
      variant="ghost"
    >
      {title}
      <Icon data-icon="inline-end" />
    </Button>
  );
}
export function DataTablePagination<TData extends RowData>({
  table,
}: {
  table: TableInstance<TData>;
}) {
  const pageIndex = table.state.pagination.pageIndex;
  const pageCount = Math.max(1, table.getPageCount());
  const pageSize = table.state.pagination.pageSize;
  const totalRows = table.getRowCount();
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageNumbers: Array<number | "ellipsis-start" | "ellipsis-end"> =
    pageCount <= 7
      ? Array.from({ length: pageCount }, (_, index) => index + 1)
      : pageIndex < 4
        ? [1, 2, 3, 4, 5, "ellipsis-end", pageCount]
        : pageIndex >= pageCount - 4
          ? [1, "ellipsis-start", pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
          : [1, "ellipsis-start", pageIndex, pageIndex + 1, pageIndex + 2, "ellipsis-end", pageCount];
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Hiển thị <span className="font-medium text-foreground">{firstRow}–{lastRow}</span> trên <span className="font-medium text-foreground">{totalRows}</span> mục
      </p>
      <Pagination className="mx-0 w-auto" aria-label="Phân trang bảng">
        <PaginationContent>
          <PaginationItem>
            <Button
              aria-label="Trang trước"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="icon-sm"
              variant="outline"
            >
              <ChevronLeft data-icon="inline-start" />
            </Button>
          </PaginationItem>
          {pageNumbers.map((page) => (
            <PaginationItem key={page}>
              {typeof page === "number" ? (
                <Button
                  aria-label={`Trang ${page}`}
                  aria-current={page === pageIndex + 1 ? "page" : undefined}
                  onClick={() => table.setPageIndex(page - 1)}
                  size="icon-sm"
                  variant={page === pageIndex + 1 ? "default" : "outline"}
                >
                  {page}
                </Button>
              ) : (
                <span className="flex size-8 items-center justify-center text-muted-foreground" aria-hidden="true">
                  <Ellipsis />
                </span>
              )}
            </PaginationItem>
          ))}
          <PaginationItem>
            <Button
              aria-label="Trang sau"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="icon-sm"
              variant="outline"
            >
              <ChevronRight data-icon="inline-start" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
export function DataTable<TData extends RowData>({
  columns,
  data,
  search,
  hidePagination = false,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyMessage = "Không có dữ liệu.",
  className,
  getRowId,
  onRowClick,
  toolbar,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: [...data],
    getRowId,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: initialPageSize,
      },
    },
  });
  const filterValue = search
    ? String(table.getColumn(search.column)?.getFilterValue() ?? "")
    : "";
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      {(search || toolbar) && (
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          {search ? (
            <InputGroup className="w-full sm:max-w-sm">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={search.placeholder ?? "Tìm kiếm"}
                onChange={(event) =>
                  table
                    .getColumn(search.column)
                    ?.setFilterValue(event.target.value)
                }
                placeholder={search.placeholder ?? "Tìm kiếm…"}
                type="search"
                value={filterValue}
              />
              {filterValue && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label="Xóa tìm kiếm"
                    onClick={() =>
                      table.getColumn(search.column)?.setFilterValue("")
                    }
                    size="icon-sm"
                    variant="ghost"
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {toolbar}
            <span className="text-sm text-muted-foreground">Hiển thị</span>
            <NativeSelect
              className="w-20"
              aria-label="Số dòng mỗi trang"
              onChange={(event) =>
                table.setPageSize(Number(event.target.value))
              }
              value={String(table.state.pagination.pageSize)}
            >
              {pageSizeOptions.map((size) => (
                <NativeSelectOption key={size} value={size}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>
      )}
      <TableRoot>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{
                    width: header.getSize(),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                className={cn(onRowClick && "cursor-pointer")}
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-28 text-center text-muted-foreground"
                colSpan={columns.length}
              >
                <Empty>
                  <EmptyHeader>
                    <EmptyDescription>{emptyMessage}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableRoot>
      {!hidePagination && <DataTablePagination table={table} />}
    </div>
  );
}
