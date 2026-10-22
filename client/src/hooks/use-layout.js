import { createContext, useContext } from "react";
export const sidebarVariants = ["sidebar", "floating", "inset"];
export const sidebarCollapsibles = ["offcanvas", "icon", "none"];
export const LayoutContext = createContext(null);
export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) throw new Error("useLayout must be used within LayoutProvider");
  return context;
}
