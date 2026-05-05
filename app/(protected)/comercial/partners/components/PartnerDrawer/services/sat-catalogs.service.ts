// ════════════════════════════════════════════════════════════════════════
// SAT CATALOGS SERVICE — Carga dinámica desde tabla sat_catalogs
// ════════════════════════════════════════════════════════════════════════
// La tabla sat_catalogs tiene 350+ filas con catálogos compartidos por
// todas las empresas del SaaS:
//   - regimen_fiscal     (22 items) — para Tab Fiscal
//   - uso_cfdi           (24 items) — para Tab Fiscal
//   - forma_pago         (22 items) — para Tab Fiscal
//   - estados_mexico     (32 items) — para Tab Direcciones
//   - paises_comunes     (22 items) — para Tab Direcciones
//
// Este service expone funciones tipadas para cada catálogo. Implementa
// caché en memoria a nivel de sesión (los catálogos casi nunca cambian).
// ════════════════════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabaseClient";

// ── Tipo genérico de un item de catálogo SAT ─────────────────────────
export type SATCatalogItem = {
  catalog_name: string;
  code:         string;
  label:        string;
  metadata:     Record<string, unknown> | null;
  sort_order:   number;
  active:       boolean;
};

// ── Caché en memoria (TTL infinito en sesión, pero refetcheable) ─────
const _cache = new Map<string, SATCatalogItem[]>();

// ── Cargar un catálogo ────────────────────────────────────────────────
// Si force=true, ignora el cache y refetcha.
export async function fetchSATCatalog(
  catalogName: string,
  force = false,
): Promise<SATCatalogItem[]> {
  if (!force && _cache.has(catalogName)) {
    return _cache.get(catalogName)!;
  }

  const { data, error } = await supabase
    .from("sat_catalogs")
    .select("catalog_name, code, label, metadata, sort_order, active")
    .eq("catalog_name", catalogName)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    // eslint-disable-next-line no-console
    console.error(`[sat-catalogs] error cargando ${catalogName}:`, error);
    throw new Error(error.message);
  }

  const items = (data ?? []) as SATCatalogItem[];
  _cache.set(catalogName, items);
  return items;
}

// ── Limpiar caché manualmente (útil tras actualizar el catálogo) ─────
export function clearSATCatalogCache(catalogName?: string) {
  if (catalogName) _cache.delete(catalogName);
  else _cache.clear();
}

// ── Helpers tipados por catálogo ─────────────────────────────────────
export const fetchRegimenFiscal     = (force = false) => fetchSATCatalog("regimen_fiscal",  force);
export const fetchUsoCFDI           = (force = false) => fetchSATCatalog("uso_cfdi",        force);
export const fetchFormaPago         = (force = false) => fetchSATCatalog("forma_pago",      force);
export const fetchEstadosMexico     = (force = false) => fetchSATCatalog("estados_mexico",  force);
export const fetchPaisesComunes     = (force = false) => fetchSATCatalog("paises_comunes",  force);

// ── Catálogo MÉTODO DE PAGO (no está en sat_catalogs, hardcoded) ─────
// Solo 2 valores válidos según SAT:
export const METODO_PAGO_OPTIONS = [
  { code: "PUE", label: "PUE - Pago en una sola exhibición" },
  { code: "PPD", label: "PPD - Pago en parcialidades o diferido" },
] as const;

export type MetodoPagoCode = "PUE" | "PPD";