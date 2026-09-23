import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface StoreScopeValue {
  storeId: string | undefined;
  setStoreId: (id: string | undefined) => void;
}

const StoreScopeContext = createContext<StoreScopeValue | null>(null);
const KEY = 'imart.pref.store';

/** Loja selecionada na barra superior; filtra as listagens operacionais. */
export function StoreScopeProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState<string | undefined>(() => {
    try {
      return localStorage.getItem(KEY) || undefined;
    } catch {
      return undefined;
    }
  });
  useEffect(() => {
    try {
      if (storeId) localStorage.setItem(KEY, storeId);
      else localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }, [storeId]);
  return <StoreScopeContext.Provider value={{ storeId, setStoreId }}>{children}</StoreScopeContext.Provider>;
}

export function useStoreScope() {
  const ctx = useContext(StoreScopeContext);
  if (!ctx) throw new Error('useStoreScope fora do provider');
  return ctx;
}
