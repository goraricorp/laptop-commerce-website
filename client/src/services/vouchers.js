import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth-context";
import { caller } from "@/lib/utils/caller";
export function useVouchers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-vouchers", user?.id],
    enabled: Boolean(user),
    queryFn: () =>
      caller({
        url: "/me/vouchers",
      }),
  });
}
