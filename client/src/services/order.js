"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { caller } from "@/lib/utils/caller";
import { useOrderPage } from "@/hooks/use-order-page";
import { orderSchemas, orderStatusChangeSchema } from "@/schemas/order";
const groupKey = ["commerce", "order"];
const endpoints = {
  orders: "/order/sale",
  "order-items": "/order/item",
  "order-addresses": "/order/address",
  payments: "/payment",
  shipments: "/shipment",
  "order-status-histories": "/order/status-history",
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
function useGetOrders(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "orders",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("orders"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(orderSchemas["sales-order"].entity),
      }),
  });
}
export { useGetOrders as getOrders };
function useGetOrder(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "orders", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("orders", id),
        method: "GET",
        schema: orderSchemas["sales-order"].entity,
      }),
  });
}
export { useGetOrder as getOrder };
function useCreateOrder(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("orders"),
        method: "POST",
        body: orderSchemas["sales-order"].create.parse(data),
        schema: orderSchemas["sales-order"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "orders"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateOrder as createOrder };
function useUpdateOrder(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("orders", id),
        method: "PATCH",
        body: orderSchemas["sales-order"].update.parse(data),
        schema: orderSchemas["sales-order"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "orders"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateOrder as updateOrder };
function useDeleteOrder(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("orders", id),
        method: "DELETE",
        schema: orderSchemas["sales-order"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "orders"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteOrder as deleteOrder };
function useChangeOrderStatus(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: `${endpoint("orders", id)}/status`,
        method: "PATCH",
        body: orderStatusChangeSchema.parse(data),
        schema: orderSchemas["sales-order"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "orders"],
      });
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-status-histories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useChangeOrderStatus as changeOrderStatus };
function useGetOrderItems(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "order-items",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("order-items"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(orderSchemas["sales-order-item"].entity),
      }),
  });
}
export { useGetOrderItems as getOrderItems };
function useGetOrderItem(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "order-items", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("order-items", id),
        method: "GET",
        schema: orderSchemas["sales-order-item"].entity,
      }),
  });
}
export { useGetOrderItem as getOrderItem };
function useCreateOrderItem(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("order-items"),
        method: "POST",
        body: orderSchemas["sales-order-item"].create.parse(data),
        schema: orderSchemas["sales-order-item"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-items"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateOrderItem as createOrderItem };
function useUpdateOrderItem(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("order-items", id),
        method: "PATCH",
        body: orderSchemas["sales-order-item"].update.parse(data),
        schema: orderSchemas["sales-order-item"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-items"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateOrderItem as updateOrderItem };
function useDeleteOrderItem(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("order-items", id),
        method: "DELETE",
        schema: orderSchemas["sales-order-item"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-items"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteOrderItem as deleteOrderItem };
function useGetOrderAddresses(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "order-addresses",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("order-addresses"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(orderSchemas["order-address"].entity),
      }),
  });
}
export { useGetOrderAddresses as getOrderAddresses };
function useGetOrderAddress(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "order-addresses", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("order-addresses", id),
        method: "GET",
        schema: orderSchemas["order-address"].entity,
      }),
  });
}
export { useGetOrderAddress as getOrderAddress };
function useCreateOrderAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("order-addresses"),
        method: "POST",
        body: orderSchemas["order-address"].create.parse(data),
        schema: orderSchemas["order-address"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-addresses"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateOrderAddress as createOrderAddress };
function useUpdateOrderAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("order-addresses", id),
        method: "PATCH",
        body: orderSchemas["order-address"].update.parse(data),
        schema: orderSchemas["order-address"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-addresses"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateOrderAddress as updateOrderAddress };
function useDeleteOrderAddress(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("order-addresses", id),
        method: "DELETE",
        schema: orderSchemas["order-address"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-addresses"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteOrderAddress as deleteOrderAddress };
function useGetPayments(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "payments",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("payments"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(orderSchemas["payment"].entity),
      }),
  });
}
export { useGetPayments as getPayments };
function useGetPayment(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "payments", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("payments", id),
        method: "GET",
        schema: orderSchemas["payment"].entity,
      }),
  });
}
export { useGetPayment as getPayment };
function useCreatePayment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("payments"),
        method: "POST",
        body: orderSchemas["payment"].create.parse(data),
        schema: orderSchemas["payment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "payments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreatePayment as createPayment };
function useUpdatePayment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("payments", id),
        method: "PATCH",
        body: orderSchemas["payment"].update.parse(data),
        schema: orderSchemas["payment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "payments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdatePayment as updatePayment };
function useDeletePayment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("payments", id),
        method: "DELETE",
        schema: orderSchemas["payment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "payments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeletePayment as deletePayment };
function useGetShipments(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "shipments",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("shipments"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(orderSchemas["shipment"].entity),
      }),
  });
}
export { useGetShipments as getShipments };
function useGetShipment(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "shipments", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("shipments", id),
        method: "GET",
        schema: orderSchemas["shipment"].entity,
      }),
  });
}
export { useGetShipment as getShipment };
function useCreateShipment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("shipments"),
        method: "POST",
        body: orderSchemas["shipment"].create.parse(data),
        schema: orderSchemas["shipment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "shipments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateShipment as createShipment };
function useUpdateShipment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("shipments", id),
        method: "PATCH",
        body: orderSchemas["shipment"].update.parse(data),
        schema: orderSchemas["shipment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "shipments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateShipment as updateShipment };
function useDeleteShipment(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("shipments", id),
        method: "DELETE",
        schema: orderSchemas["shipment"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "shipments"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteShipment as deleteShipment };
function useGetOrderStatusHistories(params = {}, options = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  return useQuery({
    ...options,
    queryKey: [
      ...groupKey,
      "order-status-histories",
      {
        page,
        limit,
      },
    ],
    queryFn: () =>
      caller({
        url: endpoint("order-status-histories"),
        method: "GET",
        query: {
          page,
          limit,
        },
        schema: listResponseSchema(orderSchemas["order-status-history"].entity),
      }),
  });
}
export { useGetOrderStatusHistories as getOrderStatusHistories };
function useGetOrderStatusHistory(id, options = {}) {
  return useQuery({
    ...options,
    queryKey: [...groupKey, "order-status-histories", id],
    enabled: Boolean(id) && (options.enabled ?? true),
    queryFn: () =>
      caller({
        url: endpoint("order-status-histories", id),
        method: "GET",
        schema: orderSchemas["order-status-history"].entity,
      }),
  });
}
export { useGetOrderStatusHistory as getOrderStatusHistory };
function useCreateOrderStatusHistory(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (data) =>
      caller({
        url: endpoint("order-status-histories"),
        method: "POST",
        body: orderSchemas["order-status-history"].create.parse(data),
        schema: orderSchemas["order-status-history"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-status-histories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useCreateOrderStatusHistory as createOrderStatusHistory };
function useUpdateOrderStatusHistory(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: ({ id, data }) =>
      caller({
        url: endpoint("order-status-histories", id),
        method: "PATCH",
        body: orderSchemas["order-status-history"].update.parse(data),
        schema: orderSchemas["order-status-history"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-status-histories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useUpdateOrderStatusHistory as updateOrderStatusHistory };
function useDeleteOrderStatusHistory(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (id) =>
      caller({
        url: endpoint("order-status-histories", id),
        method: "DELETE",
        schema: orderSchemas["order-status-history"].entity,
      }),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({
        queryKey: [...groupKey, "order-status-histories"],
      });
      await options.onSuccess?.(...args);
    },
  });
}
export { useDeleteOrderStatusHistory as deleteOrderStatusHistory };
export const orderServices = {
  orders: {
    getMany: useGetOrders,
    getOne: useGetOrder,
    create: useCreateOrder,
    update: useUpdateOrder,
    remove: useDeleteOrder,
  },
  "order-items": {
    getMany: useGetOrderItems,
    getOne: useGetOrderItem,
    create: useCreateOrderItem,
    update: useUpdateOrderItem,
    remove: useDeleteOrderItem,
  },
  "order-addresses": {
    getMany: useGetOrderAddresses,
    getOne: useGetOrderAddress,
    create: useCreateOrderAddress,
    update: useUpdateOrderAddress,
    remove: useDeleteOrderAddress,
  },
  payments: {
    getMany: useGetPayments,
    getOne: useGetPayment,
    create: useCreatePayment,
    update: useUpdatePayment,
    remove: useDeletePayment,
  },
  shipments: {
    getMany: useGetShipments,
    getOne: useGetShipment,
    create: useCreateShipment,
    update: useUpdateShipment,
    remove: useDeleteShipment,
  },
  "order-status-histories": {
    getMany: useGetOrderStatusHistories,
    getOne: useGetOrderStatusHistory,
    create: useCreateOrderStatusHistory,
    update: useUpdateOrderStatusHistory,
    remove: useDeleteOrderStatusHistory,
  },
};
export function useAdminOrderPage(filters = {}) {
  return useOrderPage([...groupKey, "orders"], "/admin/orders", filters);
}
