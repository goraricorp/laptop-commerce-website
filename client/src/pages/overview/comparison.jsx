import { Skeleton } from "@/components/ui/skeleton";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useComparisonIds } from "@/hooks/use-comparison";
import { caller } from "@/lib/utils/caller";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/overview-data";
export default function Comparison() {
  const [ids, setIds] = useComparisonIds(),
    query = useQuery({
      queryKey: ["comparison", ids],
      enabled: ids.length > 0,
      queryFn: () =>
        caller({
          url: "/catalog/comparison",
          method: "POST",
          body: {
            variantIds: ids,
          },
        }),
    });
  const rows = query.data?.items ?? [],
    attributes = [
      ...new Set(rows.flatMap((r) => (r.attributes ?? []).map((a) => a.name))),
    ];
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">So sánh sản phẩm</h1>
      <p>Tối đa bốn SKU cùng loại. Giá và thông số được tải lại từ cửa hàng.</p>
      <Button variant="outline" onClick={() => setIds([])}>
        Xóa lựa chọn so sánh
      </Button>
      {!ids.length ? (
        <p>Chưa chọn SKU để so sánh.</p>
      ) : query.isPending ? (
        <div role="status">
          <Skeleton className="mb-2 h-4 w-32" aria-hidden={true}></Skeleton>Đang
          tải thông số…
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {query.error.message} Hãy bỏ lựa chọn không còn bán và chọn lại.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse text-left">
            <TableHeader>
              <TableRow>
                <TableHead className="border p-3">Thông tin</TableHead>
                {rows.map((r) => (
                  <TableHead key={r.variant.id} className="min-w-48 border p-3">
                    {r.product.name} · {r.variant.name}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setIds(ids.filter((id) => id !== r.variant.id))
                      }
                    >
                      Bỏ SKU
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableHead className="border p-3">Giá</TableHead>
                {rows.map((r) => (
                  <TableCell className="border p-3" key={r.variant.id}>
                    {formatCurrency(r.variant.price)}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableHead className="border p-3">Khả dụng</TableHead>
                {rows.map((r) => (
                  <TableCell className="border p-3" key={r.variant.id}>
                    {r.variant.available ? "Còn hàng" : "Chưa có tồn khả dụng"}
                  </TableCell>
                ))}
              </TableRow>
              {attributes.map((name) => (
                <TableRow key={name}>
                  <TableHead className="border p-3">{name}</TableHead>
                  {rows.map((r) => (
                    <TableCell className="border p-3" key={r.variant.id}>
                      {r.attributes
                        .filter((a) => a.name === name)
                        .map((a) => a.value)
                        .join(", ") || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
