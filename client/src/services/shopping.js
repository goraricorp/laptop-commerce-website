"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { shoppingSchemas } from "@/schemas/shopping";
const groupKey = ["commerce", "shopping"];
const endpoints = {
  addresses: "/address",
  carts: "/cart",
  "cart-items": "/cart/item",
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
function useGetAddresses(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "addresses",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("addresses"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(shoppingSchemas.address.entity),
      }),
  });
}
export { useGetAddresses as getAddresses };
function useGetAddress(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "addresses", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("addresses", id),
        method: "GET",
        schema: shoppingSchemas.address.entity,
      }),
  });
}
export { useGetAddress as getAddress };
function useCreateAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("addresses"),
        method: "POST",
        body: shoppingSchemas.address.create.parse(data),
        schema: shoppingSchemas.address.entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "addresses"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateAddress as createAddress };
function useUpdateAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("addresses", id),
        method: "PATCH",
        body: shoppingSchemas.address.update.parse(data),
        schema: shoppingSchemas.address.entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "addresses"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateAddress as updateAddress };
function useDeleteAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("addresses", id),
        method: "DELETE",
        schema: shoppingSchemas.address.entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "addresses"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteAddress as deleteAddress };
function useGetCarts(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "carts",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("carts"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(shoppingSchemas["cart"].entity),
      }),
  });
}
export { useGetCarts as getCarts };
function useGetCart(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "carts", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("carts", id),
        method: "GET",
        schema: shoppingSchemas["cart"].entity,
      }),
  });
}
export { useGetCart as getCart };
function useCreateCart(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("carts"),
        method: "POST",
        body: shoppingSchemas["cart"].create.parse(data),
        schema: shoppingSchemas["cart"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "carts"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateCart as createCart };
function useUpdateCart(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("carts", id),
        method: "PATCH",
        body: shoppingSchemas["cart"].update.parse(data),
        schema: shoppingSchemas["cart"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "carts"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateCart as updateCart };
function useDeleteCart(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("carts", id),
        method: "DELETE",
        schema: shoppingSchemas["cart"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "carts"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteCart as deleteCart };
function useGetCartItems(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "cart-items",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("cart-items"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(shoppingSchemas["cart-item"].entity),
      }),
  });
}
export { useGetCartItems as getCartItems };
function useGetCartItem(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "cart-items", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("cart-items", id),
        method: "GET",
        schema: shoppingSchemas["cart-item"].entity,
      }),
  });
}
export { useGetCartItem as getCartItem };
function useCreateCartItem(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("cart-items"),
        method: "POST",
        body: shoppingSchemas["cart-item"].create.parse(data),
        schema: shoppingSchemas["cart-item"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "cart-items"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateCartItem as createCartItem };
function useUpdateCartItem(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("cart-items", id),
        method: "PATCH",
        body: shoppingSchemas["cart-item"].update.parse(data),
        schema: shoppingSchemas["cart-item"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "cart-items"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateCartItem as updateCartItem };
function useDeleteCartItem(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("cart-items", id),
        method: "DELETE",
        schema: shoppingSchemas["cart-item"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "cart-items"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteCartItem as deleteCartItem };
export const shoppingServices = {
  addresses: {
    getMany: useGetAddresses,
    getOne: useGetAddress,
    create: useCreateAddress,
    update: useUpdateAddress,
    remove: useDeleteAddress,
  },
  carts: {
    getMany: useGetCarts,
    getOne: useGetCart,
    create: useCreateCart,
    update: useUpdateCart,
    remove: useDeleteCart,
  },
  "cart-items": {
    getMany: useGetCartItems,
    getOne: useGetCartItem,
    create: useCreateCartItem,
    update: useUpdateCartItem,
    remove: useDeleteCartItem,
  },
};
