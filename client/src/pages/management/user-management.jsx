import { UserForm } from "@/components/form/user-form";

export default function UserManagement() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Quản lý người dùng</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý hồ sơ, vai trò và dữ liệu xác thực của người dùng.
        </p>
      </header>
      <UserForm />
    </div>
  );
}
