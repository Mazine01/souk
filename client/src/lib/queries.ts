import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Address,
  AdminStats,
  Category,
  LoginInput,
  Order,
  OrderStatus,
  Paginated,
  Product,
  ProductCard,
  ProductQuery,
  RegisterInput,
  User,
} from '@souk/shared';
import { api, ApiError } from './api';

// ---------- Auth ----------

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api<{ user: User }>('/api/auth/me')).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api<{ user: User }>('/api/auth/login', { method: 'POST', body: input }),
    onSuccess: ({ user }) => qc.setQueryData(['me'], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterInput) => api<{ user: User }>('/api/auth/register', { method: 'POST', body: input }),
    onSuccess: ({ user }) => qc.setQueryData(['me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['cart'] });
      qc.removeQueries({ queryKey: ['orders'] });
      qc.removeQueries({ queryKey: ['admin'] });
      qc.setQueryData(['me'], null);
    },
  });
}

// ---------- Catalog ----------

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api<{ data: Category[] }>('/api/categories')).data,
    staleTime: 10 * 60 * 1000,
  });
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => api<Paginated<ProductCard>>('/api/products', { query: query as Record<string, unknown> }),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => api<{ data: Product; related: ProductCard[] }>(`/api/products/${encodeURIComponent(slug)}`),
  });
}

// ---------- Orders ----------

export function useOrders(enabled = true) {
  return useQuery({ queryKey: ['orders'], queryFn: async () => (await api<{ data: Order[] }>('/api/orders')).data, enabled });
}

export function useOrder(id: number) {
  return useQuery({ queryKey: ['orders', id], queryFn: async () => (await api<{ data: Order }>(`/api/orders/${id}`)).data });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { address: Address; saveAddress: boolean; note?: string }) =>
      (await api<{ data: Order }>('/api/checkout', { method: 'POST', body })).data,
    onSuccess: (order) => {
      qc.setQueryData(['orders', order.id], order);
      return Promise.all(['cart', 'orders', 'products', 'product', 'me'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api<{ data: Order }>(`/api/orders/${id}/cancel`, { method: 'POST' })).data,
    onSuccess: (order) => {
      qc.setQueryData(['orders', order.id], order);
      return qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// ---------- Admin ----------

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: async () => (await api<{ data: AdminStats }>('/api/admin/stats')).data });
}

export function useAdminProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['admin', 'products', query],
    queryFn: () => api<Paginated<Product>>('/api/admin/products', { query: query as Record<string, unknown> }),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrders(status?: OrderStatus) {
  return useQuery({
    queryKey: ['admin', 'orders', status ?? 'all'],
    queryFn: async () => (await api<{ data: Order[] }>('/api/admin/orders', { query: { status } })).data,
  });
}

const refreshAdmin = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all(['admin', 'products', 'product', 'categories'].map((k) => qc.invalidateQueries({ queryKey: [k] })));

export function useSaveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id?: number; body: Record<string, unknown> }) =>
      (await api<{ data: Product }>(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PATCH' : 'POST', body })).data,
    onSuccess: () => refreshAdmin(qc),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<{ result: 'hidden' | 'deleted'; message?: string }>(`/api/admin/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => refreshAdmin(qc),
  });
}

export function useSetOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: OrderStatus }) =>
      (await api<{ data: Order }>(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status } })).data,
    onSuccess: () => refreshAdmin(qc),
  });
}
