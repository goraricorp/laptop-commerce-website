import {
  Bell,
  Boxes,
  ChartNoAxesCombined,
  MessageCircleMore,
  CircleUserRound,
  CreditCard,
  House,
  Link2,
  LockKeyhole,
  MapPin,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  Star,
  Tags,
  Tickets,
  Users,
  Warehouse,
} from "lucide-react";

import logo from "@/assets/favicon.svg";

export const appGlobal = {
  logo,
  name: "Webkitlab",
  plan: "Nền tảng thương mại điện tử",
};

export const adminSidebar = {
  main: [
    { icon: House, title: "Bảng điều khiển", url: "/admin" },
    { icon: ChartNoAxesCombined, title: "Thống kê", url: "/admin/statistics" },
    { icon: Users, title: "Người dùng", url: "/admin/users" },
    {
      icon: Boxes,
      title: "Danh mục",
      url: "/admin/categories",
      items: [
        { title: "Danh mục sản phẩm", url: "/admin/categories" },
        { title: "Thương hiệu", url: "/admin/brands" },
        { title: "Thuộc tính", url: "/admin/attributes" },
      ],
    },
    { icon: Package, title: "Sản phẩm", url: "/admin/products" },
    { icon: Warehouse, title: "Tồn kho", url: "/admin/inventory" },
    { icon: Tags, title: "Khuyến mãi", url: "/admin/promotions" },
    { icon: ShoppingBag, title: "Đơn hàng", url: "/admin/orders" },
    { icon: Star, title: "Đánh giá", url: "/admin/reviews" },
    { icon: MessageCircleMore, title: "Hội thoại", url: "/admin/chat" },
  ],
  secondary: [
    {
      icon: Settings,
      title: "Cài đặt tài khoản",
      url: "/admin/account/settings",
    },
    { icon: Bell, title: "Thông báo", url: "/admin/account/notifications" },
  ],
  projects: [],
};

export const moderatorSidebar = {
  main: [
    { icon: Star, title: "Kiểm duyệt đánh giá", url: "/admin/reviews" },
    {
      icon: MessageCircleMore,
      title: "Hỗ trợ và hội thoại",
      url: "/admin/chat",
    },
  ],
  secondary: [],
  projects: [],
};

export const userSidebar = {
  main: [
    { icon: House, title: "Tổng quan", url: "/user" },
    { icon: CircleUserRound, title: "Thông tin tài khoản", url: "/user/info" },
    { icon: Settings, title: "Cài đặt", url: "/settings/security" },
    { icon: CreditCard, title: "Thanh toán", url: "/user/billing" },
    { icon: MapPin, title: "Địa chỉ", url: "/user/address" },
    { icon: Tickets, title: "Phiếu giảm giá", url: "/user/voucher" },
    { icon: ReceiptText, title: "Đơn hàng", url: "/user/order" },
    { icon: Star, title: "Đánh giá", url: "/user/rating" },
  ],
  secondary: [],
  projects: [],
};

export const settingsSidebar = {
  main: [
    { icon: LockKeyhole, title: "Bảo mật", url: "/settings/security" },
    { icon: Bell, title: "Thông báo", url: "/settings/notification" },
    { icon: Link2, title: "Kết nối", url: "/settings/connections" },
  ],
  secondary: [
    { icon: CircleUserRound, title: "Thông tin tài khoản", url: "/user/info" },
    { icon: CreditCard, title: "Thanh toán", url: "/user/billing" },
  ],
  projects: [],
};
