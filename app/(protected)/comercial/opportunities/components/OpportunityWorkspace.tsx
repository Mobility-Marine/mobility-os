"use client";

import { useEffect, useState } from "react";
import type { Opportunity, OpportunityActivity } from "../types/opportunities.types";
import { STAGE_ORDER, STAGE_CONFIG } from "../types/opportunities.types";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { getOpportunityStage, governanceAlert } from "../services/opportunities.normalization";

type Props = {
  opportunity:  Opportunity | null;
  activities:   OpportunityActivity[];
  actLoading:   boolean;
  onUpdate:     (id: string, updates: Partial<Opportunity>) => Promise<void>;
  onStageChange:(id: string, stage: string) => Promise<void>;
  onArchive:    (id: string) => Promise<void>;
  onAddActivity:(desc: string, type?: string) => Promise<void>;
  onToggleActivity: (id: string, completed: boolean) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function OpportunityWorkspace({
  opportunity, activities, actLoading,
  onUpdate, onStageChange, onArchive, onAddActivity, onToggleActivity,
}: Props) {
  const { t } = useTranslation();
  const [form,      setForm]      = useState<any>({});
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [actText,   setActText]   = useState("");
  const [addingAct, setAddingAct] = useState(false);

  useEffect(() => {
    if (opportunity) setForm({ ...opportunity });
    else setForm({});
  }, [opportunity?.id]);

  function set(key: string, value: any) {
    setForm((p: any) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    if (!opportunity?.id) return;
    setSaving(true);
    try {
      await onUpdate(opportunity.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  async function handleAddActivity() {
    if (!actText.trim()) return;
    setAddingAct(true);
    try {
      await onAddActivity(actText);
      setActText("");
    } finally { setAddingAct(false); }
  }

  if (!opportunity) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "32px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", height: "100%",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {(t.opportunities as any)?.workspaceEmpty ?? "Selecciona una oportunidad"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
          {(t.opportunities as any)?.workspaceEmptyDesc ?? "Aquí podrás gestionar el deal, actividades y progreso de cierre."}
        </div>
      </div>
    );
  }

  const stage      = getOpportunityStage(opportunity);
  const cfg        = STAGE_CONFIG[stage];
  const govAlert   = governanceAlert(opportunity);
  const stageLabel = (t.opportunities as any)?.[cfg.labelKey.replace("opportunities.", "")] ?? stage;

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "20px",
      display: "flex", flexDirection: "column", gap: "14px",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {opportunity.company_name ?? opportunity.name}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "5px" }}>
              <span style={{ padding: "2px 10px", borderRadius: "var(--radius-full)", background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: "11px", fontWeight: 700, color: cfg.color }}>
                {stageLabel}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>
                ${Number(opportunity.value ?? 0).toLocaleString()}
              </span>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                {opportunity.probability}%
              </span>
            </div>
          </div>
        </div>

        {/* Stage stepper */}
        <div style={{ display: "flex", gap: "3px", overflowX: "auto", paddingBottom: "2px" }}>
          {STAGE_ORDER.filter((s) => s !== "lost").map((s) => {
            const c      = STAGE_CONFIG[s];
            const active = s === stage;
            const past   = STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(stage);
            const label  = (t.opportunities as any)?.[c.labelKey.replace("opportunities.", "")] ?? s;
            return (
              <button key={s} onClick={() => onStageChange(opportunity.id, s)} style={{
                flex: 1, height: "26px", border: "none",
                borderRadius: "var(--radius-sm)",
                background: active ? c.color : past ? c.color + "40" : "var(--color-border-faint)",
                color: active ? "#fff" : past ? c.color : "var(--color-text-muted)",
                fontSize: "10px", fontWeight: active ? 700 : 500,
                cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                transition: "var(--transition-fast)",
              }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GOVERNANCE ALERT */}
      {govAlert && (
        <div style={{
          padding: "8px 12px", borderRadius: "var(--radius-md)", flexShrink: 0,
          background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)",
          fontSize: "12px", fontWeight: 600, color: "var(--color-warning-text)",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          {(t.opportunities as any)?.[govAlert.replace("opportunities.", "")] ?? govAlert}
        </div>
      )}

      {/* SCROLLABLE BODY */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
        {/* FORM */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { key: "value",        label: (t.opportunities as any)?.value       ?? "Valor",           type: "number" },
            { key: "probability",  label: (t.opportunities as any)?.probability ?? "Probabilidad (%)", type: "number" },
            { key: "owner",        label: (t.opportunities as any)?.owner       ?? "Responsable",      type: "text"   },
            { key: "next_action",  label: (t.opportunities as any)?.nextAction  ?? "Próxima acción",   type: "text"   },
          ].map((f) => (
            <div key={f.key}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {f.label}
              </div>
              <input
                type={f.type}
                value={form[f.key] ?? ""}
                onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                style={INPUT}
              />
            </div>
          ))}
        </div>

        {/* ACTIVITIES */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {(t.opportunities as any)?.activities ?? "Actividades"} ({activities.length})
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              placeholder={(t.opportunities as any)?.activityPlaceholder ?? "Nueva actividad…"}
              value={actText}
              onChange={(e) => setActText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
              style={{ ...INPUT, flex: 1 }}
            />
            <button
              onClick={handleAddActivity}
              disabled={addingAct || !actText.trim()}
              style={{
                height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0,
              }}
            >
              {(t.general as any)?.add ?? "Agregar"}
            </button>
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {actLoading ? (
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>
            ) : activities.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "12px", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)" }}>
                {(t.opportunities as any)?.noActivities ?? "Sin actividades"}
              </div>
            ) : activities.map((a) => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
              }}>
                <input
                  type="checkbox"
                  checked={!!a.completed}
                  onChange={() => onToggleActivity(a.id, !!a.completed)}
                  style={{ cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{
                  fontSize: "12px", flex: 1,
                  color: a.completed ? "var(--color-text-muted)" : "var(--color-text-primary)",
                  textDecoration: a.completed ? "line-through" : "none",
                }}>
                  {a.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "8px" }}>
          <button onClick={handleSave} disabled={saving} style={{
            height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)",
            background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
            color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer",
            transition: "var(--transition-fast)",
          }}>
            {saving ? t.general.loading : saved ? (t.opportunities as any)?.saved ?? "Guardado" : t.general.save}
          </button>
          <button onClick={() => onArchive(opportunity.id)} style={{
            height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)",
            background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
            color: "var(--color-danger-text)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
          }}>
            {(t.opportunities as any)?.archive ?? "Archivar"}
          </button>
        </div>
      </div>
    </div>
  );
}
