import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  CreditCard,
  Link2,
  LockKeyhole,
  UserRound,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const items = [
  { icon: UserRound, label: "Thông tin", to: "/user/info" },
  { icon: Star, label: "Yêu thích", to: "/user/favorites" },
  { icon: Star, label: "Đánh giá", to: "/user/rating" },
  { icon: LockKeyhole, label: "Bảo mật", to: "/settings/security" },
  { icon: CreditCard, label: "Thanh toán", to: "/user/billing" },
  { icon: Bell, label: "Thông báo", to: "/settings/notification" },
  { icon: Link2, label: "Kết nối", to: "/settings/connections" },
];

export function AccountNavigation() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <nav className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Button
            className="h-9 shrink-0"
            key={item.to}
            nativeButton={false}
            render={<Link to={item.to} />}
            variant={active ? "default" : "ghost"}
          >
            <item.icon data-icon="inline-start" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}
