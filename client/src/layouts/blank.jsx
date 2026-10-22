import PropTypes from "prop-types";
import { Link, Outlet } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { Background } from "@/components/block/background";
import { ModeToggle } from "@/components/element/mode-toggle";
import { Button } from "@/components/ui/button";
export default function Blank({ children }) {
  return (
    <Background animationSpeed={30}>
      <Button
        aria-label="Về trang chủ"
        className="fixed left-2.5 top-2.5 z-20 size-9 rounded-md"
        nativeButton={false}
        render={<Link to="/" />}
        size="icon"
        title="Về trang chủ"
        variant="default"
      >
        <Home data-icon="inline-start" />
      </Button>
      <ModeToggle className="fixed right-2.5 top-2.5 z-20" />
      <div className="relative z-10 flex w-full max-w-md flex-col gap-6 px-4 py-10">
        {children ?? <Outlet />}
      </div>
    </Background>
  );
}
Blank.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
