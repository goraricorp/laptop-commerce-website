import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { AuthLogo } from "@/components/auth/auth-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export function AuthLayout({
  children,
  className,
  description,
  footer,
  title,
}) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="items-center text-center">
        <div className="flex w-full justify-center">
          <AuthLogo />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center text-center text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}
AuthLayout.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  className: PropTypes.string,
  description: PropTypes.node,
  footer: PropTypes.node,
  title: PropTypes.node,
};
