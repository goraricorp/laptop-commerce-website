import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import PropTypes from "prop-types";
import { useState, useId } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import { useAuth } from "@/hooks/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
function ReviewEditor({ review, refresh }) {
  const fieldIdPrefix = useId();
  const [score, setScore] = useState(review.score);
  const [title, setTitle] = useState(review.title ?? "");
  const [comment, setComment] = useState(review.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(method) {
    setBusy(true);
    setError("");
    try {
      await caller({
        url: `/me/reviews/${review.id}`,
        method,
        ...(method === "PATCH"
          ? {
              body: {
                score: Number(score),
                title,
                comment,
              },
            }
          : {}),
      });
      await refresh();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void save("PATCH");
          }}
        >
          <FieldGroup className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Sản phẩm: {review.productId} ·{" "}
              {review.status === "pending"
                ? "Chờ duyệt"
                : review.status === "published"
                  ? "Đã đăng"
                  : "Đã ẩn"}
            </p>
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "my-reviews-1744"].join("-")}
              >
                Điểm (1–5)
              </FieldLabel>
              <Input
                type="number"
                min={1}
                max={5}
                required
                value={score}
                onChange={(event) => setScore(event.target.value)}
                id={[fieldIdPrefix, "my-reviews-1744"].join("-")}
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "my-reviews-2049"].join("-")}
              >
                Tiêu đề
              </FieldLabel>
              <Input
                maxLength={255}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                id={[fieldIdPrefix, "my-reviews-2049"].join("-")}
              />
            </Field>
            <Field>
              <FieldLabel
                htmlFor={[fieldIdPrefix, "my-reviews-2286"].join("-")}
              >
                Nội dung
              </FieldLabel>
              <Textarea
                maxLength={10000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                id={[fieldIdPrefix, "my-reviews-2286"].join("-")}
              />
            </Field>
            <p className="text-sm text-muted-foreground">
              Đánh giá sau khi sửa sẽ được duyệt lại.
            </p>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button disabled={busy} type="submit">
                Lưu thay đổi
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  if (window.confirm("Xóa đánh giá này?")) void save("DELETE");
                }}
              >
                Xóa đánh giá
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
export default function MyReviews() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["my-reviews", user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(user),
    queryFn: () =>
      caller({
        url: "/me/reviews",
      }),
  });
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Đánh giá của tôi</h1>
      {!user ? (
        <p>Vui lòng đăng nhập để quản lý đánh giá.</p>
      ) : query.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      ) : query.data.length ? (
        query.data.map((review) => (
          <ReviewEditor
            key={`${review.id}:${review.updatedAt}`}
            review={review}
            refresh={() =>
              Promise.all([
                client.invalidateQueries({
                  queryKey: key,
                }),
                client.invalidateQueries({
                  queryKey: ["review-summary"],
                }),
                client.invalidateQueries({
                  queryKey: ["product-reviews"],
                }),
              ])
            }
          />
        ))
      ) : (
        <p>Bạn chưa có đánh giá nào.</p>
      )}
    </div>
  );
}
ReviewEditor.propTypes = {
  review: PropTypes.object,
  refresh: PropTypes.func,
};
