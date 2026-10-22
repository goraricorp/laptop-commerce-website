import { StatusPage } from "@/components/page/page-layout";

export default function AccountPage() {
  return (
    <div className="min-h-svh bg-background">
      <StatusPage
        eyebrow="Account"
        title="Account settings"
        description="Manage profile information and account preferences."
      />
    </div>
  );
}
