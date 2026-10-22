import { StatusPage } from "@/components/page/page-layout";

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-svh bg-background">
      <StatusPage
        eyebrow="System"
        title="Not authorized"
        description="Your account does not have permission to view this page."
      />
    </div>
  );
}
