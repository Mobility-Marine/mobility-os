// ════════════════════════════════════════════════════════════════════════
// PartnerSidebar — Lista lateral del módulo Partners
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
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

export type PartnerSidebarProps = {
  partners:        PartnerListItem[];
  allPartners:     PartnerListItem[];
  stats:           PartnerStats;
  filters:         PartnerFilters;
  selectedId:      string | null;
  onFiltersChange: (filters: PartnerFilters) => void;
  onSelectPartner: (id: string | null) => void;
};

const SIDEBAR: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  height:         "100%",
  minHeight:      0,
  borderRadius:   "var(--radius-lg, 12px)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  overflow:       "hidden",
};

const TABS_ROW: CSSProperties = {
  display:         "flex",
  gap:             "4px",
  padding:         "10px 10px 0 10px",
  borderBottom:    "1px solid var(--color-border)",
  background:      "var(--color-bg-subtle)",
};

const TAB: CSSProperties = {
  flex:            1,
  display:         "flex",
  flexDirection:   "column",
  alignItems:      "center",
  padding:         "8px 6px 10px 6px",
  borderRadius:    "var(--radius-md) var(--radius-md) 0 0",
  background:      "transparent",
  border:          "none",
  borderBottom:    "2px solid transparent",
  color:           "var(--color-text-muted)",
  fontSize:        "11px",
  fontWeight:      600,
  cursor:          "pointer",
  outline:         "none",
  transition:      "color 0.15s, border-color 0.15s, background 0.15s",
};

const TAB_ACTIVE: CSSProperties = {
  ...TAB,
  color:           "var(--color-brand-blue, #3b82f6)",
  borderBottom:    "2px solid var(--color-brand-blue, #3b82f6)",
  background:      "var(--color-bg-elevated)",
};

const TAB_EMOJI: CSSProperties = {
  fontSize:        "18px",
  marginBottom:    "2px",
};

const TAB_COUNT: CSSProperties = {
  fontSize:        "10px",
  marginTop:       "1px",
  opacity:         0.7,
  fontVariantNumeric: "tabular-nums",
};

const SEARCH_BAR: CSSProperties = {
  display:        "flex",
  gap:            "6px",
  padding:        "10px",
  borderBottom:   "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
};

const SEARCH_INPUT: CSSProperties = {
  flex:           1,
  height:         "32px",
  padding:        "0 10px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  color:          "var(--color-text-primary)",
  fontSize:       "12px",
  outline:        "none",
};

const FILTERS_TOGGLE: CSSProperties = {
  height:         "32px",
  padding:        "0 10px",
  borderRadius:   "var(--radius-md)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  color:          "var(--color-text-muted)",
  fontSize:       "12px",
  fontWeight:     600,
  cursor:         "pointer",
  outline:        "none",
};

const FILTERS_PANEL: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "8px",
  padding:        "10px",
  borderBottom:   "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
};

const FILTER_ROW: CSSProperties = {
  display:        "flex",
  gap:            "8px",
  alignItems:     "center",
};

const FILTER_LABEL: CSSProperties = {
  fontSize:       "10px",
  fontWeight:     600,
  letterSpacing:  "0.3px",
  textTransform:  "uppercase",
  color:          "var(--color-text-muted)",
  width:          "60px",
  flexShrink:     0,
};

const FILTER_SELECT: CSSProperties = {
  flex:           1,
  height:         "28px",
  padding:        "0 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-elevated)",
  color:          "var(--color-text-primary)",
  fontSize:       "12px",
  outline:        "none",
};

const LIST_CONTAINER: CSSProperties = {
  flex:           1,
  overflowY:      "auto",
  minHeight:      0,
};

const LIST_ITEM: CSSProperties = {
  display:        "flex",
  flexDirection:  "column",
  gap:            "3px",
  padding:        "10px 12px",
  borderBottom:   "1px solid var(--color-border)",
  cursor:         "pointer",
  transition:     "background 0.1s",
};

const LIST_ITEM_ACTIVE: CSSProperties = {
  ...LIST_ITEM,
  background:     "rgba(59, 130, 246, 0.08)",
  borderLeft:     "3px solid var(--color-brand-blue, #3b82f6)",
  paddingLeft:    "9px",
};

const LIST_ITEM_NAME: CSSProperties = {
  fontSize:       "13px",
  fontWeight:     600,
  color:          "var(--color-text-primary)",
  overflow:       "hidden",
  textOverflow:   "ellipsis",
  whiteSpace:     "nowrap",
};

const LIST_ITEM_META: CSSProperties = {
  fontSize:       "11px",
  color:          "var(--color-text-muted)",
  display:        "flex",
  alignItems:     "center",
  gap:            "6px",
  overflow:       "hidden",
  whiteSpace:     "nowrap",
  textOverflow:   "ellipsis",
};

const STATUS_DOT_ACTIVE: CSSProperties = {
  width:          "6px",
  height:         "6px",
  borderRadius:   "50%",
  background:     "var(--color-success-text, #22c55e)",
  flexShrink:     0,
};

const STATUS_DOT_INACTIVE: CSSProperties = {
  ...STATUS_DOT_ACTIVE,
  background:     "var(--color-text-muted, #94a3b8)",
};

const EMPTY: CSSProperties = {
  padding:        "30px 16px",
  textAlign:      "center",
  fontSize:       "12px",
  color:          "var(--color-text-muted)",
};

const FOOTER: CSSProperties = {
  padding:        "8px 12px",
  borderTop:      "1px solid var(--color-border)",
  background:     "var(--color-bg-subtle)",
  fontSize:       "11px",
  color:          "var(--color-text-muted)",
  textAlign:      "center",
  fontVariantNumeric: "tabular-nums",
};

function countByRole(stats: PartnerStats, role: PartnerRoleFilter): number {
  switch (role) {
    case "all":       return stats.total;
    case "customer":  return stats.customers;
    case "supplier":  return stats.suppliers;
    case "logistics": return stats.logistics;
  }
}

export default function PartnerSidebar({
  partners,
  allPartners,
  stats,
  filters,
  selectedId,
  onFiltersChange,
  onSelectPartner,
}: PartnerSidebarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const { industries, countries } = useMemo(
    () => extractAvailableFilters(allPartners),
    [allPartners],
  );

  const hasAdvancedFilters =
    filters.status   !== "all" ||
    filters.industry !== "all" ||
    filters.country  !== "all";

  const update = (patch: Partial<PartnerFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  return (
    <div style={SIDEBAR}>
      <div style={TABS_ROW}>
        {(Object.keys(ROLE_FILTER_LABELS) as PartnerRoleFilter[]).map((role) => {
          const cfg    = ROLE_FILTER_LABELS[role];
          const count  = countByRole(stats, role);
          const active = filters.role === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => update({ role })}
              style={active ? TAB_ACTIVE : TAB}
              title={cfg.label}
            >
              <span style={TAB_EMOJI}>{cfg.emoji}</span>
              <span>{cfg.label}</span>
              <span style={TAB_COUNT}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={SEARCH_BAR}>
        <input
          type="search"
          placeholder="Buscar por nombre, RFC, email..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          style={SEARCH_INPUT}
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          style={{
            ...FILTERS_TOGGLE,
            ...(hasAdvancedFilters || showFilters
              ? { color: "var(--color-brand-blue, #3b82f6)", borderColor: "var(--color-brand-blue, #3b82f6)" }
              : {}),
          }}
          title="Filtros avanzados"
        >
          ⚙ {hasAdvancedFilters && <span>•</span>}
        </button>
      </div>

      {showFilters && (
        <div style={FILTERS_PANEL}>
          <div style={FILTER_ROW}>
            <span style={FILTER_LABEL}>Estado</span>
            <select
              value={filters.status}
              onChange={(e) => update({ status: e.target.value as PartnerFilters["status"] })}
              style={FILTER_SELECT}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="lead">Lead</option>
            </select>
          </div>

          <div style={FILTER_ROW}>
            <span style={FILTER_LABEL}>Industria</span>
            <select
              value={filters.industry}
              onChange={(e) => update({ industry: e.target.value as PartnerFilters["industry"] })}
              style={FILTER_SELECT}
            >
              <option value="all">Todas</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div style={FILTER_ROW}>
            <span style={FILTER_LABEL}>País</span>
            <select
              value={filters.country}
              onChange={(e) => update({ country: e.target.value })}
              style={FILTER_SELECT}
            >
              <option value="all">Todos</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {hasAdvancedFilters && (
            <button
              type="button"
              onClick={() =>
                update({ status: "all", industry: "all", country: "all" })
              }
              style={{
                ...FILTERS_TOGGLE,
                width:         "100%",
                color:         "var(--color-danger-text)",
                borderColor:   "var(--color-danger-text)",
                background:    "rgba(239, 68, 68, 0.05)",
                marginTop:     "4px",
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      <div style={LIST_CONTAINER}>
        {partners.length === 0 ? (
          <div style={EMPTY}>
            {allPartners.length === 0
              ? "Aún no hay partners registrados."
              : "Ningún partner coincide con los filtros."}
          </div>
        ) : (
          partners.map((p) => {
            const active = selectedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPartner(p.id)}
                style={active ? LIST_ITEM_ACTIVE : LIST_ITEM}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = "var(--color-bg-subtle)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent";
                }}
              >
                <div style={LIST_ITEM_NAME} title={p.name}>
                  {p.name}
                </div>
                <div style={LIST_ITEM_META}>
                  <span style={p.status === "active" ? STATUS_DOT_ACTIVE : STATUS_DOT_INACTIVE} />
                  <span style={{ fontSize: "13px" }}>{rolesEmojis(p)}</span>
                  {p.rfc && (
                    <span style={{ fontFamily: "monospace", opacity: 0.7 }}>
                      {p.rfc}
                    </span>
                  )}
                  {!p.rfc && p.email && (
                    <span style={{ opacity: 0.7, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.email}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={FOOTER}>
        Mostrando {partners.length} de {allPartners.length}
      </div>
    </div>
  );
}