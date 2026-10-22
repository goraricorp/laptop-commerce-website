import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyHeader, EmptyDescription } from "@/components/ui/empty";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { InputGroupAddon, InputGroupButton } from "@/components/ui/input-group";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import PropTypes from "prop-types";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Boxes,
  ChevronRight,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  UserPlus,
  UserRound,
} from "lucide-react";
import logo from "@/assets/favicon.svg";
import { useCatalogSearch } from "@/services/catalog";
import { Cart } from "@/components/element/cart";
import { Customizer } from "@/components/element/customizer";
import { Notification } from "@/components/element/notification";
import { Shortcut } from "@/components/element/shortcut";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/auth-context";
import { cn } from "@/lib/utils";
import { useLayout } from "@/hooks/use-layout";
const administratorRoles = new Set(["administrator", "master"]);
function getInitials(user) {
  return (
    user?.name?.trim()?.slice(0, 2).toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "ND"
  );
}
function AccountMenu({ logout, user }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Mở menu người dùng"
            className="size-9 rounded-md p-0"
            size="icon"
            variant="ghost"
          />
        }
      >
        {user ? (
          <Avatar className="size-9 rounded-md after:rounded-md">
            <AvatarImage
              alt={user.name || "Người dùng"}
              className="rounded-md"
              src={user.image || user.avatar || undefined}
            />
            <AvatarFallback className="rounded-md">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserRound />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56" sideOffset={6}>
        {user ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span className="truncate text-sm font-medium text-foreground">
                  {user.name || "Người dùng"}
                </span>
                <span className="truncate font-normal">{user.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="h-9"
                render={<Link to="/user/profile" />}
              >
                <UserRound />
                Hồ sơ cá nhân
              </DropdownMenuItem>
              {administratorRoles.has(user.role) ? (
                <DropdownMenuItem className="h-9" render={<Link to="/admin" />}>
                  <Settings />
                  Trang quản trị
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="h-9" onClick={() => void logout()}>
                <LogOut />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : (
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="h-9"
              render={<Link to="/auth/sign-in" />}
            >
              <LogIn />
              Đăng nhập
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-9"
              render={<Link to="/auth/sign-up" />}
            >
              <UserPlus />
              Đăng ký
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function Header({ children, showLogo = true, showNavigation = true }) {
  const { logout, user } = useAuth();
  const { variant } = useLayout();
  const [categoryId, setCategoryId] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [search, setSearch] = useState("");
  const catalogQuery = useCatalogSearch(
    {
      limit: 1,
    },
    {
      enabled: showNavigation,
    },
  );
  const catalog = catalogQuery.data?.facets?.categories ?? [];
  const activeCategory =
    catalog.find((item) => item.id === categoryId) ?? catalog[0];
  const categoryQuery = useCatalogSearch(
    {
      categoryId: activeCategory?.id,
      limit: 1,
    },
    {
      enabled: categoryOpen && Boolean(activeCategory),
    },
  );
  const suggestions = (catalogQuery.data?.facets?.brands ?? [])
    .map((item) => item.name)
    .slice(0, 8);
  const navigate = useNavigate();
  const floating = variant === "floating";
  function submitSearch(event, suggestion = search) {
    event?.preventDefault();
    const q = suggestion.trim();
    void navigate({
      to: "/product/$type",
      params: {
        type: "all",
      },
      search: q
        ? {
            q,
          }
        : {},
    });
    setCategoryOpen(false);
  }
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center",
        floating ? "h-[4.5rem] py-2" : "h-14 border-b bg-background",
      )}
    >
      <div className={cn("w-full", floating && "container mx-auto h-14 px-6")}>
        <div
          className={cn(
            "h-full",
            floating &&
              "rounded-lg bg-background shadow-sm ring-1 ring-sidebar-border",
          )}
        >
          <div
            className={cn(
              "mx-auto flex h-full min-w-0 items-center gap-2 px-4 sm:px-6",
              !floating && "container",
            )}
          >
            {children}
            {showLogo && (
              <Link
                aria-label="Trang chủ Webkitlab"
                className="shrink-0"
                to="/"
              >
                <img
                  alt="Webkitlab"
                  className="size-9 rounded-md object-cover"
                  src={logo}
                />
              </Link>
            )}
            {showNavigation ? (
              <>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        aria-label="Danh mục"
                        variant="outline"
                        size="default"
                        className="shrink-0"
                      />
                    }
                  >
                    <Menu data-icon="inline-start" />
                    <span className="hidden sm:inline">Danh mục</span>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[min(64rem,calc(100vw_-_2rem))] p-0"
                  >
                    <PopoverTitle className="sr-only">
                      Danh mục sản phẩm
                    </PopoverTitle>
                    <ScrollArea className="h-[min(30rem,calc(100svh_-_6rem))]">
                      {activeCategory ? (
                        <Tabs
                          orientation="vertical"
                          value={activeCategory.id}
                          onValueChange={setCategoryId}
                          className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[16rem_1fr]"
                        >
                          <TabsList
                            className="h-auto w-full flex-col items-stretch"
                            aria-label="Danh mục sản phẩm"
                          >
                            {catalog.map((item) => (
                              <TabsTrigger
                                key={item.id}
                                value={item.id}
                                className="justify-start"
                              >
                                <Boxes data-icon="inline-start" />
                                {item.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          <TabsContent
                            value={activeCategory.id}
                            className="flex flex-col gap-4"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <h2 className="text-xl font-semibold">
                                {activeCategory.name}
                              </h2>
                              <Button
                                nativeButton={false}
                                render={
                                  <Link
                                    to="/product/$type"
                                    params={{
                                      type: "all",
                                    }}
                                    search={{
                                      categoryId: activeCategory.id,
                                    }}
                                  />
                                }
                                variant="outline"
                                onClick={() => setCategoryOpen(false)}
                              >
                                Xem tất cả
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {(categoryQuery.data?.facets?.brands ?? []).map(
                                (brand) => (
                                  <Button
                                    key={brand.id}
                                    variant="ghost"
                                    className="justify-start"
                                    nativeButton={false}
                                    render={
                                      <Link
                                        to="/product/$type"
                                        params={{
                                          type: "all",
                                        }}
                                        search={{
                                          categoryId: activeCategory.id,
                                          brandId: brand.id,
                                        }}
                                      />
                                    }
                                    onClick={() => setCategoryOpen(false)}
                                  >
                                    {brand.name}
                                    <ChevronRight data-icon="inline-end" />
                                  </Button>
                                ),
                              )}
                            </div>
                          </TabsContent>
                        </Tabs>
                      ) : (
                        <Empty>
                          <EmptyHeader>
                            <EmptyDescription>
                              Chưa có danh mục sản phẩm.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                <form onSubmit={submitSearch} className="min-w-0 flex-1">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="header-search" className="sr-only">
                        Tìm sản phẩm
                      </FieldLabel>
                      <Combobox
                        items={suggestions}
                        inputValue={search}
                        onInputValueChange={setSearch}
                        onValueChange={(value) => {
                          if (value) submitSearch(null, value);
                        }}
                      >
                        <ComboboxInput
                          id="header-search"
                          aria-label="Tìm sản phẩm"
                          placeholder="Tìm sản phẩm…"
                          showTrigger={false}
                        >
                          <InputGroupAddon align="inline-start">
                            <Search />
                          </InputGroupAddon>
                          <InputGroupAddon align="inline-end">
                            <InputGroupButton
                              type="submit"
                              aria-label="Tìm kiếm"
                              size="icon-sm"
                            >
                              <ChevronRight data-icon="inline-end" />
                            </InputGroupButton>
                          </InputGroupAddon>
                        </ComboboxInput>
                        <ComboboxContent>
                          <ComboboxEmpty>Nhấn Enter để tìm kiếm.</ComboboxEmpty>
                          <ComboboxList>
                            {(suggestion) => (
                              <ComboboxItem key={suggestion} value={suggestion}>
                                {suggestion}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </Field>
                  </FieldGroup>
                </form>
                <Cart />
              </>
            ) : (
              <div className="flex-1" />
            )}
            <div className="flex shrink-0 items-center gap-2">
              <Customizer />
              <div className="hidden items-center gap-2 md:flex">
                <Notification />
                <Shortcut />
              </div>
              <AccountMenu logout={logout} user={user} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
AccountMenu.propTypes = {
  logout: PropTypes.node,
  user: PropTypes.object,
};
Header.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  showLogo: PropTypes.bool,
  showNavigation: PropTypes.bool,
};
