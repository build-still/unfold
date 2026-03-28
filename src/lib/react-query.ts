import {
  DefaultOptions,
  UseMutationOptions,
  useMutation,
  useQuery,
  useSuspenseQuery,
  type QueryKey,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from '@tanstack/react-query';

export function getQueryErrorHttpStatus(error: unknown): number | undefined {
  if (typeof Response !== 'undefined' && error instanceof Response) {
    return error.status;
  }
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status?: unknown }).status;
    if (typeof s === 'number' && Number.isFinite(s)) return s;
  }
  return undefined;
}

export function defaultQueryRetry(
  failureCount: number,
  error: unknown,
): boolean {
  const maxRetries = 2;
  if (failureCount >= maxRetries) return false;
  const status = getQueryErrorHttpStatus(error);
  if (status !== undefined && status >= 400 && status < 500) return false;
  return true;
}

export const appQueryDefaults = {
  networkMode: 'always' as const,
  refetchOnWindowFocus: false,
  retry: defaultQueryRetry,
  staleTime: 1000 * 60,
};

/** Same 4xx / retry cap idea as queries; mutations default to fewer retries in TanStack but we align behavior. */
export function defaultMutationRetry(
  failureCount: number,
  error: unknown,
): boolean {
  const maxRetries = 2;
  if (failureCount >= maxRetries) return false;
  const status = getQueryErrorHttpStatus(error);
  if (status !== undefined && status >= 400 && status < 500) return false;
  return true;
}

export const appMutationDefaults = {
  networkMode: 'always' as const,
  retry: defaultMutationRetry,
};

export const queryConfig = {
  queries: {
    ...appQueryDefaults,
  },
  mutations: {
    ...appMutationDefaults,
  },
} satisfies DefaultOptions;

/**
 * Prefer over `useQuery` from TanStack: relies on {@link queryConfig} via `QueryClientProvider`
 * (offline-first `networkMode`, shared stale/retry behavior). Per-query options override defaults.
 */
export function useAppQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useQuery({
    ...appQueryDefaults,
    ...options,
  });
}

/**
 * Same defaults as {@link useAppQuery}, for use under a React `Suspense` boundary
 * (see TanStack Query suspense guide). The boundary must wrap the component that
 * calls this hook so the fallback shows while the query is pending.
 */
export function useSuspenseAppQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useSuspenseQuery({
    ...appQueryDefaults,
    ...options,
  });
}

/**
 * Prefer over `useMutation` from TanStack: same offline-first defaults as {@link queryConfig}.mutations.
 */
export function useAppMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(options: UseMutationOptions<TData, TError, TVariables, TContext>) {
  return useMutation({
    ...appMutationDefaults,
    ...options,
  });
}

export type ApiFnReturnType<FnType extends (...args: any) => Promise<any>> =
  Awaited<ReturnType<FnType>>;

export type QueryConfig<T extends (...args: any[]) => any> = Omit<
  ReturnType<T>,
  'queryKey' | 'queryFn'
>;

export type MutationConfig<
  MutationFnType extends (...args: any) => Promise<any>,
> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0]
>;
