import { Spinner } from "@/components/ui/spinner";
import { StatusPage } from "@/components/page/page-layout";

export default function LoadingPage() {
  return (
    <div className="min-h-svh bg-background">
      <StatusPage
        eyebrow="Hệ thống"
        title="Đang tải"
        description="Vui lòng chờ trong khi dữ liệu được chuẩn bị."
        icon={<Spinner className="size-8" />}
        status="Đang xử lý"
      />
    </div>
  );
}
