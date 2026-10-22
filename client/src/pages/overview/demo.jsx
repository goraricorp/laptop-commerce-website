import { useState } from "react";

import { PageCard, PageLayout } from "@/components/page/page-layout";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  const [count, setCount] = useState(0);
  return (
    <PageLayout
      eyebrow="Tổng quan"
      title="Bản thử giao diện"
      description="Ví dụ tương tác nhỏ sử dụng shadcn UI và Tailwind CSS."
    >
      <PageCard
        title="Bộ đếm"
        description="Trang được đăng ký bằng TanStack Router."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setCount((value) => value + 1)}>Tăng</Button>
          <span className="text-sm text-muted-foreground">
            Giá trị: {count}
          </span>
        </div>
      </PageCard>
    </PageLayout>
  );
}
