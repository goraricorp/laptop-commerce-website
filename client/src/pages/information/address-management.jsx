import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AddressBookDialog } from "@/components/form/address-book-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddressBook, formatAddress } from "@/hooks/use-address-book";
export function AddressManagement() {
  const book = useAddressBook();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  async function act(task) {
    setError("");
    try {
      await task();
    } catch (cause) {
      setError(cause.message);
    }
  }
  if (!book.user)
    return (
      <p>
        Vui lòng{" "}
        <Link className="underline" to="/auth/sign-in">
          đăng nhập
        </Link>{" "}
        để quản lý sổ địa chỉ.
      </p>
    );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Sổ địa chỉ</h1>
          <p className="text-sm text-muted-foreground">
            Các địa chỉ đã lưu dùng để nhận hàng khi mua sắm.
          </p>
        </div>
        <Button onClick={() => setEditing("new")}>
          <Plus data-icon="inline-start" />
          Thêm địa chỉ
        </Button>
      </div>
      {book.isPending && (
        <div role="status">
          <Skeleton className="h-4 w-32" aria-hidden="true" />
          Đang tải địa chỉ…
        </div>
      )}
      {book.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Không thể tải sổ địa chỉ.{" "}
            <Button variant="outline" onClick={() => book.refetch()}>
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!book.isPending && !book.isError && !book.addresses.length && (
        <Empty>
          <EmptyHeader>
            <EmptyDescription>
              Chưa có địa chỉ. Bấm “Thêm địa chỉ” để bắt đầu.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {book.addresses.map((address) => (
          <Card key={address.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5" />
                {address.recipientName}
              </CardTitle>
              {address.isDefault && <Badge>Mặc định</Badge>}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm">{address.phone}</p>
              <p className="text-sm text-muted-foreground">
                {formatAddress(address)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(address)}
                >
                  <Pencil data-icon="inline-start" />
                  Sửa
                </Button>
                {!address.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={book.update.isPending}
                    onClick={() =>
                      act(() =>
                        book.update.mutateAsync({
                          id: address.id,
                          data: {
                            isDefault: true,
                          },
                        }),
                      )
                    }
                  >
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  aria-label="Xóa địa chỉ"
                  size="icon-sm"
                  variant="destructive"
                  disabled={book.remove.isPending}
                  onClick={() => act(() => book.remove.mutateAsync(address.id))}
                >
                  <Trash2 data-icon="inline-start" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editing && (
        <AddressBookDialog
          key={editing.id ?? "new"}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          initialAddress={editing === "new" ? undefined : editing}
          user={book.user}
          onSave={(data) =>
            editing === "new"
              ? book.create.mutateAsync(data)
              : book.update.mutateAsync({
                  id: editing.id,
                  data,
                })
          }
        />
      )}
    </div>
  );
}
