import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useRouterState } from "@tanstack/react-router";
import { oauthErrorMessage } from "@/lib/auth/oauth";
export default function ErrorPage() {
  const search = useRouterState({
    select: (state) => state.location.search,
  });
  return (
    <main className="mx-auto grid min-h-svh max-w-xl content-center gap-5 p-6">
      <h1 className="text-2xl font-semibold">Không thể hoàn tất yêu cầu</h1>
      <Alert variant="destructive">
        <AlertDescription>{oauthErrorMessage(search?.error)}</AlertDescription>
      </Alert>
      <Link to="/auth/sign-in" className="underline">
        Đăng nhập lại
      </Link>
      <Link to="/settings/connections" className="underline">
        Tài khoản đã kết nối
      </Link>
    </main>
  );
}
