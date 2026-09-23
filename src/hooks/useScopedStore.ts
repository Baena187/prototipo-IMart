import { useSearchParams } from 'react-router-dom';
import { useStoreScope } from '@/contexts/StoreScopeContext';

/** Loja em foco: parâmetro ?loja= tem prioridade sobre a loja selecionada na barra superior. */
export function useScopedStore(): [string, (id: string) => void] {
  const [params, setParams] = useSearchParams();
  const { storeId, setStoreId } = useStoreScope();
  const value = params.get('loja') ?? storeId ?? '';
  const set = (id: string) => {
    const next = new URLSearchParams(params);
    if (id) next.set('loja', id);
    else next.delete('loja');
    setParams(next, { replace: true });
    if (!id && storeId) setStoreId(undefined);
  };
  return [value, set];
}
