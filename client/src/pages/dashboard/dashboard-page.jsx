import { AdminStatistics } from "@/components/block/admin-statistics";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Bảng điều khiển</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan hoạt động kinh doanh và các công việc cần xử lý.
        </p>
      </header>
      <AdminStatistics />
    </div>
  );
}
