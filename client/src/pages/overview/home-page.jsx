import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/block/product-card";
import { HorizontalRail } from "@/components/block/horizontal-rail";
import { HomeBanner } from "@/components/block/home-banner";
import {
  useCampaigns,
  useSpotlight,
  useCatalogSearch,
  getCategories,
} from "@/services/catalog";
import { formatCurrency } from "@/lib/utils/overview-data";
export default function HomePage() {
  const campaigns = useCampaigns();
  const spotlight = useSpotlight();
  const latest = useCatalogSearch({
    limit: 8,
  });
  const laptops = useCatalogSearch({
    type: "laptop",
    limit: 8,
  });
  const categories = getCategories({
    limit: 100,
  });
  return (
    <div className="grid min-w-0 gap-10">
      <HomeBanner />
      {campaigns.isPending ? (
        <div role="status">
          <Skeleton className="h-4 w-32" aria-hidden="true" />
          Đang tải chương trình…
        </div>
      ) : campaigns.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải chương trình hiện tại.
          </AlertDescription>
        </Alert>
      ) : campaigns.data.items.length ? (
        <section
          aria-label="Chương trình đang diễn ra"
          className="grid gap-4 md:grid-cols-2"
        >
          {campaigns.data.items.map((campaign) => (
            <Card key={campaign.id} className="overflow-hidden py-0">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="aspect-video w-full object-cover"
              />
              <CardHeader>
                <CardTitle>{campaign.title}</CardTitle>
                {campaign.description ? (
                  <CardDescription>{campaign.description}</CardDescription>
                ) : null}
              </CardHeader>
              {campaign.promotion && (
                <CardContent>
                  <p>
                    {campaign.promotion.name}:{" "}
                    {campaign.promotion.discountType === "percentage"
                      ? `${Number(campaign.promotion.discountValue)}%`
                      : formatCurrency(campaign.promotion.discountValue)}
                    {Number(campaign.promotion.minimumOrderValue) > 0
                      ? ` cho đơn từ ${formatCurrency(campaign.promotion.minimumOrderValue)}`
                      : ""}
                    {campaign.promotion.maximumDiscount
                      ? `, tối đa ${formatCurrency(campaign.promotion.maximumDiscount)}`
                      : ""}
                  </p>
                </CardContent>
              )}
              <CardFooter className="pb-6">
                <Link
                  to={
                    campaign.productId
                      ? "/product/$type/$brand/$id"
                      : "/product/$type"
                  }
                  params={
                    campaign.productId
                      ? {
                          type: "all",
                          brand: campaign.brandSlug,
                          id: campaign.productId,
                        }
                      : {
                          type: "all",
                        }
                  }
                  className="font-medium text-primary underline"
                >
                  Xem sản phẩm
                </Link>
              </CardFooter>
            </Card>
          ))}
        </section>
      ) : null}
      {categories.data?.items.length ? (
        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Danh mục</h2>
          <div className="flex flex-wrap gap-3">
            {categories.data.items.map((category) => (
              <Button
                key={category.id}
                nativeButton={false}
                variant="outline"
                render={
                  <Link
                    to="/product/$type"
                    params={{ type: "all" }}
                    search={{ categoryId: category.id }}
                  />
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
      <section className="grid min-w-0 gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Laptop</h2>
          <Link
            to="/product/$type"
            params={{
              type: "laptop",
            }}
            className="underline"
          >
            Xem tất cả laptop
          </Link>
        </div>
        {laptops.isPending ? (
          <div role="status">
            <Skeleton className="h-4 w-32" aria-hidden="true" />
            Đang tải laptop…
          </div>
        ) : laptops.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{laptops.error.message}</AlertDescription>
          </Alert>
        ) : laptops.data.items.length ? (
          <HorizontalRail label="Laptop">
            {laptops.data.items.map((item) => (
              <div key={item.id} className="min-w-0">
                <ProductCard
                  product={item}
                  variant={item.variant}
                  media={item.media}
                  brand={item.brand}
                />
              </div>
            ))}
          </HorizontalRail>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Chưa có laptop đang bán.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
      {spotlight.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Không thể tải sản phẩm bán chạy.</AlertDescription>
        </Alert>
      ) : spotlight.data?.items.length ? (
        <section className="grid gap-4">
          <h2 className="text-2xl font-semibold">Bán chạy 7 ngày qua</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {spotlight.data.items.map((item) => (
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
      <section className="grid min-w-0 gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Sản phẩm mới</h2>
          <Link
            to="/product/$type"
            params={{
              type: "all",
            }}
            className="underline"
          >
            Xem tất cả
          </Link>
        </div>
        {latest.isPending ? (
          <div role="status">
            <Skeleton className="h-4 w-32" aria-hidden="true" />
            Đang tải sản phẩm…
          </div>
        ) : latest.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{latest.error.message}</AlertDescription>
          </Alert>
        ) : latest.data.items.length ? (
          <HorizontalRail label="Sản phẩm mới">
            {latest.data.items.map((item) => (
              <div key={item.id} className="min-w-0">
                <ProductCard
                  product={item}
                  variant={item.variant}
                  media={item.media}
                  brand={item.brand}
                />
              </div>
            ))}
          </HorizontalRail>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Chưa có sản phẩm đang bán.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  );
}
