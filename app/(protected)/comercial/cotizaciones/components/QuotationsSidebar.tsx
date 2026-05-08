"use client";

import React, { useState, useMemo } from "react";
import type { Quotation } from "../types/quotations.types";

import VirtualSidebar from "@/app/components/shared/VirtualSidebar";
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
// Composición:
//   - VirtualSidebar (shared) maneja virtualización + UI
//   - applyFilters (puro) maneja la lógica de filtrado
//   - QuotationSidebarItem (memo) maneja el render del row
//
// Performance: a 1,000 cotizaciones renderiza solo ~25 cards en DOM,
// con scroll fluido a 60 fps. Patrón Linear/Slack.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotations: Quotation[];
  selected: Quotation | null;
  setSelected: (q: Quotation) => void;
  onCreateNew?: () => void;
};

const ITEM_HEIGHT = 95; // altura aproximada del card

export default function QuotationsSidebar({
  quotations,
  selected,
  setSelected,
  onCreateNew,
}: Props) {
  const [filters, setFilters] = useState<QuotationFilters>(DEFAULT_FILTERS);

  // Aplicar filtros — memoizado para evitar recálculo en cada render
  const filtered = useMemo(
    () => applyFilters(quotations, filters),
    [quotations, filters],
  );

  // Contadores para mostrar en pills (calculados sobre dataset COMPLETO)
  const statusCounts = useMemo(() => countByStatus(quotations), [quotations]);
  const typeCounts = useMemo(() => countByType(quotations), [quotations]);

  // Subtipos únicos disponibles (poblar select del panel avanzado)
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

  const filtersActive = hasActiveFilters(filters);

  return (
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
      pillRows={[
        // Fila 1 — Tipo (rect, single)
        {
          mode: "single",
          value: filters.type,
          onChange: (v: any) => setFilters((p) => ({ ...p, type: v })),
          options: [
            { value: "all", label: "Todas" },
            {
              value: "products",
              label: "Productos",
              count: typeCounts.products,
            },
            {
              value: "services",
              label: "Servicios",
              count: typeCounts.services,
            },
          ],
          shape: "rect",
          size: "sm",
        },
        // Fila 2 — Status (round, single)
        {
          mode: "single",
          value: filters.status,
          onChange: (v: any) => setFilters((p) => ({ ...p, status: v })),
          options: [
            { value: "all", label: "Todas" },
            { value: "draft", label: "Borrador", count: statusCounts.draft },
            { value: "sent", label: "Enviada", count: statusCounts.sent },
            {
              value: "accepted",
              label: "Aceptada",
              count: statusCounts.accepted,
            },
            {
              value: "rejected",
              label: "Rechazada",
              count: statusCounts.rejected,
            },
            {
              value: "expired",
              label: "Expirada",
              count: statusCounts.expired,
            },
          ],
          shape: "round",
          size: "sm",
        },
      ]}
      advancedSearch={{
        filters: {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          amountFrom: filters.amountFrom,
          amountTo: filters.amountTo,
          amountCurrency: filters.amountCurrency,
          selects: {
            subtype: filters.subtype ?? "",
            validity: filters.validity ?? "",
          },
        },
        onChange: (af) => {
          setFilters((p) => ({
            ...p,
            dateFrom: af.dateFrom,
            dateTo: af.dateTo,
            amountFrom: af.amountFrom,
            amountTo: af.amountTo,
            amountCurrency: af.amountCurrency,
            subtype: af.selects?.subtype || undefined,
            validity: (af.selects?.validity as any) || undefined,
          }));
        },
        config: {
          dateRange: {
            label: "Rango de creación",
            from: "Desde",
            to: "Hasta",
          },
          amountRange: {
            label: "Rango de monto",
            currencies: ["MXN", "USD"],
          },
          selects: [
            ...(subtypeOptions.length > 0
              ? [
                  {
                    key: "subtype",
                    label: "Subtipo de servicio",
                    options: subtypeOptions,
                  },
                ]
              : []),
            {
              key: "validity",
              label: "Vigencia",
              options: [
                { value: "vigente", label: "Vigentes" },
                { value: "expired", label: "Expiradas" },
              ],
            },
          ],
        },
      }}
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
  );
}