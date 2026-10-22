"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { reviewSchemas } from "@/schemas/review";
const groupKey = ["commerce", "review"];
const endpoints = {
  "product-reviews": "/review",
};
const moderationEndpoint = "/review/moderation";
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
function useGetProductReviews(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "product-reviews",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("product-reviews"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          reviewSchemas["product-review"].entity.omit({
            userId: true,
            orderItemId: true,
            guestName: true,
          }),
        ),
      }),
  });
}
export { useGetProductReviews as getProductReviews };
function useGetProductReviewsForModeration(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "product-reviews",
      "moderation",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: moderationEndpoint,
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(
          reviewSchemas["product-review"].entity.extend({
            productName: z.string().nullable().optional(),
            userName: z.string().nullable().optional(),
            orderItemName: z.string().nullable().optional(),
          }),
        ),
      }),
  });
}
export { useGetProductReviewsForModeration as getProductReviewsForModeration };
function useGetProductReview(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "product-reviews", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: `${moderationEndpoint}/${encodeURIComponent(id)}`,
        method: "GET",
        schema: reviewSchemas["product-review"].entity,
      }),
  });
}
export { useGetProductReview as getProductReview };
function useCreateProductReview(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("product-reviews"),
        method: "POST",
        body: reviewSchemas["product-review"].create.parse(data),
        schema: reviewSchemas["product-review"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-reviews"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateProductReview as createProductReview };
function useUpdateProductReview(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("product-reviews", id),
        method: "PATCH",
        body: reviewSchemas["product-review"].update.parse(data),
        schema: reviewSchemas["product-review"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-reviews"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateProductReview as updateProductReview };
function useDeleteProductReview(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("product-reviews", id),
        method: "DELETE",
        schema: reviewSchemas["product-review"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "product-reviews"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteProductReview as deleteProductReview };
export const reviewServices = {
  "product-reviews": {
    getMany: useGetProductReviewsForModeration,
    getOne: useGetProductReview,
    create: useCreateProductReview,
    update: useUpdateProductReview,
    remove: useDeleteProductReview,
  },
};
