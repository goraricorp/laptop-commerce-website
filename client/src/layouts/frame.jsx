import PropTypes from "prop-types";
import { Outlet } from "@tanstack/react-router";
import { Footer } from "@/components/block/footer";
import { CommerceHeader } from "@/components/block/commerce-header";
import { Header } from "@/components/block/header";
export default function Frame({ children }) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Header />
      <CommerceHeader />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col">
          <div className="container mx-auto p-6">{children ?? <Outlet />}</div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
Frame.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
