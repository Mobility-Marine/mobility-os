"use client";

import React, { memo } from "react";
import type { Prospect } from "../types/prospects.types";
import { STAGE_CONFIG } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getProspectStage,
  isProspectActive,
  isHighValue,
  hasContact,
} from "../services/prospects.normalization";

import VirtualSidebar from "@/app/components/shared/VirtualSidebar";
import { IconInbox } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// PROSPECTS SIDEBAR — Virtualizado · escalable a 100K+ prospectos
//
// Patrón Linear / Salesforce con peculiaridad:
//   - 4 KPIs siempre visibles arriba (Activos / Alto valor / Sin contacto /
//     Calificados) — son el pulso comercial inmediato del módulo.
//   - Botón "Nuevo prospecto" en header
//   - Search (sin filterDrawer porque no hay filtros adicionales)
//   - VirtualList con react-window
//
// Item ~95px:
//   Row 1: empresa/nombre · stage badge
//   Row 2: email · teléfono
//   Row 3: badges (valor estimado, sin contacto, revenue ready, health)
// ═══════════════════════════════════════════════════════════════════

type Props = {
  search:       string;
  setSearch:    (v: string) => void;
  prospects:    Prospect[];
  selected:     Prospect | null;
  setSelected:  (p: Prospect) => void;
  onOpenCreate: () => void;
};

const ITEM_HEIGHT = 95;

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function ProspectsSidebar({
  search,
  setSearch,
  prospects,
  selected,
  setSelected,
  onOpenCreate,
}: Props) {
  const { t } = useTranslation();

  // ── KPIs (calculados desde lista filtrada) ────────────────────────
  const active = prospects.filter(isProspectActive).length;
  const hot = prospects.filter((p) => isHighValue(p, 50_000)).length;
  const noContact = prospects.filter(
    (p) => !hasContact(p) && (p.is_active ?? true),
  ).length;
  const qualified = prospects.filter(
    (p) => getProspectStage(p) === "qualified",
  ).length;

  const kpis = [
    {
      label: t.prospects.active,
      value: active,
      color: "var(--color-brand-blue)",
    },
    {
      label: t.prospects.highValue,
      value: hot,
      color: "var(--color-success-text)",
    },
    {
      label: t.prospects.noContact,
      value: noContact,
      color: noContact > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)",
    },
    {
      label: t.prospects.qualified,
      value: qualified,
      color: "var(--color-info-text)",
    },
  ];

  // ── KPI Grid (topSlot del VirtualSidebar) ─────────────────────────
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
    <VirtualSidebar<Prospect>
      title={t.prospects.title}
      count={prospects.length}
      topSlot={kpiGrid}
      search={{
        value: search,
        onChange: setSearch,
        placeholder: t.prospects.search,
        hint: "Empresa · email · teléfono",
      }}
      headerActions={[
        {
          label: t.prospects.newProspect,
          icon: <IconPlus />,
          onClick: onOpenCreate,
          variant: "primary",
        },
      ]}
      items={prospects}
      selectedId={selected?.id ?? null}
      onSelect={setSelected}
      getItemId={(p) => p.id}
      itemHeight={ITEM_HEIGHT}
      renderItem={(p, _i, isSelected) => (
        <ProspectItem prospect={p} isSelected={isSelected} t={t} />
      )}
      emptyState={{
        icon: <IconInbox size={32} />,
        title: t.prospects.noProspects ?? "Sin prospectos",
        description: search
          ? "Ajusta tu búsqueda"
          : "Crea tu primer prospecto para empezar",
        action: !search
          ? { label: t.prospects.newProspect ?? "Nuevo prospecto", onClick: onOpenCreate }
          : undefined,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════
// PROSPECT ITEM (memo)
// ═══════════════════════════════════════════════════════════════════
const ProspectItem = memo(function ProspectItem({
  prospect: p,
  isSelected,
  t,
}: {
  prospect:   Prospect;
  isSelected: boolean;
  t:          any;
}) {
  const stage = getProspectStage(p);
  const cfg = STAGE_CONFIG[stage];
  const stageLabel =
    (t.prospects as any)[cfg.labelKey.replace("prospects.", "")] ?? stage;
  const noContactFlag = !hasContact(p);
  const isProposal = stage === "proposal" || stage === "negotiation";

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
      {/* ROW 1 — empresa/nombre + stage */}
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
          {p.company_name ?? p.name ?? t.prospects.noName}
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

      {/* ROW 2 — email · phone */}
      <div
        style={{
          fontSize:     "11px",
          color:        "var(--color-text-muted)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          width:        "100%",
        }}
      >
        {p.email ?? t.prospects.noEmail} · {p.phone ?? t.prospects.noPhone}
      </div>

      {/* ROW 3 — badges */}
      <div
        style={{
          display:    "flex",
          gap:        "5px",
          flexWrap:   "nowrap",
          overflow:   "hidden",
          minWidth:   0,
          width:      "100%",
        }}
      >
        {p.estimated_value && (
          <span
            style={{
              fontSize:     "10px",
              fontWeight:   700,
              padding:      "1px 6px",
              borderRadius: "var(--radius-full)",
              background:   "var(--color-success-bg)",
              color:        "var(--color-success-text)",
              border:       "1px solid var(--color-success-border)",
              whiteSpace:   "nowrap",
              flexShrink:   0,
            }}
          >
            ${formatCompact(Number(p.estimated_value))}
          </span>
        )}
        {noContactFlag && (
          <span
            style={{
              fontSize:     "10px",
              fontWeight:   700,
              padding:      "1px 6px",
              borderRadius: "var(--radius-full)",
              background:   "var(--color-danger-bg)",
              color:        "var(--color-danger-text)",
              border:       "1px solid var(--color-danger-border)",
              whiteSpace:   "nowrap",
              flexShrink:   0,
            }}
          >
            {t.prospects.noContact}
          </span>
        )}
        {isProposal && (
          <span
            style={{
              fontSize:     "10px",
              fontWeight:   700,
              padding:      "1px 6px",
              borderRadius: "var(--radius-full)",
              background:   "var(--color-brand-blue-light)",
              color:        "var(--color-brand-blue)",
              whiteSpace:   "nowrap",
              flexShrink:   0,
            }}
          >
            {t.prospects.revenueReady}
          </span>
        )}
        {p.health && (
          <span
            style={{
              fontSize:   "10px",
              color:      "var(--color-text-muted)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              marginLeft: "auto",
            }}
          >
            {p.health.score}/100
          </span>
        )}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.prospect.id === next.prospect.id &&
  prev.prospect.updated_at === next.prospect.updated_at &&
  prev.prospect.is_active === next.prospect.is_active &&
  prev.isSelected === next.isSelected
);

// ─── Compact format para badges (evita $1,500,000 que rompe layout) ──
function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)    return `${(value / 1_000).toFixed(0)}K`;
  return value.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}