import { useSyncExternalStore } from "react";
const query = "(max-width: 767px)";
function subscribe(onChange) {
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
const snapshot = () => window.matchMedia(query).matches;
export function useIsMobile() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
