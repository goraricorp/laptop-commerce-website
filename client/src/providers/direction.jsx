import PropTypes from "prop-types";
import { DirectionContext } from "@/hooks/use-direction";
import { useEffect, useState } from "react";
import { getCookie, removeCookie, setCookie } from "@/lib/cookies";
const DEFAULT_DIRECTION = "ltr";
const DIRECTION_COOKIE_NAME = "dir";
const DIRECTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export function DirectionProvider({ children }) {
  const [dir, setDirState] = useState(() =>
    getCookie(DIRECTION_COOKIE_NAME) === "rtl" ? "rtl" : DEFAULT_DIRECTION,
  );
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);
  const setDir = (nextDir) => {
    const value = nextDir === "rtl" ? "rtl" : "ltr";
    setCookie(DIRECTION_COOKIE_NAME, value, DIRECTION_COOKIE_MAX_AGE);
    setDirState(value);
  };
  const resetDir = () => {
    removeCookie(DIRECTION_COOKIE_NAME);
    setDirState(DEFAULT_DIRECTION);
  };
  const value = {
    defaultDir: DEFAULT_DIRECTION,
    dir,
    resetDir,
    setDir,
  };
  return (
    <DirectionContext.Provider value={value}>
      {children}
    </DirectionContext.Provider>
  );
}
DirectionProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
