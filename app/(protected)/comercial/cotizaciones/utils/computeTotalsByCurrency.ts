// ═══════════════════════════════════════════════════════════════════
// COMPUTE TOTALS BY CURRENCY — Helper centralizado nivel ERP
// ═══════════════════════════════════════════════════════════════════
// Lógica única para calcular totales multi-moneda de una cotización.
// Antes estaba duplicada en 5 archivos (Filters, CommandCenter, Copilot,
// SidebarItem, WorkspaceHeader) con pequeñas variaciones que causaban
// inconsistencias entre KPIs y filtros.
//
// REGLA CRÍTICA (ERP): cada línea de cada concepto puede tener su propia
// moneda — NUNCA sumar `quotation.total` plano. Siempre agrupar por
// moneda y mostrar totales separados (no convertir).
//
// Aprendizaje (memoria 8 may 2026): un tax_rate de -1, 0, null o
// undefined significa "sin impuesto" — solo tasas > 0 se aplican.
// ═══════════════════════════════════════════════════════════════════

import type { Quotation } from "../types/quotations.types";

/**
 * Calcula impuesto por línea según tax_rate.
 * tax_rate puede venir como número (16) o porcentaje (0.16); aquí se
 * asume porcentaje en formato número entero (ej: 16 = 16%).
 * Valores -1, 0, null, undefined => sin impuesto.
 */
function computeLineTax(price: number, taxRate: number | null | undefined): number {
  if (taxRate === null || taxRate === undefined) return 0;
  const r = Number(taxRate);
  if (r === -1 || r <= 0) return 0;
  return price * (r / 100);
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA — VARIANTE SIMPLE
// Retorna solo el total final por moneda. Se usa donde solo importa
// el monto cobrable: filtros, KPIs, item del sidebar.
// ═══════════════════════════════════════════════════════════════════
export function computeTotalsByCurrency(q: Quotation): Record<string, number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const concepts = (q as any).billing_concepts ?? [];

  if (concepts.length > 0) {
    const totals: Record<string, number> = {};
    for (const concept of concepts) {
      for (const line of concept.lines ?? []) {
        const cur   = line.currency ?? concept.currency ?? q.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const tax   = computeLineTax(price, line.tax_rate);
        totals[cur] = (totals[cur] ?? 0) + price + tax;
      }
    }
    return totals;
  }

  // Fallback: cotización sin billing_concepts (legacy)
  return { [q.currency ?? "MXN"]: q.total ?? 0 };
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA — VARIANTE FULL
// Retorna { subtotal, tax, total } por moneda. Se usa en Copilot y
// donde se muestra desglose completo (header de workspace, etc).
// ═══════════════════════════════════════════════════════════════════
export type CurrencyBreakdown = { subtotal: number; tax: number; total: number };

export function computeBreakdownByCurrency(
  q: Quotation,
): Record<string, CurrencyBreakdown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const concepts = (q as any).billing_concepts ?? [];

  if (concepts.length > 0) {
    const byCurrency: Record<string, CurrencyBreakdown> = {};
    for (const concept of concepts) {
      for (const line of concept.lines ?? []) {
        const cur   = line.currency ?? concept.currency ?? q.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const tax   = computeLineTax(price, line.tax_rate);
        if (!byCurrency[cur]) {
          byCurrency[cur] = { subtotal: 0, tax: 0, total: 0 };
        }
        byCurrency[cur].subtotal += price;
        byCurrency[cur].tax      += tax;
        byCurrency[cur].total    += price + tax;
      }
    }
    return byCurrency;
  }

  // Fallback: cotización sin billing_concepts (legacy)
  const cur = q.currency ?? "MXN";
  return {
    [cur]: {
      subtotal: q.subtotal   ?? 0,
      tax:      q.tax_amount ?? 0,
      total:    q.total      ?? 0,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════
// API PÚBLICA — AGREGADO MULTI-COTIZACIÓN
// Útil para KPIs del CommandCenter: suma totales de N cotizaciones
// agrupadas por moneda.
// ═══════════════════════════════════════════════════════════════════
export function sumTotalsByCurrency(quotations: Quotation[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of quotations) {
    const t = computeTotalsByCurrency(q);
    for (const [cur, val] of Object.entries(t)) {
      out[cur] = (out[cur] ?? 0) + val;
    }
  }
  return out;
}