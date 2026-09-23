import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '@/services';

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Busca assíncrona com revalidação automática quando os dados locais mudam.
 * Equivalente simplificado ao React Query — pode ser substituído sem alterar as páginas.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = []): QueryState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const run = useCallback((silent: boolean) => {
    const id = ++requestId.current;
    if (!silent) setLoading(true);
    fetcherRef
      .current()
      .then((result) => {
        if (id === requestId.current) {
          setData(result);
          setError(null);
        }
      })
      .catch((e: Error) => id === requestId.current && setError(e))
      .finally(() => id === requestId.current && setLoading(false));
  }, []);

  useEffect(() => {
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => run(true), 30);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [run]);

  return { data, loading: loading && data === undefined, error, reload: () => run(false) };
}
