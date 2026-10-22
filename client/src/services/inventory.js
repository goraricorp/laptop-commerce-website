"use client";

import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { inventorySchemas } from "@/schemas/inventory";
const groupKey = ["commerce", "inventory"];
const endpoints = {
  "inventory-locations": "/inventory/location",
  "inventory-balances": "/inventory/balance",
  "stock-movements": "/inventory/stock/movement",
};
function endpoint(resource, id) {
  const path = endpoints[resource];
  if (id === undefined) return path;
  const encodedId = String(id).split(":").map(encodeURIComponent).join("/");
  return `${path}/${encodedId}`;
}
function listResponseSchema(entity) {
  return z.object({
    items: z.array(entity),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  });
}
function useGetInventoryLocations(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "inventory-locations",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("inventory-locations"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          inventorySchemas["inventory-location"].entity,
        ),
      }),
  });
}
export { useGetInventoryLocations as getInventoryLocations };
function useGetInventoryLocation(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "inventory-locations", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("inventory-locations", id),
        method: "GET",
        schema: inventorySchemas["inventory-location"].entity,
      }),
  });
}
export { useGetInventoryLocation as getInventoryLocation };
function useCreateInventoryLocation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("inventory-locations"),
        method: "POST",
        body: inventorySchemas["inventory-location"].create.parse(data),
        schema: inventorySchemas["inventory-location"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "inventory-locations"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateInventoryLocation as createInventoryLocation };
function useUpdateInventoryLocation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("inventory-locations", id),
        method: "PATCH",
        body: inventorySchemas["inventory-location"].update.parse(data),
        schema: inventorySchemas["inventory-location"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "inventory-locations"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateInventoryLocation as updateInventoryLocation };
function useDeleteInventoryLocation(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("inventory-locations", id),
        method: "DELETE",
        schema: inventorySchemas["inventory-location"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "inventory-locations"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteInventoryLocation as deleteInventoryLocation };
function useGetInventoryBalances(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "inventory-balances",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("inventory-balances"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          inventorySchemas["inventory-balance"].entity,
        ),
      }),
  });
}
export { useGetInventoryBalances as getInventoryBalances };
function useGetInventoryBalance(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "inventory-balances", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("inventory-balances", id),
        method: "GET",
        schema: inventorySchemas["inventory-balance"].entity,
      }),
  });
}
export { useGetInventoryBalance as getInventoryBalance };
function useCreateInventoryBalance(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("inventory-balances"),
        method: "POST",
        body: inventorySchemas["inventory-balance"].create.parse(data),
        schema: inventorySchemas["inventory-balance"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "inventory-balances"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateInventoryBalance as createInventoryBalance };
function useUpdateInventoryBalance(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("inventory-balances", id),
        method: "PATCH",
        body: inventorySchemas["inventory-balance"].update.parse(data),
        schema: inventorySchemas["inventory-balance"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "inventory-balances"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateInventoryBalance as updateInventoryBalance };
function useDeleteInventoryBalance(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("inventory-balances", id),
        method: "DELETE",
        schema: inventorySchemas["inventory-balance"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "inventory-balances"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteInventoryBalance as deleteInventoryBalance };
function useGetStockMovements(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "stock-movements",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("stock-movements"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(inventorySchemas["stock-movement"].entity),
      }),
  });
}
export { useGetStockMovements as getStockMovements };
function useGetStockMovement(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "stock-movements", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("stock-movements", id),
        method: "GET",
        schema: inventorySchemas["stock-movement"].entity,
      }),
  });
}
export { useGetStockMovement as getStockMovement };
function useCreateStockMovement(options = {}) {
  const queryClient = useQueryClient();
  const pending = useRef(null);
  return useMutation({
    ...options,
    mutationFn: (data) => {
      const body = inventorySchemas["stock-movement"].create.parse(data);
      const hash = JSON.stringify(body);
      if (pending.current?.hash !== hash)
        pending.current = {
          hash,
          id: crypto.randomUUID(),
        };
      return caller({
        url: endpoint("stock-movements"),
        method: "POST",
        body: {
          ...body,
          operationId: pending.current.id,
        },
        schema: inventorySchemas["stock-movement"].entity,
      });
    },
    onSuccess: async (...args) => {
      pending.current = null;
      await queryClient.invalidateQueries({
        queryKey: groupKey,
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateStockMovement as createStockMovement };
function useUpdateStockMovement(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("stock-movements", id),
        method: "PATCH",
        body: inventorySchemas["stock-movement"].update.parse(data),
        schema: inventorySchemas["stock-movement"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "stock-movements"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateStockMovement as updateStockMovement };
function useDeleteStockMovement(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("stock-movements", id),
        method: "DELETE",
        schema: inventorySchemas["stock-movement"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "stock-movements"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteStockMovement as deleteStockMovement };
export const inventoryServices = {
  "inventory-locations": {
    getMany: useGetInventoryLocations,
    getOne: useGetInventoryLocation,
    create: useCreateInventoryLocation,
    update: useUpdateInventoryLocation,
    remove: useDeleteInventoryLocation,
  },
  "inventory-balances": {
    getMany: useGetInventoryBalances,
    getOne: useGetInventoryBalance,
    create: useCreateInventoryBalance,
    update: useUpdateInventoryBalance,
    remove: useDeleteInventoryBalance,
  },
  "stock-movements": {
    getMany: useGetStockMovements,
    getOne: useGetStockMovement,
    create: useCreateStockMovement,
    update: useUpdateStockMovement,
    remove: useDeleteStockMovement,
  },
};
