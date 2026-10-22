import { useAuth } from "@/hooks/auth-context";
import { ResourceForm } from "@/components/form/resource-form";
import { adminSchemas } from "@/schemas/admin";
import { adminServices } from "@/services/admin";
const schemas = {
  users: adminSchemas.user,
};
export function UserForm() {
  const { user } = useAuth();
  return (
    <ResourceForm
      description="Quản lý người dùng và vai trò."
      disableCreateResources={["users"]}
      readOnlyResources={user?.role === "master" ? [] : ["users"]}
      schemas={schemas}
      services={adminServices}
      title="Người dùng và xác thực"
    />
  );
}
