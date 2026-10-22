import { AdminStatistics } from "@/components/block/admin-statistics";

export default function Statistics() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Thống kê kinh doanh</h1>
        <p className="text-sm text-muted-foreground">
          Theo dõi doanh thu, đơn hàng, người dùng và cảnh báo tồn kho.
        </p>
      </header>
      <AdminStatistics />
    </div>
  );
}
