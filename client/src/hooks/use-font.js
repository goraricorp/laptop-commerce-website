import { createContext, useContext } from "react";
export const FontContext = createContext(null);
export function useFont() {
  const context = useContext(FontContext);
  if (!context) throw new Error("useFont must be used within FontProvider");
  return context;
}
