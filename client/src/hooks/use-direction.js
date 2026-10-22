import { createContext, useContext } from "react";
export const DirectionContext = createContext(null);
export function useDirection() {
  const context = useContext(DirectionContext);
  if (!context)
    throw new Error("useDirection must be used within DirectionProvider");
  return context;
}
