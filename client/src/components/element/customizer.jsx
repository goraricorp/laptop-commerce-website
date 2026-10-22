import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PropTypes from "prop-types";
import { Check, Palette, RotateCcw } from "lucide-react";
import { IconDir } from "@/assets/custom/icon-dir";
import { IconLayoutCompact } from "@/assets/custom/icon-layout-compact";
import { IconLayoutDefault } from "@/assets/custom/icon-layout-default";
import { IconLayoutFull } from "@/assets/custom/icon-layout-full";
import { IconSidebarFloating } from "@/assets/custom/icon-sidebar-floating";
import { IconSidebarInset } from "@/assets/custom/icon-sidebar-inset";
import { IconSidebarSidebar } from "@/assets/custom/icon-sidebar-sidebar";
import { IconThemeDark } from "@/assets/custom/icon-theme-dark";
import { IconThemeLight } from "@/assets/custom/icon-theme-light";
import { IconThemeSystem } from "@/assets/custom/icon-theme-system";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { fonts } from "@/config/fonts";
import { cn } from "@/lib/utils";
import { useDirection } from "@/hooks/use-direction";
import { useFont } from "@/hooks/use-font";
import { useLayout } from "@/hooks/use-layout";
import { useTheme } from "@/hooks/use-theme";
const themeOptions = [
  {
    icon: IconThemeSystem,
    isTheme: true,
    label: "Hệ thống",
    value: "system",
  },
  {
    icon: IconThemeLight,
    isTheme: true,
    label: "Sáng",
    value: "light",
  },
  {
    icon: IconThemeDark,
    isTheme: true,
    label: "Tối",
    value: "dark",
  },
];
const colorOptions = [
  {
    color: "var(--theme-current-primary)",
    label: "Mặc định",
    value: "primary",
  },
  {
    color: "#EC6683",
    label: "Chủ đạo",
    value: "main",
  },
  {
    color: "#696cff",
    label: "Màu 1",
    value: "primary-1",
  },
  {
    color: "#0d9394",
    label: "Màu 2",
    value: "primary-2",
  },
  {
    color: "#ffab1d",
    label: "Màu 3",
    value: "primary-3",
  },
  {
    color: "#eb3d63",
    label: "Màu 4",
    value: "primary-4",
  },
  {
    color: "#2092ec",
    label: "Màu 5",
    value: "primary-5",
  },
];
const sidebarOptions = [
  {
    icon: IconSidebarSidebar,
    label: "Thanh bên",
    value: "sidebar",
  },
  {
    icon: IconSidebarFloating,
    label: "Nổi",
    value: "floating",
  },
  {
    icon: IconSidebarInset,
    label: "Lồng",
    value: "inset",
  },
];
const layoutOptions = [
  {
    icon: IconLayoutDefault,
    label: "Mặc định",
    value: "default",
  },
  {
    icon: IconLayoutCompact,
    label: "Thu gọn",
    value: "icon",
  },
  {
    icon: IconLayoutFull,
    label: "Toàn màn hình",
    value: "offcanvas",
  },
];
function IconDirectionLtr(props) {
  return <IconDir dir="ltr" {...props} />;
}
function IconDirectionRtl(props) {
  return <IconDir dir="rtl" {...props} />;
}
function ConfigSection({ children, onReset, reset, title }) {
  return (
    <section>
      <div className="mb-3 flex h-5 items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        {reset ? (
          <Button
            aria-label={`Đặt lại ${title.toLowerCase()}`}
            className="rounded-full"
            onClick={onReset}
            size="icon-xs"
            variant="secondary"
          >
            <RotateCcw data-icon="inline-start" />
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
function OptionGrid({ columns = 3, onChange, options, value }) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        if (values[0]) onChange(values[0]);
      }}
      variant="outline"
      className={cn(
        "grid w-full gap-3",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            aria-label={`Chọn ${option.label.toLowerCase()}`}
            className="h-auto min-w-0 flex-col gap-2 p-2"
          >
            {Icon && (
              <span
                className="block h-16 w-full"
                aria-label={`Xem trước tùy chọn ${option.label}`}
                role="img"
              >
                <Icon aria-hidden="true" className="size-full" />
              </span>
            )}
            <span>{option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
function ColorGrid({ onChange, value }) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        if (values[0]) onChange(values[0]);
      }}
      variant="outline"
      className="flex-wrap gap-3"
    >
      {colorOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="h-auto gap-1 p-1"
        >
          <span
            aria-hidden="true"
            className="size-6 rounded"
            style={{
              backgroundColor: option.color,
            }}
          />
          {value === option.value && <Check data-icon="inline-end" />}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
export function Customizer() {
  const direction = useDirection();
  const font = useFont();
  const layout = useLayout();
  const theme = useTheme();
  const layoutValue = layout.sidebarOpen ? "default" : layout.collapsible;
  function resetAll() {
    direction.resetDir();
    font.resetFont();
    layout.resetLayout();
    theme.resetTheme();
  }
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            aria-label="Mở tùy chỉnh giao diện"
            className="size-9 rounded-md"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Palette className="size-4" />
      </SheetTrigger>
      <SheetContent className="w-[min(92vw,26rem)] sm:max-w-md">
        <SheetHeader className="border-b pb-4 text-start">
          <SheetTitle>Tùy chỉnh giao diện</SheetTitle>
          <SheetDescription>
            Điều chỉnh màu sắc và bố cục của Webkitlab.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-7 px-4 pb-4">
            <ConfigSection
              onReset={() => theme.setTheme(theme.defaultTheme)}
              reset={theme.theme !== theme.defaultTheme}
              title="Giao diện"
            >
              <OptionGrid
                onChange={theme.setTheme}
                options={themeOptions}
                value={theme.theme}
              />
            </ConfigSection>
            <ConfigSection
              onReset={() => theme.setColor(theme.defaultColor)}
              reset={theme.color !== theme.defaultColor}
              title="Màu sắc"
            >
              <ColorGrid onChange={theme.setColor} value={theme.color} />
            </ConfigSection>
            <ConfigSection
              onReset={() => font.setFont(font.defaultFont)}
              reset={font.font !== font.defaultFont}
              title="Phông chữ"
            >
              <OptionGrid
                columns={3}
                onChange={font.setFont}
                options={fonts.map((value) => ({
                  label:
                    value === "system"
                      ? "Hệ thống"
                      : value[0].toUpperCase() + value.slice(1),
                  value,
                }))}
                value={font.font}
              />
            </ConfigSection>
            <ConfigSection
              onReset={() => layout.setVariant(layout.defaultVariant)}
              reset={layout.variant !== layout.defaultVariant}
              title="Thanh bên"
            >
              <OptionGrid
                onChange={layout.setVariant}
                options={sidebarOptions}
                value={layout.variant}
              />
            </ConfigSection>
            <ConfigSection
              onReset={() => {
                layout.setSidebarOpen(true);
                layout.setCollapsible(layout.defaultCollapsible);
              }}
              reset={layoutValue !== "default"}
              title="Bố cục"
            >
              <OptionGrid
                onChange={(value) => {
                  if (value === "default") return layout.setSidebarOpen(true);
                  layout.setCollapsible(value);
                  layout.setSidebarOpen(false);
                }}
                options={layoutOptions}
                value={layoutValue}
              />
            </ConfigSection>
            <ConfigSection
              onReset={() => direction.setDir(direction.defaultDir)}
              reset={direction.dir !== direction.defaultDir}
              title="Hướng hiển thị"
            >
              <OptionGrid
                columns={2}
                onChange={direction.setDir}
                options={[
                  {
                    icon: IconDirectionLtr,
                    label: "Trái sang phải",
                    value: "ltr",
                  },
                  {
                    icon: IconDirectionRtl,
                    label: "Phải sang trái",
                    value: "rtl",
                  },
                ]}
                value={direction.dir}
              />
            </ConfigSection>
          </div>
        </ScrollArea>
        <SheetFooter className="border-t">
          <Button onClick={resetAll} variant="destructive">
            <RotateCcw data-icon="inline-start" />
            Đặt lại toàn bộ
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
ConfigSection.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onReset: PropTypes.func,
  reset: PropTypes.func,
  title: PropTypes.node,
};
OptionGrid.propTypes = {
  columns: PropTypes.number,
  onChange: PropTypes.func,
  options: PropTypes.array,
  value: PropTypes.node,
};
ColorGrid.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.node,
};
