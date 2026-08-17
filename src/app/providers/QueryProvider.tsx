import React, { type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Single shared QueryClient for all server state (products, categories,
 * orders, addresses, ...). Per the project's server-state/client-state
 * split, nothing that belongs here should be duplicated into a Zustand
 * store.
 *
 * Defaults below are deliberately conservative production defaults, not
 * per-query tuning — individual features can override `staleTime` etc. on
 * their own queries where it matters.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute — avoid refetch storms on remount
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // not meaningful on mobile
    },
    mutations: {
      retry: 0, // never silently retry a write (e.g. "place order") twice
    },
  },
});

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
