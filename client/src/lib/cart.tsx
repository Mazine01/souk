import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MAX_QTY_PER_LINE, type Cart } from '@souk/shared';
import { api } from './api';
import { useMe } from './queries';

const KEY = 'souk_cart_v1';
type Line = { productId: number; quantity: number };

function readLocal(): Line[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((l) => Number.isInteger(l?.productId) && Number.isInteger(l?.quantity) && l.quantity > 0) : [];
  } catch {
    return [];
  }
}
function writeLocal(lines: Line[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* private mode: the cart lives for this tab only */
  }
}

interface CartApi {
  cart: Cart | undefined;
  isLoading: boolean;
  count: number;
  quantityOf: (productId: number) => number;
  setQuantity: (productId: number, quantity: number) => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartApi | null>(null);

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart needs <CartProvider>');
  return c;
}

/**
 * One cart API over two storages. Signed out, the cart lives in this browser
 * and is priced by the server on every change. Signed in, it lives in the
 * database. Signing in merges the browser cart into the account cart.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { data: me, isLoading: meLoading } = useMe();
  const signedIn = Boolean(me);
  const [local, setLocal] = useState<Line[]>(readLocal);
  const [open, setOpen] = useState(false);

  const serverCart = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api<{ data: Cart }>('/api/cart')).data,
    enabled: signedIn,
  });

  const guestCart = useQuery({
    queryKey: ['cart-preview', local],
    queryFn: async () => (await api<{ data: Cart }>('/api/cart/preview', { method: 'POST', body: { items: local } })).data,
    enabled: !signedIn && !meLoading,
    placeholderData: (prev) => prev,
  });

  // Merge once per sign-in.
  const merged = useRef<number | null>(null);
  const merge = useMutation({
    mutationFn: async (items: Line[]) => (await api<{ data: Cart }>('/api/cart/merge', { method: 'POST', body: { items } })).data,
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      setLocal([]);
      writeLocal([]);
    },
  });
  useEffect(() => {
    if (me && merged.current !== me.id) {
      merged.current = me.id;
      if (local.length) merge.mutate(local);
    }
    if (!me) merged.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const setServerQty = useMutation({
    mutationFn: async ({ productId, quantity }: Line) =>
      (await api<{ data: Cart }>(`/api/cart/items/${productId}`, { method: 'PUT', body: { quantity } })).data,
    onSuccess: (cart) => qc.setQueryData(['cart'], cart),
  });

  const cart = signedIn ? serverCart.data : local.length ? guestCart.data : { lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0, itemCount: 0 };

  const quantityOf = useCallback((id: number) => cart?.lines.find((l) => l.productId === id)?.quantity ?? 0, [cart]);

  const setQuantity = useCallback(
    async (productId: number, quantity: number) => {
      const q = Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(quantity)));
      if (signedIn) {
        await setServerQty.mutateAsync({ productId, quantity: q });
      } else {
        setLocal((prev) => {
          const next = q === 0 ? prev.filter((l) => l.productId !== productId) : prev.some((l) => l.productId === productId) ? prev.map((l) => (l.productId === productId ? { ...l, quantity: q } : l)) : [...prev, { productId, quantity: q }];
          writeLocal(next);
          return next;
        });
      }
    },
    [signedIn, setServerQty],
  );

  const add = useCallback(
    (productId: number, quantity = 1) => setQuantity(productId, quantityOf(productId) + quantity),
    [setQuantity, quantityOf],
  );

  const value = useMemo<CartApi>(
    () => ({
      cart,
      isLoading: signedIn ? serverCart.isLoading : guestCart.isLoading && local.length > 0,
      count: cart?.itemCount ?? local.reduce((a, l) => a + l.quantity, 0),
      quantityOf,
      setQuantity,
      add,
      open,
      setOpen,
    }),
    [cart, signedIn, serverCart.isLoading, guestCart.isLoading, local, quantityOf, setQuantity, add, open],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
