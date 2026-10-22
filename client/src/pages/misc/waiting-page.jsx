import { StatusPage } from "@/components/page/page-layout";

export default function WaitingPage() {
  return (
    <div className="min-h-svh bg-background">
      <StatusPage
        eyebrow="System"
        title="Waiting"
        description="Your request is queued and will be processed shortly."
      />
    </div>
  );
}
