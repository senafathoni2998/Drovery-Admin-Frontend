import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * List state (page, free-text search, one enum filter) held in the URL.
 *
 * It used to be `useState` — `useSearchParams` appeared nowhere in the console — so
 * an operator working a failed-delivery queue restarted from page 1 unfiltered after
 * every single record they opened, a refresh lost their place, and nobody could share
 * a link to "the failed queue, page 3".
 *
 * Setting the search or the filter resets to page 1: staying on page 7 of a result set
 * that no longer has seven pages shows an empty table and looks like a bug.
 */
export interface ListParams {
  /** 0-based, for MUI TablePagination. */
  page: number;
  q: string;
  filter: string;
  setPage: (page: number) => void;
  setQ: (q: string) => void;
  setFilter: (value: string) => void;
}

/** Builds the list query string. Standalone so a page can call it inline. */
export function toQueryString(
  page: number,
  limit: number,
  q: string,
  filterKey: string,
  filterValue: string,
): string {
  const out = new URLSearchParams({
    page: String(page + 1),
    limit: String(limit),
  });
  if (q) out.set('q', q);
  if (filterValue) out.set(filterKey, filterValue);
  return out.toString();
}

export function useListParams(): ListParams {
  const [sp, setSp] = useSearchParams();

  const page = Math.max(0, Number(sp.get('page') ?? '1') - 1);
  const q = sp.get('q') ?? '';
  const filter = sp.get('filter') ?? '';

  const write = useCallback(
    (next: Record<string, string>) => {
      const merged = new URLSearchParams(sp);
      for (const [k, v] of Object.entries(next)) {
        if (v) merged.set(k, v);
        else merged.delete(k);
      }
      // replace: paging and typing should not each add a browser-history entry.
      setSp(merged, { replace: true });
    },
    [sp, setSp],
  );

  return {
    page,
    q,
    filter,
    setPage: (p) => write({ page: String(p + 1) }),
    setQ: (next) => write({ q: next, page: '' }),
    setFilter: (next) => write({ filter: next, page: '' }),
  };
}
