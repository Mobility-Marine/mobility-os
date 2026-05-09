// ════════════════════════════════════════════════════════════════════════
// PartnerSidebar — Lista lateral del módulo Partners (ERP-grade)
// ════════════════════════════════════════════════════════════════════════
// Patrón Linear / Salesforce con peculiaridad:
//   - Tabs de ROL siempre visibles arriba (Todos/Clientes/Proveedores/Logística)
//     porque es la dimensión PRIMARIA del módulo en un ERP.
//   - Search + botón "Filtros (N)" + chips activos
//   - Filtros secundarios en drawer: Estado / Industria / País
//   - VirtualList con react-window
// ════════════════════════════════════════════════════════════════════════
"use client";

import React, { memo, useMemo, useState } from "react";
import type {
  PartnerListItem,
  PartnerFilters,
  PartnerRoleFilter,
  PartnerStats,
} from "../types/partners.types";
import {
  ROLE_FILTER_LABELS,
  rolesEmojis,
} from "../types/partners.types";
import { extractAvailableFilters } from "../services/partners.normalization";

import VirtualSidebar, {
  type ActiveChip,
} from "@/app/components/shared/VirtualSidebar";
import FilterDrawer, {
  type FilterGroup,
} from "@/app/components/shared/FilterDrawer";
import { IconInbox } from "@/app/components/shared/Icons";

// ─────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────
export type PartnerSidebarProps = {
  partners:        PartnerListItem[]; // ya filtrados
  allPartners:     PartnerListItem[]; // total sin filtrar (para extraer industries/countries)
  stats:           PartnerStats;
  filters:         PartnerFilters;
  selectedId:      string | null;
  onFiltersChange: (filters: PartnerFilters) => void;
  onSelectPartner: (id: string | null) => void;
};

const ITEM_HEIGHT = 54;

// ─────────────────────────────────────────────────────────────────────────
// Etiquetas para chips activos
// ─────────────────────────────────────────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  active:   "Activos",
  inactive: "Inactivos",
  lead:     "Leads",
};

// ─────────────────────────────────────────────────────────────────────────
// Helper: count por rol (para badges en tabs)
// ─────────────────────────────────────────────────────────────────────────
function countByRole(stats: PartnerStats, role: PartnerRoleFilter): number {
  switch (role) {
    case "all":       return stats.total;
    case "customer":  return stats.customers;
    case "supplier":  return stats.suppliers;
    case "logistics": return stats.logistics;
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function PartnerSidebar({
  partners,
  allPartners,
  stats,
  filters,
  selectedId,
  onFiltersChange,
  onSelectPartner,
}: PartnerSidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { industries, countries } = useMemo(
    () => extractAvailableFilters(allPartners),
    [allPartners],
  );

  const update = (patch: Partial<PartnerFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  // ── Tabs de rol (topSlot del VirtualSidebar) ──────────────────────
  const roleTabs = (
    <div
      style={{
        display:      "flex",
        gap:          "4px",
        padding:      "0 0 8px 0",
        borderBottom: "1px solid var(--color-border-faint)",
      }}
    >
      {(Object.keys(ROLE_FILTER_LABELS) as PartnerRoleFilter[]).map((role) => {
        const cfg = ROLE_FILTER_LABELS[role];
        const count = countByRole(stats, role);
        const active = filters.role === role;
        return (
          <button
            key={role}
            type="button"
            onClick={() => update({ role })}
            title={cfg.label}
            style={{
              flex:           1,
              minWidth:       0,
              height:         "32px",
              padding:        "0 6px",
              borderRadius:   "var(--radius-md)",
              background:     active ? "var(--color-info-bg)" : "transparent",
              border:         `1px solid ${active ? "var(--color-info-border)" : "var(--color-border-faint)"}`,
              color:          active ? "var(--color-info-text)" : "var(--color-text-second)",
              cursor:         "pointer",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              gap:            "4px",
              fontSize:       "10px",
              fontWeight:     active ? 700 : 600,
              transition:     "var(--transition-fast)",
              whiteSpace:     "nowrap",
              overflow:       "hidden",
            }}
          >
            <span style={{ fontSize: "12px" }}>{cfg.emoji}</span>
            <span
              style={{
                overflow:     "hidden",
                textOverflow: "ellipsis",
                whiteSpace:   "nowrap",
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                fontSize:           "9px",
                fontWeight:         800,
                padding:            "1px 5px",
                borderRadius:       "var(--radius-full)",
                background:         active
                  ? "var(--color-info-text)"
                  : "var(--color-bg-subtle)",
                color:              active ? "#fff" : "var(--color-text-muted)",
                fontVariantNumeric: "tabular-nums",
                flexShrink:         0,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );

  // ── Grupos del FilterDrawer ───────────────────────────────────────
  const groups: FilterGroup[] = useMemo(() => {
    const g: FilterGroup[] = [
      {
        id: "status",
        label: "Estado",
        type: "select",
        value: filters.status,
        onChange: (v) =>
          onFiltersChange({
            ...filters,
            status: v as PartnerFilters["status"],
          }),
        options: [
          { value: "all",      label: "Todos" },
          { value: "active",   label: STATUS_LABEL.active },
          { value: "inactive", label: STATUS_LABEL.inactive },
          { value: "lead",     label: STATUS_LABEL.lead },
        ],
      },
    ];

    if (industries.length > 0) {
      g.push({
        id: "industry",
        label: "Industria",
        type: "select",
        value: filters.industry,
        onChange: (v) =>
          onFiltersChange({
            ...filters,
            industry: v as PartnerFilters["industry"],
          }),
        options: [
          { value: "all", label: "Todas" },
          ...industries.map((i) => ({ value: i, label: i })),
        ],
      });
    }

    if (countries.length > 0) {
      g.push({
        id: "country",
        label: "País",
        type: "select",
        value: filters.country,
        onChange: (v) =>
          onFiltersChange({ ...filters, country: v }),
        options: [
          { value: "all", label: "Todos" },
          ...countries.map((c) => ({ value: c, label: c })),
        ],
      });
    }

    return g;
  }, [filters, industries, countries, onFiltersChange]);

  // ── Chips activos ─────────────────────────────────────────────────
  const activeChips: ActiveChip[] = useMemo(() => {
    const chips: ActiveChip[] = [];
    if (filters.status !== "all") {
      chips.push({
        id: "status",
        label: `Estado: ${STATUS_LABEL[filters.status] ?? filters.status}`,
        onRemove: () => onFiltersChange({ ...filters, status: "all" }),
      });
    }
    if (filters.industry !== "all") {
      chips.push({
        id: "industry",
        label: `Industria: ${filters.industry}`,
        onRemove: () => onFiltersChange({ ...filters, industry: "all" }),
      });
    }
    if (filters.country !== "all") {
      chips.push({
        id: "country",
        label: `País: ${filters.country}`,
        onRemove: () => onFiltersChange({ ...filters, country: "all" }),
      });
    }
    return chips;
  }, [filters, onFiltersChange]);

  const activeCount = activeChips.length;

  const clearAll = () =>
    onFiltersChange({
      ...filters,
      status: "all",
      industry: "all",
      country: "all",
    });

  return (
    <>
      <VirtualSidebar<PartnerListItem>
        title="Partners"
        count={partners.length}
        totalCount={allPartners.length}
        topSlot={roleTabs}
        search={{
          value: filters.search,
          onChange: (v) => update({ search: v }),
          placeholder: "Buscar por nombre, RFC, email…",
          hint: "Nombre · RFC · email",
        }}
        filterButton={{
          activeCount,
          onOpen: () => setDrawerOpen(true),
        }}
        activeChips={activeChips}
        onClearAllFilters={clearAll}
        items={partners}
        selectedId={selectedId}
        onSelect={(p) => onSelectPartner(p.id)}
        getItemId={(p) => p.id}
        itemHeight={ITEM_HEIGHT}
        renderItem={(p, _i, isSelected) => (
          <PartnerItem partner={p} isSelected={isSelected} />
        )}
        emptyState={{
          icon: <IconInbox size={32} />,
          title:
            allPartners.length === 0
              ? "Aún no hay partners registrados"
              : "Ningún partner coincide con los filtros",
          description:
            allPartners.length === 0
              ? "Crea tu primer partner desde el botón superior"
              : "Ajusta los filtros o limpia la búsqueda",
        }}
      />

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filtros de partners"
        groups={groups}
        activeCount={activeCount}
        onClearAll={clearAll}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PARTNER ITEM — card compacto (memo para react-window)
// ═══════════════════════════════════════════════════════════════════
const PartnerItem = memo(function PartnerItem({
  partner: p,
  isSelected,
}: {
  partner:    PartnerListItem;
  isSelected: boolean;
}) {
  // Fallback en cascada: name → legal_name → null
  // Después de unificar business_partners (4 may) algunos registros
  // legacy quedaron con `name` vacío pero `legal_name` poblado.
  const displayName =
    (p.name && p.name.trim()) ||
    ((p as any).legal_name && (p as any).legal_name.trim()) ||
    null;

  return (
    <div
      style={{
        // ── ANTI-OVERFLOW ──
        width:        "100%",
        boxSizing:    "border-box",
        overflow:     "hidden",
        // ── visual ──
        padding:      "8px 11px",
        borderRadius: "var(--radius-md)",
        background:   isSelected
          ? "var(--color-bg-active)"
          : "var(--color-bg-subtle)",
        border:       isSelected
          ? "1px solid var(--color-brand-blue)"
          : "1px solid var(--color-border-faint)",
        display:      "flex",
        flexDirection:"column",
        gap:          "3px",
        transition:   "var(--transition-fast)",
        height:       "calc(100% - 5px)",
      }}
    >
      {/* ROW 1 — nombre (fallback cascada por unificación business_partners) */}
      <div
        style={{
          fontSize:     "13px",
          fontWeight:   600,
          color:        displayName ? "var(--color-text-primary)" : "var(--color-text-muted)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
          fontStyle:    displayName ? "normal" : "italic",
        }}
        title={displayName ?? "Sin nombre"}
      >
        {displayName ?? "Sin nombre"}
      </div>

      {/* ROW 2 — status dot · roles · RFC/email */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "6px",
          minWidth:   0,
          width:      "100%",
          fontSize:   "11px",
          color:      "var(--color-text-muted)",
        }}
      >
        {/* Status dot */}
        <span
          style={{
            width:        "6px",
            height:       "6px",
            borderRadius: "50%",
            background:
              p.status === "active"
                ? "var(--color-success-text, #22c55e)"
                : "var(--color-text-muted, #94a3b8)",
            flexShrink:   0,
          }}
        />

        {/* Roles emojis */}
        <span style={{ fontSize: "13px", flexShrink: 0 }}>{rolesEmojis(p)}</span>

        {/* RFC o email */}
        {p.rfc ? (
          <span
            style={{
              fontFamily:   "ui-monospace, monospace",
              opacity:      0.7,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              minWidth:     0,
              flex:         1,
            }}
          >
            {p.rfc}
          </span>
        ) : p.email ? (
          <span
            style={{
              opacity:      0.7,
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
              minWidth:     0,
              flex:         1,
            }}
          >
            {p.email}
          </span>
        ) : null}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.partner.id === next.partner.id &&
  prev.partner.name === next.partner.name &&
  prev.partner.rfc === next.partner.rfc &&
  prev.partner.status === next.partner.status &&
  prev.partner.is_customer === next.partner.is_customer &&
  prev.partner.is_supplier === next.partner.is_supplier &&
  prev.partner.is_logistics_provider === next.partner.is_logistics_provider &&
  prev.isSelected === next.isSelected
);