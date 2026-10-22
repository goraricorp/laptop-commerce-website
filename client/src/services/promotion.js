"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { promotionSchemas } from "@/schemas/promotion";
const groupKey = ["commerce", "promotion"];
const endpoints = {
  promotions: "/promotion",
  "promotion-codes": "/promotion/code",
  "promotion-usages": "/promotion/usage",
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
function useGetPromotions(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "promotions",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("promotions"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(promotionSchemas["promotion"].entity),
      }),
  });
}
export { useGetPromotions as getPromotions };
function useGetPromotion(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "promotions", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("promotions", id),
        method: "GET",
        schema: promotionSchemas["promotion"].entity,
      }),
  });
}
export { useGetPromotion as getPromotion };
function useCreatePromotion(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("promotions"),
        method: "POST",
        body: promotionSchemas["promotion"].create.parse(data),
        schema: promotionSchemas["promotion"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotions"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreatePromotion as createPromotion };
function useUpdatePromotion(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("promotions", id),
        method: "PATCH",
        body: promotionSchemas["promotion"].update.parse(data),
        schema: promotionSchemas["promotion"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotions"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdatePromotion as updatePromotion };
function useDeletePromotion(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("promotions", id),
        method: "DELETE",
        schema: promotionSchemas["promotion"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotions"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeletePromotion as deletePromotion };
function useGetPromotionCodes(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "promotion-codes",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("promotion-codes"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(promotionSchemas["promotion-code"].entity),
      }),
  });
}
export { useGetPromotionCodes as getPromotionCodes };
function useGetPromotionCode(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "promotion-codes", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("promotion-codes", id),
        method: "GET",
        schema: promotionSchemas["promotion-code"].entity,
      }),
  });
}
export { useGetPromotionCode as getPromotionCode };
function useCreatePromotionCode(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("promotion-codes"),
        method: "POST",
        body: promotionSchemas["promotion-code"].create.parse(data),
        schema: promotionSchemas["promotion-code"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotion-codes"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreatePromotionCode as createPromotionCode };
function useUpdatePromotionCode(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("promotion-codes", id),
        method: "PATCH",
        body: promotionSchemas["promotion-code"].update.parse(data),
        schema: promotionSchemas["promotion-code"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotion-codes"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdatePromotionCode as updatePromotionCode };
function useDeletePromotionCode(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("promotion-codes", id),
        method: "DELETE",
        schema: promotionSchemas["promotion-code"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotion-codes"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeletePromotionCode as deletePromotionCode };
function useGetPromotionUsages(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "promotion-usages",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("promotion-usages"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(promotionSchemas["promotion-usage"].entity),
      }),
  });
}
export { useGetPromotionUsages as getPromotionUsages };
function useGetPromotionUsage(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "promotion-usages", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("promotion-usages", id),
        method: "GET",
        schema: promotionSchemas["promotion-usage"].entity,
      }),
  });
}
export { useGetPromotionUsage as getPromotionUsage };
function useCreatePromotionUsage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("promotion-usages"),
        method: "POST",
        body: promotionSchemas["promotion-usage"].create.parse(data),
        schema: promotionSchemas["promotion-usage"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotion-usages"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreatePromotionUsage as createPromotionUsage };
function useUpdatePromotionUsage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("promotion-usages", id),
        method: "PATCH",
        body: promotionSchemas["promotion-usage"].update.parse(data),
        schema: promotionSchemas["promotion-usage"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotion-usages"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdatePromotionUsage as updatePromotionUsage };
function useDeletePromotionUsage(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("promotion-usages", id),
        method: "DELETE",
        schema: promotionSchemas["promotion-usage"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "promotion-usages"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeletePromotionUsage as deletePromotionUsage };
export const promotionServices = {
  promotions: {
    getMany: useGetPromotions,
    getOne: useGetPromotion,
    create: useCreatePromotion,
    update: useUpdatePromotion,
    remove: useDeletePromotion,
  },
  "promotion-codes": {
    getMany: useGetPromotionCodes,
    getOne: useGetPromotionCode,
    create: useCreatePromotionCode,
    update: useUpdatePromotionCode,
    remove: useDeletePromotionCode,
  },
  "promotion-usages": {
    getMany: useGetPromotionUsages,
    getOne: useGetPromotionUsage,
    create: useCreatePromotionUsage,
    update: useUpdatePromotionUsage,
    remove: useDeletePromotionUsage,
  },
};
