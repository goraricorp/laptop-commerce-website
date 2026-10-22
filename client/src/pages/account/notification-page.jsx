import { useId } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { AccountNavigation } from "@/components/block/account-navigation";
export default function NotificationPage() {
  const fieldIdPrefix = useId();
  const { user } = useUser(),
    client = useQueryClient(),
    query = useQuery({
      queryKey: ["notification-preferences", user?.id],
      queryFn: () =>
        caller({
          url: "/me/preferences",
        }),
    });
  const mutation = useMutation({
    mutationFn: (data) =>
      caller({
        url: "/me/preferences",
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["notification-preferences", user?.id],
      });
      toast.add({
        title: "Đã lưu tùy chọn thông báo",
        type: "success",
      });
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  return (
    <section className="grid gap-4">
      <AccountNavigation />
      <h1 className="text-2xl font-semibold">Tùy chọn thông báo</h1>
      <p>
        Email bảo mật như mã xác minh và đặt lại mật khẩu luôn được gửi. Đăng ký
        bản tin cần xác nhận email riêng.
      </p>
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
        <form
          key={JSON.stringify(query.data)}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            mutation.mutate({
              transactional: fd.has("transactional"),
              marketing: fd.has("marketing"),
            });
          }}
        >
          <FieldGroup className="grid gap-4">
            <Field orientation="horizontal">
              <Switch
                name="transactional"
                defaultChecked={query.data.transactional}
                id={[
                  fieldIdPrefix,
                  "notification-page-1918",
                  JSON.stringify(query.data),
                ].join("-")}
              />
              <FieldLabel
                htmlFor={[
                  fieldIdPrefix,
                  "notification-page-1918",
                  JSON.stringify(query.data),
                ].join("-")}
              >
                {" "}
                Thông báo giao dịch và đơn hàng
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Switch
                name="marketing"
                defaultChecked={query.data.marketing}
                id={[
                  fieldIdPrefix,
                  "notification-page-2159",
                  JSON.stringify(query.data),
                ].join("-")}
              />
              <FieldLabel
                htmlFor={[
                  fieldIdPrefix,
                  "notification-page-2159",
                  JSON.stringify(query.data),
                ].join("-")}
              >
                {" "}
                Cho phép thông báo tiếp thị
              </FieldLabel>
            </Field>
            <Button type="submit" disabled={mutation.isPending}>
              Lưu tùy chọn
            </Button>
          </FieldGroup>
        </form>
      )}
    </section>
  );
}
