import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
export function useOrderPage(key, url, filters = {}, enabled = true) {
  const client = useQueryClient(),
    identity = JSON.stringify([key, filters]);
  const [saved, setSaved] = useState(null);
  const navigation =
    saved?.identity === identity
      ? saved
      : { identity, cursor: undefined, asOf: undefined, previous: [] };
  const query = useQuery({
    queryKey: [...key, filters, navigation.cursor, navigation.asOf],
    enabled,
    queryFn: () =>
      caller({
        url,
        query: { ...filters, cursor: navigation.cursor, asOf: navigation.asOf },
      }),
  });
  return {
    ...query,
    page: navigation.previous.length + 1,
    next: () => {
      if (query.data?.nextCursor)
        setSaved({
          ...navigation,
          cursor: query.data.nextCursor,
          asOf: query.data.asOf,
          previous: [
            ...navigation.previous,
            { cursor: navigation.cursor, asOf: query.data.asOf },
          ],
        });
    },
    previous: () => {
      const last = navigation.previous.at(-1);
      if (last)
        setSaved({
          ...navigation,
          ...last,
          previous: navigation.previous.slice(0, -1),
        });
    },
    refresh: () => {
      setSaved(null);
      return client.invalidateQueries({ queryKey: key });
    },
  };
}
