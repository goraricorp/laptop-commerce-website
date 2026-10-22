import PropTypes from "prop-types";
import {
  LayoutContext,
  sidebarVariants,
  sidebarCollapsibles,
} from "@/hooks/use-layout";
import { useState } from "react";
import { getCookie, setCookie } from "@/lib/cookies";
const DEFAULT_VARIANT = "sidebar";
const DEFAULT_COLLAPSIBLE = "icon";
const SIDEBAR_OPEN_COOKIE_NAME = "sidebar_state";
const LAYOUT_COLLAPSIBLE_COOKIE_NAME = "layout_collapsible";
const LAYOUT_VARIANT_COOKIE_NAME = "layout_variant";
const LAYOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
function savedValue(name, values, fallback) {
  const value = getCookie(name);
  return values.includes(value) ? value : fallback;
}
export function LayoutProvider({ children }) {
  const [collapsible, setCollapsibleState] = useState(() =>
    savedValue(
      LAYOUT_COLLAPSIBLE_COOKIE_NAME,
      sidebarCollapsibles,
      DEFAULT_COLLAPSIBLE,
    ),
  );
  const [variant, setVariantState] = useState(() =>
    savedValue(LAYOUT_VARIANT_COOKIE_NAME, sidebarVariants, DEFAULT_VARIANT),
  );
  const [sidebarOpen, setSidebarOpenState] = useState(
    () => getCookie(SIDEBAR_OPEN_COOKIE_NAME) !== "false",
  );
  const setCollapsible = (nextCollapsible) => {
    const value = sidebarCollapsibles.includes(nextCollapsible)
      ? nextCollapsible
      : DEFAULT_COLLAPSIBLE;
    setCookie(LAYOUT_COLLAPSIBLE_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE);
    setCollapsibleState(value);
  };
  const setVariant = (nextVariant) => {
    const value = sidebarVariants.includes(nextVariant)
      ? nextVariant
      : DEFAULT_VARIANT;
    setCookie(LAYOUT_VARIANT_COOKIE_NAME, value, LAYOUT_COOKIE_MAX_AGE);
    setVariantState(value);
  };
  const setSidebarOpen = (nextOpen) => {
    const value =
      typeof nextOpen === "function" ? nextOpen(sidebarOpen) : nextOpen;
    setCookie(
      SIDEBAR_OPEN_COOKIE_NAME,
      String(Boolean(value)),
      LAYOUT_COOKIE_MAX_AGE,
    );
    setSidebarOpenState(Boolean(value));
  };
  const resetLayout = () => {
    setCollapsible(DEFAULT_COLLAPSIBLE);
    setVariant(DEFAULT_VARIANT);
    setSidebarOpen(true);
  };
  const value = {
    collapsible,
    defaultCollapsible: DEFAULT_COLLAPSIBLE,
    defaultVariant: DEFAULT_VARIANT,
    resetLayout,
    setCollapsible,
    setSidebarOpen,
    setVariant,
    sidebarOpen,
    variant,
  };
  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  );
}
LayoutProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
