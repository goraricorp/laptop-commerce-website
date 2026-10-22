import { useOrderPage } from "@/hooks/use-order-page";
import { useQuery } from "@tanstack/react-query";
import { caller } from "@/lib/utils/caller";
export const checkoutApi = {
  methods: () =>
    caller({
      url: "/checkout/methods",
      method: "GET",
    }),
  quote: (checkout) =>
    caller({
      url: "/checkout/quote",
      method: "POST",
      body: checkout,
    }),
  place: (body) =>
    caller({
      url: "/checkout/orders",
      method: "POST",
      body,
    }),
  order: (id) =>
    caller({
      url: `/me/orders/${encodeURIComponent(id)}`,
      method: "GET",
    }),
  orders: (query = {}) =>
    caller({
      url: "/me/orders",
      method: "GET",
      query,
    }),
  pay: (id) =>
    caller({
      url: `/checkout/orders/${encodeURIComponent(id)}/pay`,
      method: "POST",
    }),
  refresh: (id) =>
    caller({
      url: `/checkout/orders/${encodeURIComponent(id)}/refresh`,
      method: "POST",
    }),
  cancel: (id) =>
    caller({
      url: `/checkout/orders/${encodeURIComponent(id)}/cancel`,
      method: "POST",
    }),
};
export function usePaymentMethods() {
  return useQuery({
    queryKey: ["checkout-methods"],
    queryFn: checkoutApi.methods,
  });
}
export function useCustomerOrders(userId, filters = {}) {
  return useOrderPage(
    ["my-orders", userId],
    "/me/orders",
    filters,
    Boolean(userId),
  );
}
