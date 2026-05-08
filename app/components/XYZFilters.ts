import type { XYZ, XYZStatus } from "../types/xyz.types";

export type XYZFilters = {
  // Básicos siempre visibles
  search: string;
  status: XYZStatus | "all";
  // Categoría/tipo según dominio
  // ... agregar filtros propios del módulo
  // Avanzados (opcional)
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: string;
  amountTo?: string;
};

export const DEFAULT_FILTERS: XYZFilters = {
  search: "",
  status: "all",
};

// Función búsqueda multi-campo — adaptar a campos del dominio
function searchInXYZ(item: XYZ, term: string): boolean {
  if (!term?.trim()) return true;
  const t = term.toLowerCase().trim();
  const fields = [
    item.code,
    item.name,
    item.description,
    // ... otros campos del dominio
  ];
  return fields.some(f => f && String(f).toLowerCase().includes(t));
}

export function applyFilters(items: XYZ[], filters: XYZFilters): XYZ[] {
  return items.filter(item => {
    if (!searchInXYZ(item, filters.search)) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    // ... resto de filtros
    return true;
  });
}

export function countByStatus(items: XYZ[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const i of items) counts[i.status] = (counts[i.status] ?? 0) + 1;
  return counts;
}

export function hasActiveFilters(filters: XYZFilters): boolean {
  return !!filters.search.trim() || filters.status !== "all" || /* ... */;
}