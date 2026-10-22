import PropTypes from "prop-types";
import { ThemeContext, themes, colorThemes } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { getCookie, removeCookie, setCookie } from "@/lib/cookies";
const DEFAULT_THEME = "system";
const DEFAULT_COLOR_THEME = "primary";
const THEME_COOKIE_NAME = "theme";
const COLOR_COOKIE_NAME = "color";
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
function isAllowed(value, values, fallback) {
  return values.includes(value) ? value : fallback;
}
export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  defaultColor = DEFAULT_COLOR_THEME,
}) {
  const [theme, setThemeState] = useState(() =>
    isAllowed(getCookie(THEME_COOKIE_NAME), themes, defaultTheme),
  );
  const [color, setColorState] = useState(() =>
    isAllowed(getCookie(COLOR_COOKIE_NAME), colorThemes, defaultColor),
  );
  const [systemTheme, setSystemTheme] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  const resolvedTheme = theme === "system" ? systemTheme : theme;
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) =>
      setSystemTheme(event.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    delete root.dataset.theme;
    root.dataset.color = color;
    root.style.colorScheme = resolvedTheme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor)
      themeColor.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#0f172a" : "#ffffff",
      );
  }, [color, resolvedTheme]);
  const setTheme = (nextTheme) => {
    const validTheme = isAllowed(nextTheme, themes, DEFAULT_THEME);
    setCookie(THEME_COOKIE_NAME, validTheme, THEME_COOKIE_MAX_AGE);
    setThemeState(validTheme);
  };
  const setColor = (nextColor) => {
    const validColor = isAllowed(nextColor, colorThemes, DEFAULT_COLOR_THEME);
    setCookie(COLOR_COOKIE_NAME, validColor, THEME_COOKIE_MAX_AGE);
    setColorState(validColor);
  };
  const resetTheme = () => {
    removeCookie(THEME_COOKIE_NAME);
    removeCookie(COLOR_COOKIE_NAME);
    setThemeState(defaultTheme);
    setColorState(defaultColor);
  };
  const value = {
    color,
    defaultColor,
    defaultTheme,
    resetTheme,
    resolvedTheme,
    setColor,
    setTheme,
    theme,
  };
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
ThemeProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  defaultTheme: PropTypes.string,
  defaultColor: PropTypes.string,
};
