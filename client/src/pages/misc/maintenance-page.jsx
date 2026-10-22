import { StatusPage } from "@/components/page/page-layout";

export default function MaintenancePage() {
  return (
    <div className="min-h-svh bg-background">
      <StatusPage
        eyebrow="System"
        title="Maintenance"
        description="This section is temporarily unavailable."
      />
    </div>
  );
}
