import { Link } from "@tanstack/react-router";

import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthWrapper } from "@/pages/authentication/auth-wrapper";

export default function AuthenticationIndex() {
  return (
    <AuthWrapper>
      <div className="flex flex-col items-center gap-3 text-center">
        <AuthLogo />
        <h1 className="text-xl font-semibold">Tài khoản Webkitlab</h1>
        <p className="text-sm text-muted-foreground">
          Chọn thao tác để tiếp tục.
        </p>
        <Link to="/auth/sign-in" className="font-medium hover:underline">
          Đăng nhập
        </Link>
        <Link to="/auth/sign-up" className="font-medium hover:underline">
          Đăng ký
        </Link>
      </div>
    </AuthWrapper>
  );
}
