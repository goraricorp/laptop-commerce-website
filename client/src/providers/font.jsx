import PropTypes from "prop-types";
import { FontContext } from "@/hooks/use-font";
import { useEffect, useState } from "react";
import { fonts } from "@/config/fonts";
import { getCookie, removeCookie, setCookie } from "@/lib/cookies";
const DEFAULT_FONT = fonts[0];
const FONT_COOKIE_NAME = "font";
const FONT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export function FontProvider({ children }) {
  const [font, setFontState] = useState(() => {
    const savedFont = getCookie(FONT_COOKIE_NAME);
    return fonts.includes(savedFont) ? savedFont : DEFAULT_FONT;
  });
  useEffect(() => {
    const root = document.documentElement;
    fonts.forEach((item) => root.classList.remove(`font-${item}`));
    root.classList.add(`font-${font}`);
  }, [font]);
  const setFont = (nextFont) => {
    const value = fonts.includes(nextFont) ? nextFont : DEFAULT_FONT;
    setCookie(FONT_COOKIE_NAME, value, FONT_COOKIE_MAX_AGE);
    setFontState(value);
  };
  const resetFont = () => {
    removeCookie(FONT_COOKIE_NAME);
    setFontState(DEFAULT_FONT);
  };
  const value = {
    defaultFont: DEFAULT_FONT,
    font,
    resetFont,
    setFont,
  };
  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}
FontProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
