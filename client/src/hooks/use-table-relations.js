import { useQueries } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
import { relationRequests } from "@/lib/utils/admin-table";

export function useTableRelations(rows, keys) {
  const requests = relationRequests(rows, keys);
  return useQueries({
    queries: requests.map(({ resource, ids }) => ({
      queryKey: ["admin-table-labels", resource, ids],
      queryFn: () =>
        caller({
          url: `/admin/pickers/${resource}`,
          query: { ids: ids.join(","), limit: 50 },
        }),
      staleTime: 60_000,
    })),
    combine(results) {
      const labels = {};
      const items = {};
      results.forEach((result, index) => {
        const resource = requests[index].resource;
        labels[resource] ??= {};
        items[resource] ??= {};
        for (const item of result.data?.items ?? []) {
          labels[resource][item.id] = item.label;
          items[resource][item.id] = item;
        }
      });
      return {
        labels,
        items,
        isPending: results.some((result) => result.isPending),
        error: results.find((result) => result.isError)?.error,
      };
    },
  });
}
