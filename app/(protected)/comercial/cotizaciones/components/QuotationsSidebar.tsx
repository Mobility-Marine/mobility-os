"use client";

import React, { useState, useMemo } from "react";
import type { Quotation } from "../types/quotations.types";

import VirtualSidebar, { type ActiveChip } from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, { type FilterGroup } from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

import QuotationSidebarItem from "./QuotationSidebarItem";
import {
  applyFilters,
  countByStatus,
  countByType,
  hasActiveFilters,
  DEFAULT_FILTERS,
  type QuotationFilters,
} from "./QuotationFilters";

// ═══════════════════════════════════════════════════════════════════
// QUOTATIONS SIDEBAR — Virtualizado · escalable a 100K+ items
//
// Patrón ERP-grade (Linear / Salesforce):
//   - Search siempre visible
//   - Botón "Filtros (N)" abre drawer lateral con TODOS los filtros
//   - Chips de filtros activos arriba de la lista (removibles)
//   - VirtualList con react-window para escalar a 100K+ cotizaciones
//
// Composición:
//   - VirtualSidebar (shared) — UI virtualizada + chips
//   - FilterDrawer  (shared) — drawer lateral data-driven
//   - applyFilters  (puro)   — lógica de filtrado
//   - QuotationSidebarItem (memo) — render del row
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotations: Quotation[];
  selected: Quotation | null;
  setSelected: (q: Quotation) => void;
  onCreateNew?: () => void;
};

const ITEM_HEIGHT = 100;

// ── Helpers para etiquetas legibles en chips ────────────────────────
const TYPE_LABEL: Record<string, string> = {
  products: "Productos",
  services: "Servicios",
};

const STATUS_LABEL: Record<string, string> = {
  draft:    "Borrador",
  sent:     "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired:  "Expirada",
  viewed:   "Vista",
};

const VALIDITY_LABEL: Record<string, string> = {
  vigente: "Vigentes",
  expired: "Expiradas",
};

export default function QuotationsSidebar({
  quotations,
  selected,
  setSelected,
  onCreateNew,
}: Props) {
  const [filters, setFilters] = useState<QuotationFilters>(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Aplicar filtros (memo) ────────────────────────────────────────
  const filtered = useMemo(
    () => applyFilters(quotations, filters),
    [quotations, filters],
  );

  // ── Contadores sobre dataset COMPLETO (para mostrar en pills) ─────
  const statusCounts = useMemo(() => countByStatus(quotations), [quotations]);
  const typeCounts = useMemo(() => countByType(quotations), [quotations]);

  // ── Subtipos únicos disponibles (poblar select del drawer) ────────
  const subtypeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const q of quotations) {
      if (q.service_subtype) set.add(q.service_subtype);
    }
    return Array.from(set)
      .sort()
      .map((v) => ({
        value: v,
        label: v.replace(/_/g, " ").toUpperCase(),
      }));
  }, [quotations]);

  // ── Monedas únicas presentes en las cotizaciones ──────────────────
  const currencyOptions = useMemo(() => {
    const set = new Set<string>();
    for (const q of quotations) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const concepts = (q as any).billing_concepts ?? [];
      if (concepts.length > 0) {
        for (const c of concepts) {
          for (const line of c.lines ?? []) {
            const cur = line.currency ?? c.currency ?? q.currency ?? "MXN";
            set.add(cur);
          }
        }
      } else {
        set.add(q.currency ?? "MXN");
      }
    }
    return Array.from(set).sort();
  }, [quotations]);

  // ── Construir grupos del FilterDrawer ─────────────────────────────
  const groups: FilterGroup[] = useMemo(() => {
    const g: FilterGroup[] = [
      {
        id: "type",
        label: "Tipo",
        type: "select",
        value: filters.type,
        onChange: (v) =>
          setFilters((p) => ({ ...p, type: v as QuotationFilters["type"] })),
        options: [
          { value: "all", label: "Todas" },
          { value: "products", label: "Productos", count: typeCounts.products },
          { value: "services", label: "Servicios", count: typeCounts.services },
        ],
      },
      {
        id: "status",
        label: "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          setFilters((p) => ({ ...p, status: v as QuotationFilters["status"] })),
        options: [
          { value: "all", label: "Todas" },
          { value: "draft", label: "Borrador", count: statusCounts.draft },
          { value: "sent", label: "Enviada", count: statusCounts.sent },
          { value: "accepted", label: "Aceptada", count: statusCounts.accepted },
          { value: "rejected", label: "Rechazada", count: statusCounts.rejected },
          { value: "expired", label: "Expirada", count: statusCounts.expired },
        ],
      },
    ];

    // Subtipo solo si hay servicios disponibles
    if (subtypeOptions.length > 0) {
      g.push({
        id: "subtype",
        label: "Subtipo de servicio",
        type: "select",
        value: filters.subtype ?? "",
        onChange: (v) => setFilters((p) => ({ ...p, subtype: v || undefined })),
        options: [{ value: "", label: "Todos" }, ...subtypeOptions],
      });
    }

    g.push({
      id: "validity",
      label: "Vigencia",
      type: "select",
      value: filters.validity ?? "all",
      onChange: (v) =>
        setFilters((p) => ({
          ...p,
          validity: (v as QuotationFilters["validity"]) || undefined,
        })),
      options: [
        { value: "all", label: "Todas" },
        { value: "vigente", label: "Vigentes" },
        { value: "expired", label: "Expiradas" },
      ],
    });

    g.push({
      id: "dateRange",
      label: "Rango de creación",
      type: "date-range",
      from: filters.dateFrom,
      to: filters.dateTo,
      onChange: (from, to) =>
        setFilters((p) => ({ ...p, dateFrom: from, dateTo: to })),
    });

    g.push({
      id: "amountRange",
      label: "Rango de monto",
      type: "number-range",
      min: filters.amountFrom,
      max: filters.amountTo,
      currency: filters.amountCurrency,
      currencies: currencyOptions.length > 1 ? currencyOptions : undefined,
      onChange: (min, max, currency) =>
        setFilters((p) => ({
          ...p,
          amountFrom: min,
          amountTo: max,
          amountCurrency: currency,
        })),
    });

    // Filtro adicional: moneda dominante (si hay >1 moneda en el dataset)
    if (currencyOptions.length > 1) {
      g.push({
        id: "currency",
        label: "Moneda",
        type: "select",
        value: filters.currency ?? "",
        onChange: (v) =>
          setFilters((p) => ({ ...p, currency: v || undefined })),
        options: [
          { value: "", label: "Todas" },
          ...currencyOptions.map((c) => ({ value: c, label: c })),
        ],
      });
    }

    return g;
  }, [filters, typeCounts, statusCounts, subtypeOptions, currencyOptions]);

  // ── Construir chips de filtros activos ────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];

    if (filters.type !== "all") {
      chips.push({
        id: "type",
        label: `Tipo: ${TYPE_LABEL[filters.type] ?? filters.type}`,
        onRemove: () => setFilters((p) => ({ ...p, type: "all" })),
      });
    }
    if (filters.status !== "all") {
      chips.push({
        id: "status",
        label: `Estado: ${STATUS_LABEL[filters.status] ?? filters.status}`,
        onRemove: () => setFilters((p) => ({ ...p, status: "all" })),
      });
    }
    if (filters.subtype) {
      chips.push({
        id: "subtype",
        label: `Subtipo: ${filters.subtype.replace(/_/g, " ").toUpperCase()}`,
        onRemove: () => setFilters((p) => ({ ...p, subtype: undefined })),
      });
    }
    if (filters.validity && filters.validity !== "all") {
      chips.push({
        id: "validity",
        label: `Vigencia: ${VALIDITY_LABEL[filters.validity] ?? filters.validity}`,
        onRemove: () => setFilters((p) => ({ ...p, validity: undefined })),
      });
    }
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? formatDate(filters.dateFrom) : "…";
      const to   = filters.dateTo   ? formatDate(filters.dateTo)   : "…";
      chips.push({
        id: "dateRange",
        label: `Fecha: ${from} → ${to}`,
        onRemove: () =>
          setFilters((p) => ({ ...p, dateFrom: undefined, dateTo: undefined })),
      });
    }
    if (filters.amountFrom || filters.amountTo) {
      const min = filters.amountFrom ? formatNumber(filters.amountFrom) : "0";
      const max = filters.amountTo   ? formatNumber(filters.amountTo)   : "∞";
      const cur = filters.amountCurrency ? ` ${filters.amountCurrency}` : "";
      chips.push({
        id: "amountRange",
        label: `Monto: ${min} – ${max}${cur}`,
        onRemove: () =>
          setFilters((p) => ({
            ...p,
            amountFrom: undefined,
            amountTo: undefined,
            amountCurrency: undefined,
          })),
      });
    }
    if (filters.currency) {
      chips.push({
        id: "currency",
        label: `Moneda: ${filters.currency}`,
        onRemove: () => setFilters((p) => ({ ...p, currency: undefined })),
      });
    }

    return chips;
  }, [filters]);

  // ── Total de filtros activos (excluye search, que tiene su input) ─
  const activeCount = activeChips.length;
  const filtersActive = hasActiveFilters(filters);

  // ── Limpiar todos los filtros (excepto search) ────────────────────
  const clearAll = () =>
    setFilters((p) => ({
      ...DEFAULT_FILTERS,
      search: p.search, // preserva la búsqueda
    }));

  return (
    <>
      <VirtualSidebar<Quotation>
        title="Cotizaciones"
        count={filtered.length}
        totalCount={quotations.length}
        search={{
          value: filters.search,
          onChange: (v) => setFilters((p) => ({ ...p, search: v })),
          placeholder: "Buscar cotización…",
          hint: "Folio, cliente, RFC, contacto, subtipo",
        }}
        filterButton={{
          activeCount,
          onOpen: () => setDrawerOpen(true),
        }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={filtered}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        getItemId={(q) => q.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(q, _index, isSelected) => (
          <QuotationSidebarItem quotation={q} isSelected={isSelected} />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title: filtersActive ? "Sin resultados" : "Sin cotizaciones",
          description: filtersActive
            ? "Prueba ajustando los filtros o limpia la búsqueda"
            : "Crea tu primera cotización para empezar",
          action:
            !filtersActive && onCreateNew
              ? { label: "Nueva cotización", onClick: onCreateNew }
              : undefined,
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filtros de cotizaciones"
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS de formato (solo para chips)
// ═══════════════════════════════════════════════════════════════════
function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatNumber(s: string): string {
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}