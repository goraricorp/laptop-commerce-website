import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVouchers } from "@/services/vouchers";
import { formatCurrency } from "@/lib/utils/overview-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/lib/toast";
const labels = {
  available: "Có thể dùng",
  used: "Đã dùng hết lượt",
  expired: "Hết hạn / đã tắt",
  upcoming: "Sắp có hiệu lực",
  exhausted: "Hết lượt",
};
export function VoucherWallet() {
  const query = useVouchers();
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">Kho voucher</h1>
      {query.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải voucher…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{query.error.message}</AlertDescription>
        </Alert>
      ) : !query.data?.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyDescription>Chưa có voucher.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        query.data.map((voucher) => (
          <Card key={voucher.id}>
            <CardContent className="grid gap-2">
              <strong>
                {voucher.name} · {voucher.code}
              </strong>
              <p>
                Giảm{" "}
                {voucher.discountType === "percentage"
                  ? `${voucher.discountValue}%`
                  : formatCurrency(voucher.discountValue)}{" "}
                · Đơn từ {formatCurrency(voucher.minimumOrderValue)}
                {voucher.maximumDiscount !== null
                  ? ` · Tối đa ${formatCurrency(voucher.maximumDiscount)}`
                  : ""}
              </p>
              <p>
                {labels[voucher.state]} · Hạn{" "}
                {new Date(voucher.endsAt).toLocaleString("vi-VN")}
              </p>
              <Button
                disabled={voucher.state !== "available"}
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(voucher.code);
                    toast.add({
                      title: "Đã sao chép mã",
                      type: "success",
                    });
                  } catch {
                    toast.add({
                      title: "Không thể sao chép mã",
                      type: "error",
                    });
                  }
                }}
              >
                Sao chép mã
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
