import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
export default function NewsletterPage() {
  const params = new URLSearchParams(window.location.search),
    token = params.get("token"),
    purpose = params.get("purpose");
  const action = useMutation({
    mutationFn: () =>
      caller({
        url: "/newsletter/action",
        method: "POST",
        body: {
          token,
          purpose,
        },
      }),
  });
  if (!token || !["confirm", "unsubscribe"].includes(purpose))
    return (
      <Alert variant="destructive">
        <AlertDescription>Liên kết không hợp lệ.</AlertDescription>
      </Alert>
    );
  return (
    <section className="mx-auto grid max-w-xl gap-4 p-8">
      <h1 className="text-2xl font-semibold">
        {purpose === "confirm"
          ? "Xác nhận đăng ký bản tin"
          : "Hủy đăng ký bản tin"}
      </h1>
      <Button
        disabled={action.isPending || action.isSuccess}
        onClick={() => action.mutate()}
      >
        {purpose === "confirm" ? "Xác nhận đăng ký" : "Xác nhận hủy đăng ký"}
      </Button>
      {action.isSuccess && (
        <p role="status">
          {action.data?.status === "already_processed"
            ? "Liên kết đã được xử lý; không thay đổi đăng ký."
            : purpose === "confirm"
              ? "Đã xác nhận đăng ký."
              : "Đã hủy đăng ký."}
        </p>
      )}
      {action.isError && (
        <Alert variant="destructive">
          <AlertDescription>{action.error.message}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
