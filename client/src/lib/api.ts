import type { ApiErrorBody } from '@souk/shared';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; query?: Record<string, unknown> };

export function toQueryString(query?: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function apiUrl(path: string, query?: Record<string, unknown>) {
  return `${BASE}${path}${toQueryString(query)}`;
}

export async function api<T>(path: string, { body, query, headers, ...init }: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path, query), {
      credentials: 'include',
      headers: { ...(body !== undefined && { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Can’t reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'UNKNOWN', err?.message ?? `Request failed (${res.status})`, err?.fields);
  }
  return data as T;
}
