import PropTypes from "prop-types";
import { useComparisonIds } from "@/hooks/use-comparison";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { caller } from "@/lib/utils/caller";
import { useUser } from "@/hooks/use-user";
export function ShoppingActions({ productId, variantId }) {
  const { user } = useUser(),
    client = useQueryClient(),
    [ids, setIds] = useComparisonIds();
  const favorite = useQuery({
    queryKey: ["favorite", user?.id, productId],
    enabled: Boolean(user),
    queryFn: () =>
      caller({
        url: `/me/favorites/${productId}`,
      }),
  });
  const save = useMutation({
    mutationFn: () =>
      caller({
        url: `/me/favorites/${productId}`,
        method: favorite.data?.favorite ? "DELETE" : "PUT",
        body: {},
      }),
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ["favorite"],
      });
      void client.invalidateQueries({
        queryKey: ["favorites"],
      });
      toast.add({
        title: "Đã cập nhật danh sách yêu thích",
        type: "success",
      });
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  const compare = useMutation({
    mutationFn: async () => {
      const proposed = ids.includes(variantId)
        ? ids.filter((id) => id !== variantId)
        : [...ids, variantId];
      if (proposed.length > 4) throw new Error("Chỉ so sánh tối đa 4 SKU.");
      if (proposed.length)
        await caller({
          url: "/catalog/comparison",
          method: "POST",
          body: {
            variantIds: proposed,
          },
        });
      setIds(proposed);
    },
    onError: (e) =>
      toast.add({
        title: e.message,
        type: "error",
      }),
  });
  return (
    <div className="flex flex-wrap gap-2">
      {user ? (
        <Button
          variant="outline"
          disabled={save.isPending || favorite.isPending}
          aria-pressed={Boolean(favorite.data?.favorite)}
          onClick={() => save.mutate()}
        >
          {favorite.data?.favorite ? "Bỏ yêu thích" : "Yêu thích"}
        </Button>
      ) : (
        <Link className="underline" to="/auth/sign-in">
          Đăng nhập để lưu yêu thích
        </Link>
      )}
      {variantId && (
        <Button
          variant="outline"
          disabled={compare.isPending}
          aria-pressed={ids.includes(variantId)}
          onClick={() => compare.mutate()}
        >
          {ids.includes(variantId) ? "Bỏ so sánh" : "Thêm so sánh"}
        </Button>
      )}
      <Link className="self-center underline" to="/comparison">
        So sánh ({ids.length}/4)
      </Link>
    </div>
  );
}
ShoppingActions.propTypes = {
  productId: PropTypes.string.isRequired,
  variantId: PropTypes.string,
};
