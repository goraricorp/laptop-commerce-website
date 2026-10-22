import { Link } from "@tanstack/react-router";
import { Info, Newspaper, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLayout } from "@/hooks/use-layout";
const informationLinks = [
  {
    icon: Info,
    label: "Giới thiệu",
    to: "/about",
  },
  {
    icon: PhoneCall,
    label: "Liên hệ",
    to: "/contact",
  },
  {
    icon: Newspaper,
    label: "Tin tức",
    to: "/about",
  },
];
export function CommerceHeader() {
  const { variant } = useLayout();
  const floating = variant === "floating";
  return (
    <div
      className={cn(
        "sticky z-40 flex items-center",
        floating
          ? "top-[4.5rem] h-16 pb-2"
          : "top-14 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      )}
    >
      <div className={cn("w-full", floating && "container mx-auto px-6")}>
        <div
          className={cn(
            "flex h-14 w-full items-center gap-4 overflow-x-auto px-6",
            floating
              ? "rounded-lg bg-background/95 shadow-sm ring-1 ring-sidebar-border backdrop-blur supports-[backdrop-filter]:bg-background/80"
              : "container mx-auto",
          )}
        >
          <nav
            aria-label="Thông tin Webkitlab"
            className="ml-auto flex shrink-0 items-center gap-1"
          >
            {informationLinks.map((item) => (
              <Button
                key={item.label}
                className="h-9"
                nativeButton={false}
                render={<Link to={item.to} />}
                variant="ghost"
              >
                <item.icon className="size-4 lg:hidden" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
