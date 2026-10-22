import { cn } from "@/lib/utils";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import {
  Field,
  FieldLegend,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingActions } from "@/components/block/shopping-actions";
import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import defaultProductImage from "@/assets/image/product/default.png";
import { ProductReviews } from "@/components/product/product-reviews";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useCart } from "@/hooks/cart-context";
import { caller } from "@/lib/utils/caller";
import { formatCurrency } from "@/lib/utils/overview-data";
import { useProductDetails, useCatalogSearch } from "@/services/catalog";
import { ProductCard } from "@/components/block/product-card";
export default function ProductPage() {
  const { id } = useParams({
    strict: false,
  });
  const query = useProductDetails(id);
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [buying, setBuying] = useState(false);
  const product = query.data?.product;
  const related = useCatalogSearch(
    {
      categoryId: product?.categoryId ?? undefined,
      limit: 5,
    },
    {
      enabled: Boolean(product),
    },
  );
  const summary = useQuery({
    queryKey: ["product-review-summary", id],
    enabled: Boolean(id),
    queryFn: () =>
      caller({
        url: "/review/summary",
        query: {
          productId: id,
        },
      }),
  });
  const variant =
    query.data?.variants.find((item) => item.id === selectedId) ??
    query.data?.variants[0];
  const images = (query.data?.media ?? [])
    .filter(
      (item) =>
        item.mediaType === "image" &&
        (!item.variantId || item.variantId === variant?.id),
    )
    .sort(
      (a, b) =>
        Number(Boolean(b.variantId)) - Number(Boolean(a.variantId)) ||
        Number(b.isPrimary) - Number(a.isPrimary) ||
        a.position - b.position ||
        a.id.localeCompare(b.id),
    );
  const image = images.find((item) => item.id === selectedImage) ?? images[0];
  const canBuy = variant?.available && Number(variant.price) > 0;
  async function buy(now = false) {
    if (!canBuy || buying) return;
    setBuying(true);
    try {
      const result = await addItem({
        id: variant.id,
        variantId: variant.id,
        productId: product.id,
        name: product.name,
        variantName: variant.name,
        price: Number(variant.price),
        image: image?.url,
        quantity: 1,
      });
      if (result === false) return;
      toast.add({
        title: "Đã thêm vào giỏ hàng",
        type: "success",
      });
      if (now)
        await navigate({
          to: "/pay/cart",
        });
    } catch (error) {
      toast.add({
        title: "Không thể thêm vào giỏ",
        description: error.message,
        type: "error",
      });
    } finally {
      setBuying(false);
    }
  }
  if (query.isPending)
    return (
      <div role="status">
        <Skeleton className="h-4 w-32" aria-hidden="true" />
        Đang tải sản phẩm…
      </div>
    );
  if (query.isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p>{query.error.message}</p>
          <Button onClick={() => void query.refetch()}>Thử lại</Button>
          <Link
            to="/product/$type"
            params={{
              type: "all",
            }}
          >
            Xem sản phẩm khác
          </Link>
        </AlertDescription>
      </Alert>
    );
  return (
    <article className="grid gap-8">
      <Link
        to="/product/$type"
        params={{
          type: "all",
        }}
        className="text-sm underline"
      >
        Tất cả sản phẩm
      </Link>
      <header className="grid gap-2">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        {query.data.brand ? <p>{query.data.brand.name}</p> : null}
        <a href="#reviews">
          {summary.isPending
            ? "Đang tải đánh giá…"
            : summary.isError
              ? "Xem đánh giá"
              : `${Number(summary.data.average).toFixed(1)} / 5 · ${summary.data.count} đánh giá`}
        </a>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="grid content-start gap-4">
          <img
            src={image?.url ?? defaultProductImage}
            alt={image?.alt ?? product.name}
            className="aspect-square w-full rounded-xl border object-contain"
          />
          {images.length > 1 ? (
            <div className="flex flex-wrap gap-2" aria-label="Ảnh sản phẩm">
              {images.map((item) => (
                <Button
                  type="button"
                  key={item.id}
                  aria-label={item.alt || `Ảnh ${images.indexOf(item) + 1}`}
                  aria-pressed={item.id === image?.id}
                  className="h-auto p-1"
                  onClick={() => setSelectedImage(item.id)}
                  variant="outline"
                >
                  <img
                    src={item.url}
                    alt=""
                    className="size-20 object-contain"
                  />
                </Button>
              ))}
            </div>
          ) : null}
        </div>
        <section
          className="grid content-start gap-5"
          aria-label="Lựa chọn phiên bản"
        >
          {product.summary ? (
            <p className="whitespace-pre-wrap">{product.summary}</p>
          ) : null}
          {query.data.variants.length ? (
            <FieldSet>
              <FieldLegend variant="label">Phiên bản</FieldLegend>
              <RadioGroup
                name="variant"
                value={variant?.id ?? null}
                onValueChange={(value) => {
                  setSelectedId(value);
                  setSelectedImage(null);
                }}
                className="flex flex-wrap gap-3"
                aria-label="Phiên bản"
              >
                {query.data.variants.map((item) => (
                  <Field
                    key={item.id}
                    orientation="horizontal"
                    className="w-auto"
                  >
                    <RadioGroupItem id={`variant-${item.id}`} value={item.id} />
                    <FieldLabel htmlFor={`variant-${item.id}`}>
                      {item.name}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>Chưa có phiên bản đang bán.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {variant ? (
            <>
              <p>SKU: {variant.sku}</p>
              <p className="text-3xl font-bold" aria-live="polite">
                {Number(variant.price) > 0
                  ? formatCurrency(variant.price)
                  : "Liên hệ báo giá"}
              </p>
              <p aria-live="polite">
                {variant.available ? "Còn hàng" : "Hiện chưa có hàng khả dụng"}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void buy()} disabled={!canBuy || buying}>
                  Thêm vào giỏ hàng
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void buy(true)}
                  disabled={!canBuy || buying}
                >
                  Mua ngay
                </Button>
              </div>
            </>
          ) : null}
          {variant?.attributes.length ? (
            <section>
              <h2 className="mb-3 text-xl font-semibold">Thông số phiên bản</h2>
              <dl className="divide-y rounded border">
                {variant.attributes.map((attribute, index) => (
                  <div
                    key={`${attribute.id}:${index}`}
                    className="grid grid-cols-2 gap-4 p-3"
                  >
                    <dt>{attribute.name}</dt>
                    <dd>{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  Chưa có thông số cho phiên bản này.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      </div>
      <section className="grid gap-4" aria-label="Mô tả sản phẩm">
        <h2 className="text-2xl font-semibold">Mô tả sản phẩm</h2>
        {query.data.contentSections.length ? (
          <>
            <div
              id="product-description"
              onFocusCapture={() => setExpanded(true)}
              className={cn(
                "grid gap-6",
                !expanded && "max-h-96 overflow-hidden",
              )}
            >
              {query.data.contentSections.map((section) => (
                <section key={section.id} className="grid gap-3">
                  {section.title ? (
                    <h3 className="text-xl font-semibold">{section.title}</h3>
                  ) : null}
                  {section.imageUrl ? (
                    <img
                      src={section.imageUrl}
                      alt={section.title ?? ""}
                      className="max-h-[600px] max-w-full object-contain"
                      loading="lazy"
                    />
                  ) : null}
                  {section.format === "html" ? (
                    <div
                      className="prose max-w-full overflow-x-auto"
                      dangerouslySetInnerHTML={{
                        __html: section.content ?? "",
                      }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{section.content}</p>
                  )}
                </section>
              ))}
            </div>
            <Button
              className="justify-self-start"
              variant="outline"
              aria-expanded={expanded}
              aria-controls="product-description"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Thu gọn" : "Đọc thêm"}
            </Button>
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Chưa có mô tả chi tiết.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
      <ShoppingActions productId={id} variantId={variant?.id} />
      <ProductReviews productId={product.id} />
      {related.data?.items.some((item) => item.id !== product.id) ? (
        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Sản phẩm cùng danh mục</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.data.items
              .filter((item) => item.id !== product.id)
              .slice(0, 4)
              .map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  variant={item.variant}
                  media={item.media}
                  brand={item.brand}
                />
              ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
