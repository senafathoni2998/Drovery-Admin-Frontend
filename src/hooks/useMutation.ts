import { useCallback, useState } from 'react';

import { ApiError } from '../models/api';

interface UseMutationResult<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | undefined>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Wraps an async action (e.g. an admin mutation) with loading/error tracking. `run` resolves
 * to the result, or `undefined` if the call threw (the error is captured, never rethrown), so
 * callers can branch on the result without a try/catch.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): UseMutationResult<TArgs, TResult> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setLoading(true);
      setError(null);
      try {
        return await fn(...args);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Action failed');
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  const reset = useCallback(() => setError(null), []);

  return { run, loading, error, reset };
}
