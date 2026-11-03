import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthApi } from '@/services/endpoints';
import { ApiError, onSessionExpired } from '@/services/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
export const ME_KEY = ['auth', 'me'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return (await AuthApi.me()).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
  });

  const clearSession = useCallback(() => {
    qc.setQueryData(ME_KEY, null);
    // Drop all personal data from the cache.
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' && q.queryKey[0] !== 'meta' });
  }, [qc]);

  useEffect(() => onSessionExpired(clearSession), [clearSession]);

  const afterAuth = useCallback(
    async (user: User) => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' && q.queryKey[0] !== 'meta' });
      qc.setQueryData(ME_KEY, user);
      return user;
    },
    [qc],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data ?? null,
      isLoading,
      login: async (email, password) => afterAuth((await AuthApi.login({ email, password })).user),
      register: async (name, email, password) => afterAuth((await AuthApi.register({ name, email, password })).user),
      logout: async () => {
        try {
          await AuthApi.logout();
        } finally {
          clearSession();
        }
      },
      refreshUser: async () => {
        await qc.invalidateQueries({ queryKey: ME_KEY });
      },
    }),
    [data, isLoading, afterAuth, clearSession, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

 
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
