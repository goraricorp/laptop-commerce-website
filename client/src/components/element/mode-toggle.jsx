import PropTypes from "prop-types";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { themes, useTheme } from "@/hooks/use-theme";
const themeLabels = {
  dark: "Tối",
  light: "Sáng",
  system: "Hệ thống",
};
const themeIcons = {
  dark: Moon,
  light: Sun,
  system: MonitorCog,
};
export function ModeToggle({ className }) {
  const { setTheme, theme } = useTheme();
  const currentIndex = Math.max(0, themes.indexOf(theme));
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  const ThemeIcon = themeIcons[theme] ?? MonitorCog;
  return (
    <Button
      aria-label={`Giao diện ${themeLabels[theme]}. Chuyển sang ${themeLabels[nextTheme]}.`}
      className={cn("size-9 rounded-md", className)}
      onClick={() => setTheme(nextTheme)}
      size="icon"
      title={`Giao diện: ${themeLabels[theme]}`}
      type="button"
      variant="default"
    >
      <ThemeIcon className="size-4" />
    </Button>
  );
}
ModeToggle.propTypes = {
  className: PropTypes.string,
};
