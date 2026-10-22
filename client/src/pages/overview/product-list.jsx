import { useId } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  NativeSelectOption,
  NativeSelect,
} from "@/components/ui/native-select";
import {
  FieldGroup,
  FieldLabel,
  Field,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Link,
  useNavigate,
  useParams,
  useRouterState,
} from "@tanstack/react-router";
import { ProductCard } from "@/components/block/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCatalogSearch } from "@/services/catalog";
import {
  catalogSearchState,
  changeCatalogFilter,
  toggleCatalogValue,
} from "@/lib/utils/catalog-search";
export default function ProductList() {
  const fieldIdPrefix = useId();
  const { type } = useParams({
    strict: false,
  });
  const rawSearch = useRouterState({
    select: (state) => state.location.search,
  });
  const navigate = useNavigate();
  const state = catalogSearchState(rawSearch);
  const pageSize = 12;
  const query = useCatalogSearch({
    ...state,
    type,
    limit: pageSize,
  });
  const data = query.data;
  const change = (patch) =>
    void navigate({
      to: ".",
      search: changeCatalogFilter(state, patch),
    });
  const go = (page) =>
    void navigate({
      to: ".",
      search: {
        ...state,
        page,
      },
    });
  const brands = state.brandId?.split(",") ?? [];
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-5">
      <aside
        className="flex min-w-0 flex-col gap-5 rounded-xl border p-4 lg:col-span-1 lg:self-start"
        aria-label="Bộ lọc sản phẩm"
      >
        <h1 className="text-xl font-semibold">Sản phẩm</h1>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            change({
              q: new FormData(event.currentTarget).get("q") || undefined,
            });
          }}
          key={state.q ?? ""}
        >
          <FieldGroup className="flex flex-col gap-2">
            <Input
              aria-label="Tìm kiếm sản phẩm"
              name="q"
              defaultValue={state.q ?? ""}
            />
            <Button type="submit">Tìm</Button>
          </FieldGroup>
        </form>
        {data?.facets.categories.length ? (
          <Field>
            <FieldLabel
              htmlFor={[fieldIdPrefix, "product-list-1858"].join("-")}
            >
              Danh mục
            </FieldLabel>
            <NativeSelect
              className="w-full"
              aria-label="Danh mục"
              value={state.categoryId ?? ""}
              onChange={(event) =>
                change({
                  categoryId: event.target.value || undefined,
                })
              }
              id={[fieldIdPrefix, "product-list-1858"].join("-")}
            >
              <NativeSelectOption value="">Tất cả</NativeSelectOption>
              {data.facets.categories.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        {data?.facets.brands.length ? (
          <FieldSet className="grid gap-2">
            <FieldLegend className="mb-2 font-medium">Thương hiệu</FieldLegend>
            {data.facets.brands.map((item) => (
              <Field key={item.id} orientation="horizontal">
                <Checkbox
                  checked={brands.includes(item.id)}
                  onCheckedChange={() =>
                    change({
                      brand: undefined,
                      brandId:
                        toggleCatalogValue(brands, item.id).join(",") ||
                        undefined,
                    })
                  }
                  id={[
                    fieldIdPrefix,
                    "product-list-2698",
                    item.id,
                    item.id,
                  ].join("-")}
                />
                <FieldLabel
                  htmlFor={[
                    fieldIdPrefix,
                    "product-list-2698",
                    item.id,
                    item.id,
                  ].join("-")}
                >
                  {item.name}
                </FieldLabel>
              </Field>
            ))}
          </FieldSet>
        ) : null}
        <form
          key={`${state.minPrice}:${state.maxPrice}`}
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            change({
              minPrice: form.get("minPrice") || undefined,
              maxPrice: form.get("maxPrice") || undefined,
            });
          }}
        >
          <FieldGroup className="grid gap-2">
            <p className="font-medium">Khoảng giá (đ)</p>
            <Input
              name="minPrice"
              type="number"
              min="0"
              defaultValue={state.minPrice ?? ""}
              aria-label="Giá từ"
              placeholder="Giá từ"
            />
            <Input
              name="maxPrice"
              type="number"
              min="0"
              defaultValue={state.maxPrice ?? ""}
              aria-label="Giá đến"
              placeholder="Giá đến"
            />
            <Button type="submit" variant="outline">
              Áp dụng giá
            </Button>
          </FieldGroup>
        </form>
        {data?.facets.attributes.map((attribute) => (
          <FieldSet key={attribute.id} className="grid gap-2">
            <FieldLegend className="mb-2 font-medium">
              {attribute.name}
            </FieldLegend>
            {attribute.values.map((value) => (
              <Field key={value.id} orientation="horizontal">
                <Checkbox
                  checked={
                    state.attributes?.[attribute.code]?.includes(value.id) ??
                    false
                  }
                  onCheckedChange={() =>
                    change({
                      attributes: {
                        ...state.attributes,
                        [attribute.code]: toggleCatalogValue(
                          state.attributes?.[attribute.code],
                          value.id,
                        ),
                      },
                    })
                  }
                  id={[
                    fieldIdPrefix,
                    "product-list-4541",
                    value.id,
                    value.id,
                    attribute.id,
                  ].join("-")}
                />
                <FieldLabel
                  htmlFor={[
                    fieldIdPrefix,
                    "product-list-4541",
                    value.id,
                    value.id,
                    attribute.id,
                  ].join("-")}
                >
                  {value.value}
                </FieldLabel>
              </Field>
            ))}
          </FieldSet>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            void navigate({
              to: ".",
              search: {},
            })
          }
        >
          Xóa bộ lọc
        </Button>
      </aside>
      <section
        className="flex min-w-0 flex-col gap-5 lg:col-span-4"
        aria-label="Kết quả sản phẩm"
        aria-busy={query.isFetching}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite">
            {data ? `${data.total} sản phẩm` : "Đang tải…"}
          </p>
          <Field>
            <FieldLabel
              htmlFor={[fieldIdPrefix, "product-list-5855"].join("-")}
            >
              Sắp xếp{" "}
            </FieldLabel>
            <NativeSelect
              className="w-full"
              aria-label="Sắp xếp"
              value={state.sort}
              onChange={(event) =>
                change({
                  sort: event.target.value,
                })
              }
              id={[fieldIdPrefix, "product-list-5855"].join("-")}
            >
              <NativeSelectOption value="newest">Mới nhất</NativeSelectOption>
              <NativeSelectOption value="name">Tên sản phẩm</NativeSelectOption>
              <NativeSelectOption value="price-asc">
                Giá tăng dần
              </NativeSelectOption>
              <NativeSelectOption value="price-desc">
                Giá giảm dần
              </NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>
        {query.isPending ? (
          <div role="status">
            <Skeleton className="h-4 w-32" aria-hidden="true" />
            Đang tải sản phẩm…
          </div>
        ) : query.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              <p>{query.error.message}</p>
              <Button onClick={() => void query.refetch()}>Thử lại</Button>
            </AlertDescription>
          </Alert>
        ) : !data.items.length ? (
          <Empty>
            <EmptyHeader>
              <EmptyDescription>
                Không tìm thấy sản phẩm phù hợp. Hãy thay đổi bộ lọc.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                variant={item.variant}
                media={item.media}
                brand={item.brand}
              />
            ))}
          </div>
        )}
        {data?.total > pageSize ? (
          <Pagination
            aria-label="Phân trang sản phẩm"
            className="flex flex-wrap items-center  gap-4 mx-0 w-auto"
          >
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  disabled={state.page <= 1}
                  onClick={() => go(state.page - 1)}
                >
                  Trang trước
                </Button>
              </PaginationItem>
              <PaginationItem>
                <span>
                  Trang {state.page} / {Math.ceil(data.total / pageSize)}
                </span>
              </PaginationItem>
              <PaginationItem>
                <Button
                  variant="outline"
                  disabled={state.page * pageSize >= data.total}
                  onClick={() => go(state.page + 1)}
                >
                  Trang sau
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
        <Link to="/" className="text-sm underline">
          Về trang chủ
        </Link>
      </section>
    </div>
  );
}
