/**
 * Generic data-fetching hook — thin wrapper around async API calls
 * with loading / error / data state management.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiState<T> {
  data:       T | null;
  isLoading:  boolean;
  error:      string | null;
  refetch:    () => Promise<void>;
}

/**
 * @param fetcher  — async function that returns the data
 * @param deps     — dependency array; re-fetches when any dep changes
 * @param skip     — set true to skip the initial fetch (e.g. waiting for auth)
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps:    unknown[] = [],
  skip    = false
): UseApiState<T> {
  const [data,      setData]      = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!skip);
  const [error,     setError]     = useState<string | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    if (skip) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}

/** Mutation hook — call trigger() to execute */
export function useMutation<TArgs, TResult>(
  mutFn: (args: TArgs) => Promise<TResult>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const trigger = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      try {
        setIsLoading(true);
        setError(null);
        return await mutFn(args);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mutFn]
  );

  return { trigger, isLoading, error };
}
