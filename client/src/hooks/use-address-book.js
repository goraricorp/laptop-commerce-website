import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { caller } from "@/lib/utils/caller";

export function formatAddress(address) {
  return [
    address.addressLine,
    address.ward,
    address.district,
    address.province,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function useAddressBook() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const queryKey = ["my-addresses", user?.id];
  const query = useQuery({
    queryKey,
    enabled: Boolean(user),
    queryFn: () => caller({ url: "/me/addresses", method: "GET" }),
  });
  const create = useMutation({
    mutationFn: (data) =>
      caller({ url: "/me/addresses", method: "POST", body: data }),
    onSuccess: (address) => {
      queryClient.setQueryData(queryKey, (current) => [
        address,
        ...(current ?? []).map((item) =>
          address.isDefault ? { ...item, isDefault: false } : item,
        ),
      ]);
      void queryClient.invalidateQueries({ queryKey });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, data }) =>
      caller({
        url: `/me/addresses/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: data,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const remove = useMutation({
    mutationFn: (id) =>
      caller({
        url: `/me/addresses/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return {
    ...query,
    addresses: user && !query.isError ? (query.data ?? []) : [],
    user,
    create,
    update,
    remove,
  };
}
