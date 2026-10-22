import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import { Link } from "@tanstack/react-router";
import { Bell, CheckCheck, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
const notifications = [];
export function Notification() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Mở thông báo"
            className="relative size-9 rounded-md"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Bell className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,22rem)] gap-0 overflow-hidden p-0"
        sideOffset={10}
      >
        <div className="flex h-14 items-center justify-between gap-2.5 border-b ps-5 pe-2.5">
          <PopoverTitle className="font-semibold">Thông báo</PopoverTitle>
          <div className="flex items-center gap-2">
            <Badge variant="default">{notifications.length} mới</Badge>
            <Button
              aria-label="Đánh dấu tất cả đã đọc"
              disabled={!notifications.length}
              className="size-9"
              size="icon"
              variant="ghost"
            >
              <CheckCheck data-icon="inline-start" />
            </Button>
          </div>
          <PopoverDescription className="sr-only">
            Danh sách thông báo gần đây
          </PopoverDescription>
        </div>
        <ScrollArea className="h-[min(20rem,50svh)]">
          <Empty>
            <EmptyHeader>
              <EmptyDescription>Chưa có thông báo.</EmptyDescription>
            </EmptyHeader>
          </Empty>
          {notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <article
                key={`${notification.title}-${notification.time}`}
                className="flex gap-3 border-b p-4"
              >
                <Avatar className="size-10">
                  {notification.avatar ? (
                    <AvatarImage
                      alt={notification.title}
                      src={notification.avatar}
                    />
                  ) : null}
                  <AvatarFallback>
                    {Icon ? <Icon className="size-5" /> : notification.fallback}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {notification.time}
                  </p>
                </div>
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
              </article>
            );
          })}
        </ScrollArea>
        <div className="p-4">
          <Button
            className="w-full"
            nativeButton={false}
            render={<Link to="/user" />}
          >
            <Mail data-icon="inline-start" />
            Xem tất cả thông báo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
