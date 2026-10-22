import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemMedia,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CircleHelp,
  LayoutGrid,
  PanelTopOpen,
  PieChart,
  PlusCircle,
  ReceiptText,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
const shortcuts = [
  {
    description: "Lịch hẹn",
    icon: CalendarDays,
    label: "Lịch",
    to: "/user/order",
  },
  {
    description: "Quản lý hóa đơn",
    icon: ReceiptText,
    label: "Hóa đơn",
    to: "/user/bill",
  },
  {
    description: "Quản lý người dùng",
    icon: UserRound,
    label: "Người dùng",
    to: "/admin/users",
  },
  {
    description: "Phân quyền",
    icon: ShieldCheck,
    label: "Vai trò",
    to: "/admin/users",
  },
  {
    description: "Bảng điều khiển",
    icon: PieChart,
    label: "Tổng quan",
    to: "/admin/statistics",
  },
  {
    description: "Cài đặt tài khoản",
    icon: Settings,
    label: "Cài đặt",
    to: "/admin/account/settings",
  },
  {
    description: "Câu hỏi và hỗ trợ",
    icon: CircleHelp,
    label: "Trợ giúp",
    to: "/contact",
  },
  {
    description: "Các cửa sổ hữu ích",
    icon: PanelTopOpen,
    label: "Tiện ích",
    to: "/admin",
  },
];
export function Shortcut() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Mở lối tắt"
            className="size-9 rounded-md"
            size="icon"
            variant="ghost"
          />
        }
      >
        <LayoutGrid className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,22rem)] gap-0 overflow-hidden p-0"
        sideOffset={10}
      >
        <div className="flex h-14 items-center justify-between gap-2.5 border-b ps-5 pe-2.5">
          <PopoverTitle className="font-semibold">Lối tắt</PopoverTitle>
          <Button
            aria-label="Thêm lối tắt"
            disabled
            className="size-9"
            size="icon"
            variant="ghost"
          >
            <PlusCircle data-icon="inline-start" />
          </Button>
          <PopoverDescription className="sr-only">
            Truy cập nhanh các khu vực thường dùng
          </PopoverDescription>
        </div>
        <ScrollArea className="h-[min(27rem,60svh)]">
          <div className="grid grid-cols-2 gap-2 p-2">
            {shortcuts.map((shortcut) => (
              <Item
                key={shortcut.label}
                variant="outline"
                className="min-h-36 flex-col text-center"
                render={<Link to={shortcut.to} />}
              >
                <ItemMedia variant="icon">
                  <shortcut.icon />
                </ItemMedia>
                <ItemContent className="items-center">
                  <ItemTitle>{shortcut.label}</ItemTitle>
                  <ItemDescription className="text-center">
                    {shortcut.description}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
