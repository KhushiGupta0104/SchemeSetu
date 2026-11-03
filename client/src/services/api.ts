/**
 * Thin fetch wrapper for the SchemeSetu API.
 * - Sends cookies (HttpOnly access/refresh tokens) with every request.
 * - Adds the CSRF token header to state-changing requests (token kept in memory only).
 * - Transparently refreshes an expired access token once, then retries.
 * - Normalises errors into ApiError with a user-friendly message.
 */
import type { PageMeta } from '@/types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | string[] | undefined | null>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;
let refreshPromise: Promise<boolean> | null = null;

/** Listeners notified when the session ends (refresh failed). */
const sessionListeners = new Set<() => void>();
export function onSessionExpired(fn: () => void) {
  sessionListeners.add(fn);
  return () => {
    sessionListeners.delete(fn);
  };
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    qs.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = qs.toString();
  return `${API_BASE}${path}${s ? `?${s}` : ''}`;
}

async function fetchCsrf(force = false): Promise<string> {
  if (csrfToken && !force) return csrfToken;
  csrfPromise ??= fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' })
    .then(async (r) => {
      if (!r.ok) throw new ApiError(r.status, 'CSRF_UNAVAILABLE', 'Could not start a secure session. Please retry.');
      const j = await r.json();
      csrfToken = j.data.csrfToken as string;
      return csrfToken;
    })
    .finally(() => {
      csrfPromise = null;
    });
  return csrfPromise;
}

async function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const token = await fetchCsrf();
      const r = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': token },
      });
      return r.ok;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshPromise = null), 0);
    }
  })();
  return refreshPromise;
}

async function raw<T>(path: string, opts: RequestOptions, attempt: number): Promise<ApiResult<T>> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') headers['X-CSRF-Token'] = await fetchCsrf();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000);
  opts.signal?.addEventListener('abort', () => controller.abort());

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      credentials: 'include',
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (opts.signal?.aborted) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new ApiError(0, 'TIMEOUT', 'The request took too long. Please check your connection and try again.');
    }
    throw new ApiError(0, 'NETWORK_ERROR', "We couldn't reach SchemeSetu. Check your internet connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  let json: { success?: boolean; data?: T; meta?: PageMeta; error?: { code: string; message: string; details?: [] } } = {};
  try {
    json = await res.json();
  } catch {
    /* non-JSON (e.g. proxy error page) */
  }

  if (res.ok) return { data: json.data as T, meta: json.meta };

  const code = json.error?.code ?? (res.status >= 500 ? 'SERVER_ERROR' : 'ERROR');

  if (attempt === 0 && res.status === 401 && code === 'TOKEN_EXPIRED') {
    if (await refreshSession()) return raw<T>(path, opts, 1);
    sessionListeners.forEach((fn) => fn());
    // Retry once anonymously — public endpoints still work after the session ends.
    return raw<T>(path, opts, 1);
  }
  if (attempt === 0 && res.status === 403 && code === 'CSRF_INVALID') {
    await fetchCsrf(true);
    return raw<T>(path, opts, 1);
  }

  const message =
    json.error?.message ??
    (res.status >= 500 ? 'Something went wrong on our side. Please try again in a moment.' : 'The request could not be completed.');
  throw new ApiError(res.status, code, message, json.error?.details);
}

export function api<T>(path: string, opts: RequestOptions = {}): Promise<ApiResult<T>> {
  return raw<T>(path, opts, 0);
}

/** Convenience: returns only `data`. */
export async function apiData<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  return (await api<T>(path, opts)).data;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
