import { createContext, useContext } from "react";
export const themes = ["system", "light", "dark"];
export const colorThemes = [
  "primary",
  "main",
  "primary-1",
  "primary-2",
  "primary-3",
  "primary-4",
  "primary-5",
];
export const ThemeContext = createContext(null);
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
