import type {
  Quotation,
  QuotationStatus,
  QuotationType,
} from "../types/quotations.types";
import { computeTotalsByCurrency } from "../utils/computeTotalsByCurrency";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION FILTERS — Lógica pura de filtrado nivel ERP
//
// Patrón Salesforce/SAP: filtros complementarios y compositivos.
//   1. Búsqueda multi-campo  → folio, cliente, RFC, email, contacto, subtipo
//   2. Filtros simples       → tipo (productos/servicios), status
//   3. Filtros avanzados     → fecha · monto · subtipo · vigencia · moneda
//
// Se aplican TODOS encadenados con AND (más restrictivo).
//
// NOTA: El cálculo de totales usa el helper centralizado
// `computeTotalsByCurrency` (utils/) para mantener consistencia con
// KPIs del CommandCenter y montos del SidebarItem.
// ═══════════════════════════════════════════════════════════════════

export type QuotationFilters = {
  // Filtros básicos (siempre visibles)
  search: string;
  type: QuotationType | "all";
  status: QuotationStatus | "all";

  // Filtros avanzados (panel expandible / drawer)
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: string;
  amountTo?: string;
  amountCurrency?: string;
  currency?: string; // Filtro por moneda dominante de la cotización
  subtype?: string;
  validity?: "all" | "vigente" | "expired";
};

export const DEFAULT_FILTERS: QuotationFilters = {
  search: "",
  type: "all",
  status: "all",
};

// ═══════════════════════════════════════════════════════════════════
// HELPERS internos
// ═══════════════════════════════════════════════════════════════════

// Búsqueda multi-campo: tokenizada y case-insensitive
function searchInQuotation(q: Quotation, term: string): boolean {
  if (!term || !term.trim()) return true;
  const t = term.toLowerCase().trim();

  const fields = [
    q.quote_number,
    q.client_name,
    (q as any).client?.name,
    q.client_rfc,
    (q as any).client?.rfc,
    q.client_email,
    (q as any).client?.email,
    q.contact_name,
    q.contact_email,
    q.service_subtype,
    q.notes,
    q.terms,
  ];

  return fields.some(
    (f) => f && String(f).toLowerCase().includes(t),
  );
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════

/**
 * Aplica TODOS los filtros encadenados con AND.
 * Retorna las cotizaciones que cumplen TODAS las condiciones.
 */
export function applyFilters(
  quotations: Quotation[],
  filters: QuotationFilters,
): Quotation[] {
  return quotations.filter((q) => {
    // 1. Búsqueda multi-campo
    if (!searchInQuotation(q, filters.search)) return false;

    // 2. Tipo
    if (filters.type !== "all" && q.type !== filters.type) return false;

    // 3. Status
    if (filters.status !== "all" && q.status !== filters.status) return false;

    // 4. Rango de fechas (sobre created_at)
    if (filters.dateFrom) {
      const created = new Date(q.created_at);
      const from = new Date(filters.dateFrom);
      if (created < from) return false;
    }
    if (filters.dateTo) {
      const created = new Date(q.created_at);
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (created > to) return false;
    }

    // 5. Subtipo de servicio
    if (filters.subtype && q.service_subtype !== filters.subtype) return false;

    // 6. Vigencia
    if (filters.validity && filters.validity !== "all") {
      if (!q.valid_until) {
        return false;
      }
      const days =
        (new Date(q.valid_until).getTime() - Date.now()) / 86400000;
      if (filters.validity === "vigente" && days < 0) return false;
      if (filters.validity === "expired" && days >= 0) return false;
    }

    // 7. Filtro por moneda — la cotización debe tener al menos una línea
    //    en la moneda solicitada
    if (filters.currency) {
      const totals = computeTotalsByCurrency(q);
      if (!totals[filters.currency] || totals[filters.currency] === 0) {
        return false;
      }
    }

    // 8. Rango de monto (en moneda específica)
    if (filters.amountFrom || filters.amountTo) {
      const totals = computeTotalsByCurrency(q);
      const cur = filters.amountCurrency || Object.keys(totals)[0] || "MXN";
      const total = totals[cur] ?? 0;
      const from = filters.amountFrom ? Number(filters.amountFrom) : 0;
      const to = filters.amountTo ? Number(filters.amountTo) : Infinity;
      if (total < from || total > to) return false;
    }

    return true;
  });
}

/**
 * Cuenta cotizaciones agrupadas por status.
 * Útil para mostrar contadores en filter pills.
 */
export function countByStatus(quotations: Quotation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of quotations) {
    counts[q.status] = (counts[q.status] ?? 0) + 1;
  }
  return counts;
}

/**
 * Cuenta cotizaciones agrupadas por tipo.
 */
export function countByType(quotations: Quotation[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of quotations) {
    counts[q.type] = (counts[q.type] ?? 0) + 1;
  }
  return counts;
}

/**
 * Verifica si hay filtros activos (algún filtro distinto al default).
 * Útil para mostrar mensajes de "Sin resultados con filtros aplicados".
 */
export function hasActiveFilters(filters: QuotationFilters): boolean {
  return (
    !!filters.search.trim() ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.amountFrom ||
    !!filters.amountTo ||
    !!filters.currency ||
    !!filters.subtype ||
    (!!filters.validity && filters.validity !== "all")
  );
}