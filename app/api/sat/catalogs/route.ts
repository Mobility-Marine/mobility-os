// ═══════════════════════════════════════════════════════════════════════
// useSATCatalog: hook para consumir catálogos SAT con cache automático
// 
// Uso simple:
//   const { items, loading, error } = useSATCatalog("tipo_figura");
//   
//   // En un select:
//   {items.map(it => <option key={it.code} value={it.code}>{it.label}</option>)}
// 
// Multi-catálogo (más eficiente cuando necesitas varios):
//   const { catalogs, loading } = useSATCatalogs(["tipo_figura", "tipo_carga"]);
//   const figuras = catalogs.tipo_figura ?? [];
// 
// Cache: en memoria global. Una vez cargado un catálogo, no se vuelve a
// pedir al servidor en toda la sesión. Si necesitas refresh, llama
// invalidateSATCatalog(name).
// ═══════════════════════════════════════════════════════════════════════

import { useEffect, useState, useCallback } from "react";

export type CatalogItem = {
  code:       string;
  label:      string;
  metadata?:  any;
  sort_order?: number;
};

// ── Cache global en memoria ─────────────────────────────────────────
const memoryCache: Record<string, CatalogItem[]> = {};
const inFlight: Record<string, Promise<CatalogItem[]> | undefined> = {};

async function fetchCatalog(name: string): Promise<CatalogItem[]> {
  // Cache hit
  if (memoryCache[name]) return memoryCache[name];

  // Si ya hay una request en vuelo para este catálogo, reutilizarla
  if (inFlight[name]) return inFlight[name]!;

  // Nueva request
  const promise = (async () => {
    const res = await fetch(`/api/sat/catalogs?name=${encodeURIComponent(name)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Error cargando catálogo ${name}`);
    }
    const data = await res.json();
    const items: CatalogItem[] = data.items ?? [];
    memoryCache[name] = items;
    return items;
  })();

  inFlight[name] = promise;
  try {
    return await promise;
  } finally {
    delete inFlight[name];
  }
}

/** Invalida un catálogo del cache (forzar refetch en próxima llamada) */
export function invalidateSATCatalog(name: string) {
  delete memoryCache[name];
}

/** Invalida todo el cache */
export function invalidateAllSATCatalogs() {
  for (const k of Object.keys(memoryCache)) delete memoryCache[k];
}

/** Hook para un solo catálogo */
export function useSATCatalog(name: string) {
  const [items, setItems]     = useState<CatalogItem[]>(() => memoryCache[name] ?? []);
  const [loading, setLoading] = useState<boolean>(!memoryCache[name]);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (memoryCache[name]) {
      setItems(memoryCache[name]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchCatalog(name)
      .then((res) => {
        if (cancelled) return;
        setItems(res);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? "Error cargando catálogo");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [name]);

  // Helper inline para buscar el label de un code
  const findLabel = useCallback(
    (code: string): string => items.find((i) => i.code === code)?.label ?? code,
    [items]
  );

  return { items, loading, error, findLabel };
}

/** Hook para varios catálogos a la vez (más eficiente) */
export function useSATCatalogs(names: string[]) {
  const [catalogs, setCatalogs] = useState<Record<string, CatalogItem[]>>(() => {
    const initial: Record<string, CatalogItem[]> = {};
    for (const n of names) if (memoryCache[n]) initial[n] = memoryCache[n];
    return initial;
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError]     = useState<string | null>(null);

  // Memo del key para evitar refetches por re-render
  const namesKey = names.join(",");

  useEffect(() => {
    let cancelled = false;

    // Filtrar los que NO están en cache
    const missing = names.filter((n) => !memoryCache[n]);

    if (missing.length === 0) {
      // Todos en cache, solo set state
      const next: Record<string, CatalogItem[]> = {};
      for (const n of names) next[n] = memoryCache[n];
      setCatalogs(next);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Cargar los faltantes en paralelo (cada uno con su propio cache)
    Promise.all(missing.map((n) => fetchCatalog(n)))
      .then(() => {
        if (cancelled) return;
        const next: Record<string, CatalogItem[]> = {};
        for (const n of names) next[n] = memoryCache[n] ?? [];
        setCatalogs(next);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message ?? "Error cargando catálogos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  return { catalogs, loading, error };
}
