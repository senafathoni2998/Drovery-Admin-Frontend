import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '../api/client';
import { ApiError } from '../models/api';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** GET `path` once (and on refetch), exposing loading/error/data. */
export function useApi<T>(path: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    // Reset to the loading state whenever the request key (path/tick) changes — intentional,
    // so the rule that discourages synchronous setState in effects is opted out here.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    apiFetch<T>(path)
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (active) {
          setError(e instanceof ApiError ? e.message : 'Something went wrong');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [path, tick]);

  return { data, loading, error, refetch };
}
