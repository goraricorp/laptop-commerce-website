import { ReviewForm } from "@/components/form/review-form";

export default function Reviews() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Kiểm duyệt đánh giá</h1>
        <p className="text-sm text-muted-foreground">
          Kiểm tra nội dung, điểm số, giao dịch đã xác minh và trạng thái hiển
          thị.
        </p>
      </header>
      <ReviewForm />
    </div>
  );
}
