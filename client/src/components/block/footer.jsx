import { Button } from "@/components/ui/button";
import { NewsletterForm } from "@/components/block/newsletter-form";
import { Link } from "@tanstack/react-router";
import {
  CircleHelp,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageCircleMore,
  PackageSearch,
  Phone,
  ReceiptText,
  ShoppingCart,
  Tickets,
  UserRound,
} from "lucide-react";
import { IconFacebook, IconTelegram, IconWhatsapp } from "@/assets/brand";
import logo from "@/assets/favicon.svg";
import { Separator } from "@/components/ui/separator";
const companyInformation = [
  {
    icon: MapPin,
    text: "Hệ thống cửa hàng Webkitlab trên toàn quốc",
  },
  {
    icon: Phone,
    text: "Hotline: 1900 0000",
  },
  {
    icon: Mail,
    text: "Email: hotro@webkitlab.vn",
  },
  {
    icon: Clock3,
    text: "Phục vụ khách hàng từ 08:00 đến 22:00 mỗi ngày",
  },
];
const footerSections = [
  {
    title: "Mua sắm",
    items: [
      {
        icon: PackageSearch,
        name: "Tất cả sản phẩm",
        to: "/product/all",
      },
      {
        icon: ShoppingCart,
        name: "Giỏ hàng",
        to: "/pay/cart",
      },
      {
        icon: ReceiptText,
        name: "Đơn hàng của tôi",
        to: "/user/order",
      },
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    items: [
      {
        icon: Headphones,
        name: "Liên hệ hỗ trợ",
        to: "/contact",
      },
      {
        icon: MessageCircleMore,
        name: "Phiếu hỗ trợ",
        to: "/contact",
      },
      {
        icon: CircleHelp,
        name: "Giới thiệu Webkitlab",
        to: "/about",
      },
    ],
  },
  {
    title: "Tài khoản",
    items: [
      {
        icon: UserRound,
        name: "Hồ sơ cá nhân",
        to: "/user/profile",
      },
      {
        icon: MapPin,
        name: "Sổ địa chỉ",
        to: "/user/address",
      },
      {
        icon: Tickets,
        name: "Phiếu giảm giá",
        to: "/user/voucher",
      },
    ],
  },
];
const socialNetworks = [
  {
    icon: IconFacebook,
    label: "Facebook",
    href: "https://facebook.com",
    hoverClass: "hover:bg-[#1877f2]",
  },
  {
    icon: IconTelegram,
    label: "Telegram",
    href: "https://telegram.org",
    hoverClass: "hover:bg-[#229ed9]",
  },
  {
    icon: IconWhatsapp,
    label: "WhatsApp",
    href: "https://whatsapp.com",
    hoverClass: "hover:bg-[#25d366]",
  },
];
const legalLinks = [
  {
    label: "Chính sách bảo mật",
    href: "#chinh-sach-bao-mat",
  },
  {
    label: "Điều khoản sử dụng",
    href: "#dieu-khoan-su-dung",
  },
  {
    label: "Chính sách cookie",
    href: "#chinh-sach-cookie",
  },
  {
    label: "Sơ đồ trang",
    href: "#so-do-trang",
  },
];
export function Footer() {
  return (
    <footer className="mt-auto w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto p-6">
        <NewsletterForm />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-5">
          <section className="flex flex-col gap-5 md:col-span-2 md:row-span-2 lg:col-span-2">
            <Link className="mb-6 flex w-fit items-center gap-3" to="/">
              <img
                alt="Logo Webkitlab"
                className="size-24 rounded-3xl"
                src={logo}
              />
              <span className="text-2xl font-bold">Webkitlab</span>
            </Link>

            <p className="max-w-xl leading-relaxed text-muted-foreground">
              Webkitlab cung cấp laptop, máy tính, linh kiện và phụ kiện công
              nghệ chính hãng, đi kèm dịch vụ tư vấn, giao hàng và hậu mãi tận
              tâm.
            </p>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Thông tin liên hệ
              </h2>
              {companyInformation.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="flex items-center gap-3" key={item.text}>
                    <Icon className="size-5 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Phản hồi
              </h2>
              <p className="text-sm text-muted-foreground">
                Mọi góp ý của bạn đều giúp Webkitlab nâng cao chất lượng sản
                phẩm và dịch vụ.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                Kết nối với chúng tôi
              </h2>
              <div className="flex items-center gap-2">
                {socialNetworks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Button
                      aria-label={social.label}
                      key={social.label}
                      variant="ghost"
                      size="icon"
                      nativeButton={false}
                      render={
                        <a
                          href={social.href}
                          rel="noreferrer"
                          target="_blank"
                        />
                      }
                    >
                      <Icon data-icon="inline-start" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>

          {footerSections.map((section) => (
            <section className="flex flex-col gap-3" key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              <nav className="flex flex-col gap-1" aria-label={section.title}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      className="flex min-h-9 items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      key={item.name}
                      to={item.to}
                    >
                      <Icon className="size-5 shrink-0 text-primary" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </section>
          ))}
        </div>

        <Separator className="my-8 bg-secondary" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2020–{new Date().getFullYear()} Webkitlab. Đã đăng ký bản quyền.
          </p>
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm"
            aria-label="Thông tin pháp lý"
          >
            {legalLinks.map((item) => (
              <a
                className="text-muted-foreground transition-colors hover:text-professional-main"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
