"use client";

import type { Prospect } from "../types/prospects.types";
import { STAGE_CONFIG } from "../types/prospects.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  getProspectStage, isProspectActive, isHighValue, hasContact,
} from "../services/prospects.normalization";

type Props = {
  search:       string;
  setSearch:    (v: string) => void;
  prospects:    Prospect[];
  selected:     Prospect | null;
  setSelected:  (p: Prospect) => void;
  onOpenCreate: () => void;
};

export default function ProspectsSidebar({
  search, setSearch, prospects, selected, setSelected, onOpenCreate,
}: Props) {
  const { t } = useTranslation();

  const active    = prospects.filter(isProspectActive);
  const hot       = prospects.filter((p) => isHighValue(p, 50_000));
  const noContact = prospects.filter((p) => !hasContact(p) && (p.is_active ?? true));
  const qualified = prospects.filter((p) => getProspectStage(p) === "qualified");

  const kpis = [
    { label: t.prospects.active,    value: active.length,    color: "var(--color-brand-blue)"   },
    { label: t.prospects.highValue, value: hot.length,       color: "var(--color-success-text)" },
    { label: t.prospects.noContact, value: noContact.length, color: noContact.length > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" },
    { label: t.prospects.qualified, value: qualified.length, color: "var(--color-info-text)"    },
  ];

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "14px",
      display: "flex", flexDirection: "column", gap: "12px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {t.prospects.title}
        </div>
        <button
          onClick={onOpenCreate}
          style={{
            height: "30px", padding: "0 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)",
            color: "#fff", border: "none",
            fontSize: "12px", fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "5px",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t.prospects.newProspect}
        </button>
      </div>

      {/* SEARCH */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
        >
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          placeholder={t.prospects.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%", height: "34px",
            paddingLeft: "30px", paddingRight: "12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg-subtle)",
            color: "var(--color-text-primary)",
            fontSize: "13px", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", flexShrink: 0 }}>
        {kpis.map((k) => (
          <div key={k.label} style={{
            background: "var(--color-bg-subtle)",
            border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-md)",
            padding: "8px 10px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{k.label}</div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* LIST */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "grid", gap: "6px", alignContent: "start" }}>
        {prospects.length === 0 ? (
          <div style={{
            padding: "32px 16px", textAlign: "center",
            color: "var(--color-text-muted)", fontSize: "13px",
          }}>
            {t.prospects.noProspects}
          </div>
        ) : prospects.map((p) => {
          const isSelected = selected?.id === p.id;
          const stage      = getProspectStage(p);
          const cfg        = STAGE_CONFIG[stage];
          const stageLabel = (t.prospects as any)[cfg.labelKey.replace("prospects.", "")] ?? stage;

          return (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: "12px",
                borderRadius: "var(--radius-md)",
                background: isSelected ? "var(--color-bg-active)" : "var(--color-bg-subtle)",
                border: isSelected
                  ? "1px solid var(--color-brand-blue)"
                  : "1px solid var(--color-border-faint)",
                cursor: "pointer",
                display: "grid", gap: "6px",
                transition: "var(--transition-fast)",
                boxShadow: isSelected ? "0 0 0 1px var(--color-brand-blue)20 inset" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-border-faint)";
              }}
            >
              {/* TOP ROW */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <div style={{
                  fontSize: "13px", fontWeight: 700,
                  color: "var(--color-text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                }}>
                  {p.company_name ?? p.name ?? t.prospects.noName}
                </div>
                <span style={{
                  fontSize: "9px", fontWeight: 700,
                  padding: "2px 6px", borderRadius: "var(--radius-full)",
                  background: cfg.bg, color: cfg.color,
                  border: `1px solid ${cfg.border}`,
                  flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.3px",
                }}>
                  {stageLabel}
                </span>
              </div>

              {/* META */}
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.email ?? t.prospects.noEmail} · {p.phone ?? t.prospects.noPhone}
              </div>

              {/* BADGES */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {p.estimated_value && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "var(--radius-full)",
                    background: "var(--color-success-bg)", color: "var(--color-success-text)",
                    border: "1px solid var(--color-success-border)",
                  }}>
                    ${Number(p.estimated_value).toLocaleString()}
                  </span>
                )}
                {!hasContact(p) && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "var(--radius-full)",
                    background: "var(--color-danger-bg)", color: "var(--color-danger-text)",
                    border: "1px solid var(--color-danger-border)",
                  }}>
                    {t.prospects.noContact}
                  </span>
                )}
                {(stage === "proposal" || stage === "negotiation") && (
                  <span style={{
                    fontSize: "10px", fontWeight: 700,
                    padding: "2px 7px", borderRadius: "var(--radius-full)",
                    background: "var(--color-brand-blue-light)", color: "var(--color-brand-blue)",
                  }}>
                    {t.prospects.revenueReady}
                  </span>
                )}
                {p.health && (
                  <span style={{
                    fontSize: "10px", color: "var(--color-text-muted)",
                  }}>
                    {p.health.score}/100
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
