import PropTypes from "prop-types";
import { CartContext } from "@/hooks/cart-context";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/auth-context";
import { caller } from "@/lib/utils/caller";
import { toast } from "@/lib/toast";
import defaultProductImage from "@/assets/image/product/default.png";
const CART_STORAGE_KEY = "webkitlab-cart";
function normalizeCartItem(item) {
  return {
    id: item.id || item.variantId || item.productId,
    productId: item.productId,
    variantId: item.variantId || null,
    name: item.name || "Sản phẩm trong giỏ hàng",
    variantName: item.variantName || "Phiên bản tiêu chuẩn",
    price: Number(item.price) || 0,
    image: item.image || defaultProductImage,
    quantity: Math.max(1, Number(item.quantity) || 1),
    selected: item.selected !== false,
  };
}
function loadStoredCart() {
  try {
    const storedCart = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "[]",
    );
    return Array.isArray(storedCart)
      ? storedCart.map(normalizeCartItem).filter((item) => item.id)
      : [];
  } catch {
    return [];
  }
}
export function CartProvider({ children }) {
  const { user, loading } = useAuth();
  return (
    <AccountCart
      key={loading ? "loading" : (user?.id ?? "guest")}
      userId={user?.id}
      loading={loading}
    >
      {children}
    </AccountCart>
  );
}
function AccountCart({ children, userId, loading }) {
  const [items, setItems] = useState(() =>
    userId || loading ? [] : loadStoredCart(),
  );
  const [syncing, setSyncing] = useState(Boolean(userId));
  const pending = useRef(userId ? 1 : 0);
  const active = useRef(true);
  const queue = useRef(Promise.resolve());
  const [excluded, setExcluded] = useState([]);
  useEffect(() => {
    active.current = true;
    if (userId) {
      const guest = loadStoredCart().filter(
        (item) =>
          item.variantId &&
          /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
            item.variantId,
          ),
      );
      queue.current = caller({
        url: "/me/cart/merge",
        method: "POST",
        body: {
          items: guest
            .map(({ variantId, quantity }) => ({
              variantId,
              quantity: Math.min(99, Math.floor(quantity)),
            }))
            .slice(0, 100),
        },
      })
        .then((data) => {
          if (active.current) {
            setItems(data.map(normalizeCartItem));
            localStorage.removeItem(CART_STORAGE_KEY);
          }
        })
        .catch((error) => {
          if (active.current)
            toast.add({
              title: "Không thể tải giỏ hàng",
              description: error.message,
              type: "error",
            });
          throw error;
        });
      void queue.current.catch(() => {});
      void queue.current
        .finally(() => {
          pending.current -= 1;
          if (active.current) setSyncing(pending.current > 0);
        })
        .catch(() => {});
    }
    return () => {
      active.current = false;
    };
  }, [userId]);
  const sync = useCallback(
    (url, method, body) => {
      if (!userId || loading) return;
      pending.current += 1;
      setSyncing(true);
      queue.current = queue.current
        .catch(() => {})
        .then(() =>
          active.current
            ? caller({
                url,
                method,
                body,
              })
            : null,
        )
        .then((data) => {
          if (active.current && data) setItems(data.map(normalizeCartItem));
          return Boolean(active.current && data);
        })
        .catch((error) => {
          if (active.current)
            toast.add({
              title: "Không thể đồng bộ giỏ hàng",
              description: error.message,
              type: "error",
            });
          return false;
        })
        .finally(() => {
          pending.current -= 1;
          if (active.current) setSyncing(pending.current > 0);
        });
      return queue.current;
    },
    [userId, loading],
  );
  useEffect(() => {
    if (!userId) return;
    const refresh = () => sync("/me/cart", "GET");
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, [userId, sync]);
  useEffect(() => {
    if (!userId && !loading)
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, userId, loading]);
  const addItem = useCallback(
    (item) => {
      if (loading) return;
      if (userId)
        return sync("/me/cart/items", "POST", {
          variantId: item.variantId,
          quantity: item.quantity ?? 1,
        });
      const normalizedItem = normalizeCartItem(item);
      setItems((currentItems) => {
        const existingItem = currentItems.find(
          (entry) => entry.id === normalizedItem.id,
        );
        if (!existingItem) return [...currentItems, normalizedItem];
        return currentItems.map((entry) =>
          entry.id === normalizedItem.id
            ? {
                ...entry,
                ...normalizedItem,
                quantity: entry.quantity + normalizedItem.quantity,
                selected: true,
              }
            : entry,
        );
      });
    },
    [userId, loading, sync],
  );
  const removeItem = useCallback(
    (id) => {
      if (loading) return;
      if (userId)
        return sync(`/me/cart/items/${encodeURIComponent(id)}`, "DELETE");
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    },
    [userId, loading, sync],
  );
  const updateQuantity = useCallback(
    (id, quantity) => {
      if (loading) return;
      if (userId)
        return sync("/me/cart/items", "PUT", {
          variantId: id,
          quantity,
        });
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(1, Number(quantity) || 1),
              }
            : item,
        ),
      );
    },
    [userId, loading, sync],
  );
  const changeQuantity = useCallback(
    (id, delta) => {
      if (userId)
        return sync("/me/cart/items/adjust", "PATCH", {
          variantId: id,
          delta,
        });
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(99, Math.max(1, item.quantity + delta)),
              }
            : item,
        ),
      );
    },
    [userId, sync],
  );
  const refreshCart = useCallback(() => {
    if (userId) return sync("/me/cart", "GET");
  }, [userId, sync]);
  const toggleItem = useCallback((id, selected) => {
    setExcluded((current) =>
      selected
        ? current.filter((value) => value !== id)
        : [...new Set([...current, id])],
    );
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id
          ? {
              ...item,
              selected,
            }
          : item,
      ),
    );
  }, []);
  const selectAll = useCallback(
    (selected) => {
      setExcluded(selected ? [] : items.map((item) => item.id));
      setItems((currentItems) =>
        currentItems.map((item) => ({
          ...item,
          selected,
        })),
      );
    },
    [items],
  );
  const clearCart = useCallback(
    () => (userId ? sync("/me/cart", "DELETE") : setItems([])),
    [userId, sync],
  );
  const value = useMemo(() => {
    const visible = items.map((item) => ({
      ...item,
      selected: item.selected && !excluded.includes(item.id),
    }));
    const selectedItems = visible.filter((item) => item.selected);
    return {
      addItem,
      clearCart,
      count: items.reduce((total, item) => total + item.quantity, 0),
      items: visible,
      syncing,
      removeItem,
      selectAll,
      selectedItems,
      selectedTotal: selectedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
      toggleItem,
      updateQuantity,
      changeQuantity,
      refreshCart,
    };
  }, [
    addItem,
    clearCart,
    items,
    removeItem,
    selectAll,
    toggleItem,
    updateQuantity,
    changeQuantity,
    refreshCart,
    excluded,
    syncing,
  ]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
CartProvider.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
};
AccountCart.propTypes = {
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  userId: PropTypes.string,
  loading: PropTypes.bool,
};
