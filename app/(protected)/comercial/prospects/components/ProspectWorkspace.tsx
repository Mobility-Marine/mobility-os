"use client";

import { useEffect, useState } from "react";
import type { Prospect } from "../types/prospects.types";
import { STAGE_ORDER, STAGE_CONFIG } from "../types/prospects.types";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { shouldMoveToOpportunity, getProspectStage } from "../services/prospects.normalization";
import { convertProspectToCustomer } from "../services/prospect-conversion.service";
import ProspectActivityTimeline from "./ProspectActivityTimeline";
import type { CreateActivityPayload } from "../types/prospects.types";

type Props = {
  prospect:        Prospect | null;
  updateProspect:  (id: string, payload: any) => Promise<any>;
  archiveProspect: (id: string) => Promise<any>;
  onStageChange?:  (id: string, stage: string) => Promise<any>;
  onAddActivity?:  (payload: CreateActivityPayload) => Promise<void>;
  createProspect:  (payload: any) => Promise<any>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default function ProspectWorkspace({
  prospect, updateProspect, archiveProspect, onStageChange, onAddActivity, createProspect,
}: Props) {
  const { companyId }    = useTenant();
  const { t, lang }      = useTranslation();
  const [form, setForm]  = useState<any>({});
  const [saving, setSaving]     = useState(false);
  const [converting, setConverting] = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    if (prospect) setForm({ ...prospect });
    else setForm({});
  }, [prospect?.id]);

  function set(key: string, value: any) {
    setForm((p: any) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    if (!prospect?.id) return;
    setSaving(true);
    try {
      await updateProspect(prospect.id, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (!companyId || !prospect) return;
    if (!confirm(t.prospects.confirmConvert)) return;
    setConverting(true);
    try {
      await convertProspectToCustomer(companyId, prospect.id, {});
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConverting(false);
    }
  }

  // ── EMPTY STATE ──
  if (!prospect) {
    return (
      <div style={container}>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)" }}>
          {t.prospects.workspaceTitle}
        </div>
        <div style={{
          background: "var(--color-bg-subtle)",
          border: "1px dashed var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "48px 32px",
          textAlign: "center",
          display: "grid", gap: "10px",
          flex: 1,
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" style={{ margin: "0 auto" }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {t.prospects.workspaceEmpty}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)", maxWidth: "360px", margin: "0 auto", lineHeight: 1.6 }}>
            {t.prospects.workspaceEmptyDesc}
          </div>
        </div>
      </div>
    );
  }

  const stage = getProspectStage(prospect);
  const cfg   = STAGE_CONFIG[stage];
  const stageLabel = (t.prospects as any)[cfg.labelKey.replace("prospects.", "")] ?? stage;

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {prospect.company_name ?? prospect.name ?? t.prospects.noName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
              <span style={{
                padding: "3px 10px", borderRadius: "var(--radius-full)",
                background: cfg.bg, border: `1px solid ${cfg.border}`,
                fontSize: "11px", fontWeight: 700, color: cfg.color,
              }}>
                {stageLabel}
              </span>
              {prospect.estimated_value && (
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>
                  ${Number(prospect.estimated_value).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* STAGE STEPPER */}
        <div style={{ display: "flex", gap: "4px", marginTop: "14px", overflowX: "auto", paddingBottom: "4px" }}>
          {STAGE_ORDER.filter((s) => s !== "lost").map((s) => {
            const c      = STAGE_CONFIG[s];
            const active = s === stage;
            const past   = STAGE_ORDER.indexOf(s) < STAGE_ORDER.indexOf(stage);
            return (
              <button
                key={s}
                onClick={() => onStageChange && onStageChange(prospect.id, s)}
                disabled={!onStageChange}
                style={{
                  flex: 1, height: "28px", border: "none",
                  borderRadius: "var(--radius-sm)",
                  background: active ? c.color : past ? c.color + "40" : "var(--color-border-faint)",
                  color: active ? "#fff" : past ? c.color : "var(--color-text-muted)",
                  fontSize: "10px", fontWeight: active ? 700 : 500,
                  cursor: onStageChange ? "pointer" : "default",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  transition: "var(--transition-fast)",
                }}
              >
                {(t.prospects as any)[c.labelKey.replace("prospects.", "")] ?? s}
              </button>
            );
          })}
        </div>
      </div>

      {/* BODY — scrollable */}
      <div style={contentArea}>

        {/* FORM */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Field label={t.prospects.name}>
            <input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} style={INPUT} />
          </Field>
          <Field label={t.prospects.company}>
            <input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} style={INPUT} />
          </Field>
          <Field label={t.prospects.email}>
            <input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} style={INPUT} />
          </Field>
          <Field label={t.prospects.phone}>
            <input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} style={INPUT} />
          </Field>
          <Field label={t.prospects.estimatedValue}>
            <input type="number" value={form.estimated_value ?? ""} onChange={(e) => set("estimated_value", e.target.value)} style={INPUT} />
          </Field>
          <Field label={t.prospects.interestedService}>
            <input value={form.interested_service ?? ""} onChange={(e) => set("interested_service", e.target.value)} style={INPUT} />
          </Field>
        </div>

        <Field label={t.prospects.notes}>
          <textarea
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={t.prospects.notesPlaceholder}
            style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }}
          />
        </Field>

        {/* READY FOR OPPORTUNITY */}
        {shouldMoveToOpportunity(prospect) && (
          <div style={{
            padding: "14px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success-border)",
            display: "grid", gap: "4px",
          }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>
              {t.prospects.readyForOpportunity}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
              {t.prospects.readyForOpportunityDesc}
            </div>
          </div>
        )}

        {/* TIMELINE */}
        <ProspectActivityTimeline
          activities={prospect.activities ?? []}
          onAdd={onAddActivity}
        />

        {/* ACTIONS */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "8px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: "38px", padding: "0 20px",
              borderRadius: "var(--radius-md)",
              background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
              color: "#fff", border: "none",
              fontSize: "13px", fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
              transition: "var(--transition-fast)",
            }}
          >
            {saving ? t.general.loading : saved ? t.prospects.saved : t.prospects.saveChanges}
          </button>
          <button
            onClick={handleConvert}
            disabled={converting}
            style={{
              height: "38px", padding: "0 20px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-success-bg)",
              border: "1px solid var(--color-success-border)",
              color: "var(--color-success-text)",
              fontSize: "13px", fontWeight: 700,
              cursor: converting ? "not-allowed" : "pointer",
              opacity: converting ? 0.6 : 1,
            }}
          >
            {converting ? t.general.loading : t.prospects.convertToClient}
          </button>
          <button
            onClick={() => archiveProspect(prospect.id)}
            style={{
              height: "38px", padding: "0 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-danger-bg)",
              border: "1px solid var(--color-danger-border)",
              color: "var(--color-danger-text)",
              fontSize: "13px", fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.prospects.markAsLost}
          </button>
        </div>
      </div>
    </div>
  );
}

const container: React.CSSProperties = {
  background: "var(--color-bg-base)",
  border: "1px solid var(--color-border-faint)",
  borderRadius: "var(--radius-lg)",
  padding: "20px",
  display: "flex", flexDirection: "column", gap: "16px",
  height: "100%", minHeight: 0, overflow: "hidden",
};

const contentArea: React.CSSProperties = {
  flex: 1, overflowY: "auto",
  display: "flex", flexDirection: "column", gap: "14px",
  paddingRight: "4px",
};
