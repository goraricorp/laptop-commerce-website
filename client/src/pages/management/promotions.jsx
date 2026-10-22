import { PromotionForm } from "@/components/form/promotion-form";

export default function Promotions() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Khuyến mãi</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý chương trình, mã áp dụng và theo dõi lượt sử dụng.
        </p>
      </header>
      <PromotionForm />
    </div>
  );
}
