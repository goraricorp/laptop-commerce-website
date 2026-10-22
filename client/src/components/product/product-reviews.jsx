import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PropTypes from "prop-types";
import { useState, useId } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth-context";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
export function ProductReviews({ productId }) {
  const fieldIdPrefix = useId();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["product-reviews", productId, page],
    enabled: Boolean(productId),
    queryFn: () =>
      caller({
        url: "/review",
        query: {
          productId,
          page,
          limit: 10,
        },
      }),
  });
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await caller({
        url: "/review",
        method: "POST",
        body: {
          productId,
          score: Number(score),
          comment,
        },
      });
      setComment("");
      setMessage("Đã gửi đánh giá, đang chờ duyệt.");
      await client.invalidateQueries({
        queryKey: ["my-reviews", user.id],
      });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="reviews" className="grid gap-4">
      <h2 className="text-xl font-semibold">
        Đánh giá sản phẩm ({query.data?.total ?? 0})
      </h2>
      {query.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải đánh giá…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      ) : !query.data.items.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyDescription>Chưa có đánh giá.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        query.data.items.map((review) => (
          <Card key={review.id}>
            <CardContent className="grid gap-2">
              <p>
                {review.score}/5 ·{" "}
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                {review.isVerifiedPurchase ? " · Đã mua hàng" : ""}
              </p>
              <strong>{review.title}</strong>
              <p>{review.comment}</p>
            </CardContent>
          </Card>
        ))
      )}
      <Pagination className="flex gap-3 mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Trước
            </Button>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="outline"
              disabled={!query.data || page * 10 >= query.data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      {user ? (
        <form onSubmit={submit}>
          <FieldGroup className="grid gap-3">
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "product-reviews-3041"].join("-")}
              >
                Điểm đánh giá (1–5)
              </FieldLabel>
              <Input
                type="number"
                required
                min={1}
                max={5}
                value={score}
                onChange={(event) => setScore(event.target.value)}
                id={[fieldIdPrefix, "product-reviews-3041"].join("-")}
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "product-reviews-3355"].join("-")}
              >
                Trải nghiệm của bạn
              </FieldLabel>
              <Textarea
                required
                maxLength={10000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                id={[fieldIdPrefix, "product-reviews-3355"].join("-")}
              />
            </Field>
            <Button disabled={busy} type="submit">
              Gửi đánh giá
            </Button>
            <Link className="underline" to="/user/rating">
              Quản lý đánh giá của tôi
            </Link>
          </FieldGroup>
        </form>
      ) : (
        <Link className="underline" to="/auth/sign-in">
          Đăng nhập để đánh giá
        </Link>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
ProductReviews.propTypes = {
  productId: PropTypes.node,
};
