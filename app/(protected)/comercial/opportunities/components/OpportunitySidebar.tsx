"use client";

import React, { memo } from "react";
import type { Opportunity } from "../types/opportunities.types";
import { STAGE_CONFIG } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getOpportunityStage,
  isOpenOpportunity,
  expectedRevenue,
  isStalled,
} from "../services/opportunities.normalization";

import VirtualSidebar from "@/app/components/shared/VirtualSidebar";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// OPPORTUNITIES SIDEBAR — Virtualizado · escalable a 100K+ oportunidades
//
// Patrón Linear / Salesforce con peculiaridad:
//   - 4 KPIs siempre visibles arriba (Abiertos / En riesgo / Estancados / Total)
//   - Botón "Nueva oportunidad" en header
//   - Search (sin filterDrawer porque no hay filtros adicionales)
//   - VirtualList con react-window
//
// Item ~80px:
//   Row 1: empresa/nombre · stage badge
//   Row 2: valor·% · expected revenue
//   Row 3: badge "Estancado" (si aplica)
// ═══════════════════════════════════════════════════════════════════

type Props = {
  search:        string;
  setSearch:     (v: string) => void;
  opportunities: Opportunity[];
  selected:      Opportunity | null;
  setSelected:   (o: Opportunity) => void;
  onOpenCreate:  () => void;
};

const ITEM_HEIGHT = 82;

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function OpportunitySidebar({
  search,
  setSearch,
  opportunities,
  selected,
  setSelected,
  onOpenCreate,
}: Props) {
  const { t } = useTranslation();
  const to = (t.opportunities as any) ?? {};

  // ── KPIs (sobre lista filtrada) ───────────────────────────────────
  const open = opportunities.filter(isOpenOpportunity).length;
  const atRisk = opportunities.filter(
    (o) => (o.probability ?? 0) < 40 && isOpenOpportunity(o),
  ).length;
  const stalledC = opportunities.filter(isStalled).length;

  const kpis = [
    {
      label: to.open ?? "Abiertos",
      value: open,
      color: "var(--color-brand-blue)",
    },
    {
      label: to.atRisk ?? "En riesgo",
      value: atRisk,
      color: atRisk > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)",
    },
    {
      label: to.stalledS ?? "Estanc.",
      value: stalledC,
      color:
        stalledC > 0 ? "var(--color-warning-text)" : "var(--color-text-muted)",
    },
    {
      label: to.total ?? "Total",
      value: opportunities.length,
      color: "var(--color-text-second)",
    },
  ];

  const kpiGrid = (
    <div
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap:                 "6px",
      }}
    >
      {kpis.map((k) => (
        <div
          key={k.label}
          style={{
            background:   "var(--color-bg-subtle)",
            border:       "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)",
            padding:      "7px 10px",
            textAlign:    "center",
          }}
        >
          <div
            style={{
              fontSize:     "10px",
              color:        "var(--color-text-muted)",
              marginBottom: "2px",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontSize:           "16px",
              fontWeight:         800,
              color:              k.color,
              fontVariantNumeric: "tabular-nums",
              lineHeight:         1.1,
            }}
          >
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <VirtualSidebar<Opportunity>
      title={to.title ?? "Oportunidades"}
      count={opportunities.length}
      topSlot={kpiGrid}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: to.search ?? "Buscar oportunidad…",
        hint: "Empresa · contacto",
      }}
      headerActions={[
        {
          label: to.newOpportunity ?? "Nueva oportunidad",
          icon: <IconPlus />,
          onClick: onOpenCreate,
          variant: "primary",
        },
      ]}
      items={opportunities}
      selectedId={selected?.id ?? null}
      onSelect={setSelected}
      getItemId={(o) => o.id}
      itemHeight={ITEM_HEIGHT}
      renderItem={(o, _i, isSelected) => (
        <OpportunityItem opp={o} isSelected={isSelected} to={to} />
      )}
      emptyState={{
        icon: <IconInbox size={32} />,
        title: to.noOpportunities ?? "Sin oportunidades",
        description: search
          ? "Ajusta tu búsqueda"
          : "Crea tu primera oportunidad para empezar",
        action: !search
          ? { label: to.newOpportunity ?? "Nueva oportunidad", onClick: onOpenCreate }
          : undefined,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// OPPORTUNITY ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const OpportunityItem = memo(function OpportunityItem({
  opp: o,
  isSelected,
  to,
}: {
  opp:        Opportunity;
  isSelected: boolean;
  to:         any;
}) {
  const stage = getOpportunityStage(o);
  const cfg = STAGE_CONFIG[stage];
  const stageLabel =
    to[cfg.labelKey.replace("opportunities.", "")] ?? stage;
  const rev = expectedRevenue(o);
  const stall = isStalled(o);

  return (
    <div
      style={{
        // ── ANTI-OVERFLOW ──
        width:        "100%",
        boxSizing:    "border-box",
        overflow:     "hidden",
        // ── visual ──
        padding:      "10px 11px",
        borderRadius: "var(--radius-md)",
        background:   isSelected
          ? "var(--color-bg-active)"
          : "var(--color-bg-subtle)",
        border:       isSelected
          ? "1px solid var(--color-brand-blue)"
          : "1px solid var(--color-border-faint)",
        display:      "flex",
        flexDirection:"column",
        gap:          "4px",
        transition:   "var(--transition-fast)",
        height:       "calc(100% - 5px)",
      }}
    >
      {/* ROW 1 — empresa + stage */}
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "6px",
          minWidth:   0,
          width:      "100%",
        }}
      >
        <span
          style={{
            fontSize:     "13px",
            fontWeight:   700,
            color:        "var(--color-text-primary)",
            flex:         1,
            minWidth:     0,
            overflow:     "hidden",
            textOverflow: "ellipsis",
            whiteSpace:   "nowrap",
          }}
        >
          {o.company_name ?? o.name}
        </span>
        <span
          style={{
            fontSize:      "9px",
            fontWeight:    700,
            padding:       "2px 6px",
            borderRadius:  "var(--radius-full)",
            background:    cfg.bg,
            color:         cfg.color,
            border:        `1px solid ${cfg.border}`,
            flexShrink:    0,
            textTransform: "uppercase",
            whiteSpace:    "nowrap",
          }}
        >
          {stageLabel}
        </span>
      </div>

      {/* ROW 2 — valor · probabilidad · expected revenue */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          fontSize:       "11px",
          color:          "var(--color-text-muted)",
          gap:            "8px",
          width:          "100%",
        }}
      >
        <span
          style={{
            overflow:           "hidden",
            textOverflow:       "ellipsis",
            whiteSpace:         "nowrap",
            fontVariantNumeric: "tabular-nums",
            flexShrink:         1,
            minWidth:           0,
          }}
        >
          ${formatCompact(Number(o.value ?? 0))} · {o.probability ?? 0}%
        </span>
        <span
          style={{
            color:              "var(--color-success-text)",
            fontWeight:         700,
            fontVariantNumeric: "tabular-nums",
            whiteSpace:         "nowrap",
            flexShrink:         0,
          }}
        >
          ${formatCompact(Math.round(rev))}
        </span>
      </div>

      {/* ROW 3 — stalled (opcional) */}
      {stall && (
        <span
          style={{
            fontSize:   "10px",
            fontWeight: 700,
            color:      "var(--color-warning-text)",
            display:    "flex",
            alignItems: "center",
            gap:        "4px",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {to.stalled ?? "Estancado"}
        </span>
      )}
    </div>
  );
}, (prev, next) =>
  prev.opp.id === next.opp.id &&
  prev.opp.updated_at === next.opp.updated_at &&
  prev.opp.value === next.opp.value &&
  prev.opp.probability === next.opp.probability &&
  prev.isSelected === next.isSelected
);

// ─── Compact format para no romper layout ────────────────────────────
function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)    return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}