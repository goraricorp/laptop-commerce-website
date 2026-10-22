import { useState } from "react";
import { SupportDesk } from "@/components/block/support-desk";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
export default function ContactPage() {
  const { user } = useUser(),
    [staff, setStaff] = useState(false);
  return (
    <div className="grid gap-5">
      {["moderator", "administrator", "master"].includes(user?.role) && (
        <Button variant="outline" onClick={() => setStaff(!staff)}>
          {staff ? "Phiếu cá nhân" : "Hỗ trợ khách hàng được phân công"}
        </Button>
      )}
      <SupportDesk key={String(staff)} staff={staff} />
    </div>
  );
}
