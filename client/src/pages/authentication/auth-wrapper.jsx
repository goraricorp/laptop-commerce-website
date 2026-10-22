import PropTypes from "prop-types";
import { Card, CardContent } from "@/components/ui/card";
export function AuthWrapper({ children }) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4 sm:p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardContent className="p-6 sm:p-8">{children}</CardContent>
      </Card>
    </main>
  );
}
AuthWrapper.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
