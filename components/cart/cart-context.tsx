"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, CartState } from "@/lib/types";
import { ORDER_REQUEST_ID_KEY } from "@/lib/constants";

const CART_STORAGE_KEY = "dailynest.cart.v1";

interface CartContextValue {
  lines: CartLine[];
  itemCount: number;
  subtotalInPaise: number;
  ready: boolean;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  getLine: (productId: string) => CartLine | undefined;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(state: CartState) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode / quota). Cart still works
    // in-memory for the current session.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch.
  useEffect(() => {
    const stored = readStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage hydration
    if (stored) setLines(stored.lines);
     
    setReady(true);
  }, []);

  // Persist on change.
  useEffect(() => {
    if (!ready) return;
    writeStorage({ lines, updatedAt: Date.now() });
  }, [lines, ready]);

  const addLine = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      setLines((prev) => {
        const existing = prev.find((l) => l.productId === line.productId);
        if (existing) {
          const nextQty = Math.min(
            existing.quantity + quantity,
            Math.max(existing.stockQuantity, 1)
          );
          return prev.map((l) =>
            l.productId === line.productId ? { ...l, quantity: nextQty } : l
          );
        }
        return [...prev, { ...line, quantity: Math.max(1, quantity) }];
      });
    },
    []
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) =>
        l.productId === productId
          ? { ...l, quantity: Math.min(quantity, Math.max(l.stockQuantity, 1)) }
          : l
      );
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const getLine = useCallback(
    (productId: string) => lines.find((l) => l.productId === productId),
    [lines]
  );

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );

  const subtotalInPaise = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const unit =
          l.discountPriceInPaise != null &&
          l.discountPriceInPaise > 0 &&
          l.discountPriceInPaise < l.unitPriceInPaise
            ? l.discountPriceInPaise
            : l.unitPriceInPaise;
        return sum + unit * l.quantity;
      }, 0),
    [lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      itemCount,
      subtotalInPaise,
      ready,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      getLine,
    }),
    [
      lines,
      itemCount,
      subtotalInPaise,
      ready,
      addLine,
      setQuantity,
      removeLine,
      clearCart,
      getLine,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

/**
 * Stable per-browser idempotency key for order placement. Reused across
 * retries of the same logical checkout so a slow network cannot create
 * duplicate orders (also enforced by a unique index in the DB).
 */
export function getClientRequestId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(ORDER_REQUEST_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(ORDER_REQUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return `req-${Date.now()}`;
  }
}

export function rotateClientRequestId() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ORDER_REQUEST_ID_KEY);
  } catch {
    // ignore
  }
}
