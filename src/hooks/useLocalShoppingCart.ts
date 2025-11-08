// src/hooks/useLocalShoppingCart.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "shoppingCart.v1";

export type CartItem = {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  discountPercent?: number;
  finalPrice: number;
  stock?: number;
  qty: number;
  addedAt: number;
};

export type CartState = {
  items: CartItem[];
  updatedAt: number;
  version: 1;
};

type MinimalProduct = {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  activeDiscount?: { discountPercent?: number | null } | null;
  stock?: number;
};

const safeParse = (raw: string | null): CartState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CartState;
    if (!Array.isArray(parsed?.items)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const computeFinalPrice = (price: number, discountPercent?: number | null) => {
  const d = Math.max(0, Math.min(100, Number(discountPercent ?? 0)));
  const v = price * (1 - d / 100);
  return Math.max(0.01, Number(v.toFixed(2)));
};

const cartEventName = (key: string) => `cart:${key}:updated`;

export function useLocalShoppingCart(storageKey: string = STORAGE_KEY) {
  const initial = useMemo<CartState>(() => {
    if (typeof window === "undefined") return { items: [], updatedAt: Date.now(), version: 1 };
    const parsed = safeParse(localStorage.getItem(storageKey));
    return parsed ?? { items: [], updatedAt: Date.now(), version: 1 };
  }, [storageKey]);

  const [state, setState] = useState<CartState>(initial);
  const writing = useRef(false);

  const persist = useCallback(
    (next: CartState) => {
      try {
        writing.current = true;
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent<CartState>(cartEventName(storageKey), { detail: next }));
      } finally {
        writing.current = false;
      }
    },
    [storageKey]
  );

  useEffect(() => {
    persist(state);
  }, [state, persist]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (writing.current) return;
      if (e.key !== storageKey) return;
      const parsed = safeParse(e.newValue);
      if (parsed) setState(parsed);
    };
    const onLocalBroadcast = (e: Event) => {
      if (writing.current) return;
      const detail = (e as CustomEvent<CartState>).detail;
      if (detail) setState(detail);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(cartEventName(storageKey), onLocalBroadcast as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(cartEventName(storageKey), onLocalBroadcast as EventListener);
    };
  }, [storageKey]);

  const items = state.items;

  const totals = useMemo(() => {
    const count = items.reduce((a, b) => a + b.qty, 0);
    const distinct = items.length;
    const subtotal = items.reduce((a, b) => a + b.finalPrice * b.qty, 0);
    return { count, distinct, subtotal: Number(subtotal.toFixed(2)) };
  }, [items]);

  const findIndex = useCallback((productId: string) => state.items.findIndex(i => i.productId === productId), [state.items]);

  const addProduct = useCallback((product: MinimalProduct, qty: number = 1) => {
    if (!product?._id || qty <= 0) return;
    const finalPrice = computeFinalPrice(product.price, product.activeDiscount?.discountPercent);
    setState((prev) => {
      const idx = prev.items.findIndex(i => i.productId === product._id);
      const max = typeof product.stock === "number" ? Math.max(0, product.stock) : undefined;
      if (idx >= 0) {
        const curr = prev.items[idx];
        const nextQty = max != null ? Math.min(curr.qty + qty, max) : curr.qty + qty;
        const nextItems = [...prev.items];
        nextItems[idx] = { ...curr, qty: nextQty, price: product.price, discountPercent: product.activeDiscount?.discountPercent ?? 0, finalPrice, stock: product.stock };
        return { items: nextItems, updatedAt: Date.now(), version: 1 as const };
      }
      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.price,
        discountPercent: product.activeDiscount?.discountPercent ?? 0,
        finalPrice,
        stock: product.stock,
        qty: max != null ? Math.min(qty, max) : qty,
        addedAt: Date.now(),
      };
      return { items: [...prev.items, newItem], updatedAt: Date.now(), version: 1 as const };
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setState((prev) => {
      const idx = prev.items.findIndex(i => i.productId === productId);
      if (idx < 0) return prev;
      const curr = prev.items[idx];
      const clamped = Math.max(0, qty);
      if (clamped === 0) {
        const nextItems = prev.items.filter(i => i.productId !== productId);
        return { items: nextItems, updatedAt: Date.now(), version: 1 as const };
      }
      const max = typeof curr.stock === "number" ? Math.max(0, curr.stock) : undefined;
      const finalQty = max != null ? Math.min(clamped, max) : clamped;
      const nextItems = [...prev.items];
      nextItems[idx] = { ...curr, qty: finalQty };
      return { items: nextItems, updatedAt: Date.now(), version: 1 as const };
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setState((prev) => {
      if (!prev.items.some(i => i.productId === productId)) return prev;
      return { items: prev.items.filter(i => i.productId !== productId), updatedAt: Date.now(), version: 1 as const };
    });
  }, []);

  const clear = useCallback(() => {
    setState({ items: [], updatedAt: Date.now(), version: 1 });
  }, []);

  const has = useCallback((productId: string) => findIndex(productId) >= 0, [findIndex]);
  const getItem = useCallback((productId: string) => state.items.find(i => i.productId === productId) ?? null, [state.items]);

  return {
    items,
    totals,
    addProduct,
    setQty,
    remove,
    clear,
    has,
    getItem,
    updatedAt: state.updatedAt,
  };
}
