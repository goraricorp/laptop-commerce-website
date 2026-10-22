import { useEffect, useState } from "react";
export const comparisonKey = "laptop-comparison-skus";
export function readComparison() {
  try {
    const ids = JSON.parse(localStorage.getItem(comparisonKey) ?? "[]");
    return Array.isArray(ids)
      ? [
          ...new Set(
            ids.filter(
              (id) =>
                typeof id === "string" &&
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  id,
                ),
            ),
          ),
        ].slice(0, 4)
      : [];
  } catch {
    return [];
  }
}
function writeComparison(ids) {
  localStorage.setItem(comparisonKey, JSON.stringify(ids));
  window.dispatchEvent(new Event("comparison-changed"));
}
export function useComparisonIds() {
  const [ids, setIds] = useState(readComparison);
  useEffect(() => {
    const refresh = () => setIds(readComparison());
    window.addEventListener("comparison-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("comparison-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return [ids, writeComparison];
}
