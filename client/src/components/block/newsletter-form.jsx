import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel, Field, FieldGroup } from "@/components/ui/field";
import { useState, useId } from "react";
import { useMutation } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function NewsletterForm() {
  const fieldIdPrefix = useId();
  const [consent, setConsent] = useState(false);
  const mutation = useMutation({
    mutationFn: (email) =>
      caller({
        url: "/newsletter/subscribe",
        method: "POST",
        body: {
          email,
          consent: true,
          source: "footer",
        },
      }),
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(new FormData(e.currentTarget).get("email"));
      }}
    >
      <FieldGroup className="grid gap-3 rounded border p-4">
        <h2 className="font-semibold">Đăng ký bản tin</h2>
        <Field>
          <FieldLabel
            htmlFor={[fieldIdPrefix, "newsletter-form-792"].join("-")}
          >
            Email nhận bản tin
          </FieldLabel>
          <Input
            type="email"
            name="email"
            required
            maxLength={254}
            id={[fieldIdPrefix, "newsletter-form-792"].join("-")}
          />
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked)}
            required
            id={[fieldIdPrefix, "newsletter-form-917"].join("-")}
          />
          <FieldLabel
            htmlFor={[fieldIdPrefix, "newsletter-form-917"].join("-")}
          >
            Tôi đồng ý nhận bản tin và sẽ xác nhận qua email; có thể hủy đăng ký
            bằng liên kết trong email.
          </FieldLabel>
        </Field>
        <Button type="submit" disabled={!consent || mutation.isPending}>
          Gửi yêu cầu đăng ký
        </Button>
        {mutation.isSuccess && (
          <p role="status">
            Đã tiếp nhận yêu cầu. Vui lòng kiểm tra email để xác nhận.
          </p>
        )}
        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>
    </form>
  );
}
