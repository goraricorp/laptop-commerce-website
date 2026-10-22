import { Item, ItemContent, ItemActions } from "@/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { caller } from "@/lib/utils/caller";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
export default function Favorites() {
  const { user } = useUser(),
    [page, setPage] = useState(1),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["favorites", user?.id, page],
    enabled: Boolean(user),
    queryFn: () =>
      caller({
        url: "/me/favorites",
        query: {
          page,
          limit: 20,
        },
      }),
  });
  const remove = useMutation({
    mutationFn: (id) =>
      caller({
        url: `/me/favorites/${id}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["favorites"],
      });
      void client.invalidateQueries({
        queryKey: ["favorite"],
      });
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  if (!user) return <p>Vui lòng đăng nhập để xem sản phẩm yêu thích.</p>;
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">Sản phẩm yêu thích</h1>
      {query.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      ) : (
        <>
          {!query.data.items.length && (
            <Empty>
              <EmptyHeader>
                <EmptyDescription>
                  Chưa có sản phẩm yêu thích đang mở bán.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {query.data.items.map((p) => (
            <Item variant="outline" key={p.id}>
              <ItemContent>
                <Link
                  to="/product/$type/$brand/$id"
                  params={{
                    id: p.id,
                    type: p.productType ?? "other",
                    brand: "store",
                  }}
                >
                  {p.name}
                </Link>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="outline"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(p.id)}
                >
                  Bỏ yêu thích
                </Button>
              </ItemActions>
            </Item>
          ))}
        </>
      )}
      <Pagination
        className="flex gap-3 mx-0 w-auto"
        aria-label="Phân trang yêu thích"
      >
        <PaginationContent>
          <PaginationItem>
            <Button disabled={page === 1} onClick={() => setPage(page - 1)}>
              Trước
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span>Trang {page}</span>
          </PaginationItem>
          <PaginationItem>
            <Button
              disabled={page * 20 >= (query.data?.total ?? 0)}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </section>
  );
}
