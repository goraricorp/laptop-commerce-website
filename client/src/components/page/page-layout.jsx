import PropTypes from "prop-types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
export function PageLayout({ eyebrow, title, description, children }) {
  return (
    <main className="mx-auto flex min-h-svh w-full flex-col gap-6">
      <header className="flex flex-col gap-3">
        {eyebrow && <Badge variant="outline">{eyebrow}</Badge>}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
export function PageCard({ title, description, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function StatusPage({
  eyebrow = "Webkitlab",
  icon,
  title,
  description,
  status = "Sẵn sàng",
}) {
  return (
    <PageLayout eyebrow={eyebrow} title={title} description={description}>
      <PageCard
        title={status}
        description="Trang đã được đăng ký bằng TanStack Router."
      >
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {icon}
          <span>Giao diện đã sẵn sàng để kết nối dữ liệu nghiệp vụ.</span>
        </div>
      </PageCard>
    </PageLayout>
  );
}
PageLayout.propTypes = {
  eyebrow: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
PageCard.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
StatusPage.propTypes = {
  eyebrow: PropTypes.string,
  icon: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  status: PropTypes.string,
};
