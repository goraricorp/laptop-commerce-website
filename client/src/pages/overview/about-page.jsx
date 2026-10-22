import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import asusStoreImage from "@/assets/image/overviews/asus-store.jpg";
import dellStoreImage from "@/assets/image/overviews/dell-store.jpg";
import lenovoStoreImage from "@/assets/image/overviews/lenovo-store.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
const values = [
  {
    icon: HeartHandshake,
    title: "Tư vấn trung thực",
    description:
      "Đề xuất sản phẩm dựa trên nhu cầu thực tế và ngân sách của khách hàng.",
  },
  {
    icon: BadgeCheck,
    title: "Sản phẩm chính hãng",
    description: "Nguồn gốc minh bạch, đầy đủ hóa đơn và chính sách bảo hành.",
  },
  {
    icon: Lightbulb,
    title: "Không ngừng đổi mới",
    description:
      "Liên tục cập nhật công nghệ, quy trình và trải nghiệm mua sắm.",
  },
  {
    icon: ShieldCheck,
    title: "Đồng hành lâu dài",
    description: "Hỗ trợ kỹ thuật và hậu mãi xuyên suốt vòng đời thiết bị.",
  },
];
const milestones = [
  {
    value: "10+",
    label: "Năm kinh nghiệm",
  },
  {
    value: "50.000+",
    label: "Khách hàng tin tưởng",
  },
  {
    value: "30+",
    label: "Thương hiệu đối tác",
  },
  {
    value: "98%",
    label: "Khách hàng hài lòng",
  },
];
export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="relative min-h-[30rem] overflow-hidden rounded-2xl border">
        <img
          src={dellStoreImage}
          alt="Không gian Webkitlab"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="relative flex min-h-[30rem] max-w-3xl flex-col justify-center gap-5 p-8 text-white sm:p-14">
          <Badge className="w-fit bg-white/15 text-white">Về Webkitlab</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Công nghệ phù hợp giúp mỗi người tiến xa hơn
          </h1>
          <p className="text-lg leading-8 text-white/80">
            Webkitlab là hệ thống bán lẻ laptop, máy tính, linh kiện và phụ kiện
            công nghệ. Chúng tôi kết hợp tư vấn chuyên môn, sản phẩm chính hãng
            và dịch vụ hậu mãi để tạo nên trải nghiệm mua sắm đáng tin cậy.
          </p>
          <Button
            nativeButton={false}
            render={<Link to="/contact" />}
            size="lg"
            className="w-fit"
          >
            Trò chuyện cùng chuyên gia
            <ArrowRight data-icon="inline-start" />
          </Button>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Câu chuyện của chúng tôi
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Từ một cửa hàng laptop đến hệ sinh thái công nghệ đa ngành hàng
          </h2>
          <div className="flex flex-col gap-3 leading-7 text-muted-foreground">
            <p>
              Webkitlab bắt đầu với mong muốn giúp khách hàng lựa chọn đúng
              chiếc laptop cho học tập và công việc. Qua từng năm, danh mục được
              mở rộng sang máy tính để bàn, linh kiện, màn hình, thiết bị âm
              thanh, phụ kiện setup và giải pháp cho doanh nghiệp.
            </p>
            <p>
              Chúng tôi hiểu rằng thông số kỹ thuật chỉ là một phần của quyết
              định mua hàng. Điều quan trọng hơn là thiết bị phải phù hợp với
              cách bạn làm việc, không gian sử dụng và kế hoạch nâng cấp trong
              tương lai.
            </p>
            <p>
              Vì vậy, mỗi điểm chạm từ website, chatbot, tư vấn viên đến trung
              tâm bảo hành đều được xây dựng để cung cấp thông tin rõ ràng và hỗ
              trợ nhanh chóng.
            </p>
          </div>
        </div>
        <img
          src={lenovoStoreImage}
          alt="Khu trải nghiệm laptop"
          className="min-h-80 w-full rounded-2xl object-cover"
        />
      </section>

      <section className="grid grid-cols-2 gap-3 rounded-2xl bg-primary p-6 text-primary-foreground md:grid-cols-4 md:p-10">
        {milestones.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 text-center">
            <p className="text-3xl font-bold sm:text-4xl">{item.value}</p>
            <p className="text-sm text-primary-foreground/75">{item.label}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Giá trị cốt lõi
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            Điều Webkitlab luôn theo đuổi
          </h2>
          <p className="text-muted-foreground">
            Mỗi sản phẩm và dịch vụ đều được đánh giá dựa trên lợi ích lâu dài
            dành cho khách hàng.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => (
            <Card key={value.title}>
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="size-5" />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-semibold">{value.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid overflow-hidden rounded-2xl border bg-card lg:grid-cols-2">
        <img
          src={asusStoreImage}
          alt="Đội ngũ tư vấn Webkitlab"
          className="h-full min-h-80 w-full object-cover"
        />
        <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
          <Store className="size-10 text-primary" />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Trải nghiệm tại cửa hàng
            </p>
            <h2 className="text-3xl font-bold">
              Được thử, được hỏi và được chọn kỹ
            </h2>
            <p className="leading-7 text-muted-foreground">
              Không gian trải nghiệm cho phép bạn trực tiếp kiểm tra màn hình,
              bàn phím, hiệu năng và khả năng kết nối. Đội ngũ tư vấn luôn sẵn
              sàng so sánh các lựa chọn một cách rõ ràng.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Chuyên viên giàu kinh nghiệm
            </span>
            <span className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              Đối tác chính hãng
            </span>
          </div>
          <Button
            nativeButton={false}
            render={<Link to="/contact" />}
            variant="outline"
            className="w-fit"
          >
            Tìm cửa hàng gần bạn
          </Button>
        </div>
      </section>
    </div>
  );
}
