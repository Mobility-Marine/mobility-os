"use client";

import { useState } from "react";
import type {
  CrmAccount, CrmActivity, CrmContact, CrmOpportunity,
  CrmOrder, TimelineItem, CreateContactPayload, CreateActivityPayload,
  CrmAccountInsights,
} from "../types/crm.types";
import { LIFECYCLE_CONFIG, ACTIVITY_TYPE_CONFIG } from "../types/crm.types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Tab = "overview" | "activities" | "contacts" | "opportunities" | "orders" | "timeline";

type Props = {
  account:       CrmAccount | null;
  insights:      CrmAccountInsights | null;
  activities:    CrmActivity[];
  contacts:      CrmContact[];
  opportunities: CrmOpportunity[];
  orders:        CrmOrder[];
  timeline:      TimelineItem[];
  detailLoading: boolean;
  onUpdateLifecycle: (id: string, stage: string) => Promise<void>;
  onAddActivity:    (payload: CreateActivityPayload) => Promise<void>;
  onCompleteActivity:(id: string, completed: boolean) => Promise<void>;
  onAddContact:     (payload: CreateContactPayload) => Promise<void>;
  onRemoveContact:  (id: string) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

const ACTIVITY_TYPES = ["call", "email", "meeting", "whatsapp", "visit", "task", "note"];
const DECISION_ROLES = ["decision_maker", "influencer", "user", "champion", "blocker"];

export default function AccountWorkspace({
  account, insights, activities, contacts, opportunities, orders,
  timeline, detailLoading, onUpdateLifecycle, onAddActivity,
  onCompleteActivity, onAddContact, onRemoveContact,
}: Props) {
  const { t, lang } = useTranslation();
  const locale       = lang === "en" ? "en-US" : "es-MX";
  const [tab, setTab] = useState<Tab>("overview");

  // Activity form
  const [actForm, setActForm] = useState({ type: "call", title: "", scheduled_at: "" });
  const [addingAct, setAddingAct] = useState(false);

  // Contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    first_name: "", last_name: "", job_title: "", department: "",
    email: "", phone: "", role_in_decision: "user",
  });
  const [addingContact, setAddingContact] = useState(false);

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "overview",       label: (t.crm as any)?.tabOverview      ?? "Resumen"       },
    { key: "activities",     label: (t.crm as any)?.tabActivities     ?? "Actividades",   count: activities.length     },
    { key: "contacts",       label: (t.crm as any)?.tabContacts       ?? "Contactos",     count: contacts.length       },
    { key: "opportunities",  label: (t.crm as any)?.tabOpportunities  ?? "Oportunidades", count: opportunities.length  },
    { key: "orders",         label: (t.crm as any)?.tabOrders         ?? "Logística",     count: orders.length         },
    { key: "timeline",       label: (t.crm as any)?.tabTimeline       ?? "Timeline",      count: timeline.length       },
  ];

  if (!account) {
    return (
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "32px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: "12px", height: "100%",
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          {(t.crm as any)?.workspaceEmpty ?? "Selecciona una cuenta"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center", maxWidth: "320px", lineHeight: 1.6 }}>
          {(t.crm as any)?.workspaceEmptyDesc ?? "Vista 360° del cliente — actividades, contactos, oportunidades, logística y finanzas."}
        </div>
      </div>
    );
  }

  const stage    = (account.lifecycle_stage ?? "customer") as any;
  const cfg      = LIFECYCLE_CONFIG[stage] ?? LIFECYCLE_CONFIG.customer;
  const stageLabel = (t.crm as any)?.[cfg.labelKey.replace("crm.", "")] ?? stage;
  const pipelineValue = opportunities.reduce((s, o) => s + ((o.estimated_value ?? o.value ?? 0)), 0);

  async function handleAddActivity() {
    if (!actForm.title.trim() || !account) return;
    setAddingAct(true);
    try {
      await onAddActivity({ account_id: account.id, type: actForm.type, title: actForm.title, scheduled_at: actForm.scheduled_at || undefined });
      setActForm({ type: "call", title: "", scheduled_at: "" });
    } finally { setAddingAct(false); }
  }

  async function handleAddContact() {
    if (!contactForm.first_name.trim() || !account) return;
    setAddingContact(true);
    try {
      await onAddContact({ account_id: account.id, ...contactForm });
      setContactForm({ first_name: "", last_name: "", job_title: "", department: "", email: "", phone: "", role_in_decision: "user" });
      setShowContactForm(false);
    } finally { setAddingContact(false); }
  }

  return (
    <div style={{
      background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)", padding: "0",
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, overflow: "hidden",
    }}>
      {/* HEADER */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "12px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {account.name}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
              {[account.industry, account.city, account.country].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: "11px", fontWeight: 700, color: cfg.color }}>
              {stageLabel}
            </span>
            {account.strategic_account && (
              <span style={{ padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", fontSize: "11px", fontWeight: 700, color: "#a78bfa" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "4px" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {(t.crm as any)?.strategic ?? "Estratégica"}
              </span>
            )}
          </div>
        </div>

        {/* LIFECYCLE STEPPER */}
        <div style={{ display: "flex", gap: "3px" }}>
          {(["lead", "opportunity", "customer", "strategic"] as const).map((s) => {
            const c      = LIFECYCLE_CONFIG[s];
            const active = s === stage;
            const lbl    = (t.crm as any)?.[c.labelKey.replace("crm.", "")] ?? s;
            return (
              <button key={s} onClick={() => onUpdateLifecycle(account.id, s)} style={{
                flex: 1, height: "24px", border: "none",
                borderRadius: "var(--radius-sm)",
                background: active ? c.color : "var(--color-border-faint)",
                color: active ? "#fff" : "var(--color-text-muted)",
                fontSize: "10px", fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "var(--transition-fast)",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {lbl}
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              height: "36px", padding: "0 14px", border: "none",
              background: "transparent",
              borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid transparent",
              color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
              fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: "5px",
              transition: "var(--transition-fast)",
            }}
          >
            {tb.label}
            {tb.count !== undefined && tb.count > 0 && (
              <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-brand-blue)20", color: "var(--color-brand-blue)", fontWeight: 700 }}>
                {tb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {detailLoading && (
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t.general.loading}</div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <>
            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[
                { label: (t.crm as any)?.pipeline      ?? "Pipeline",    value: `$${pipelineValue.toLocaleString()}`, color: "var(--color-brand-blue)"   },
                { label: (t.crm as any)?.contactsLabel  ?? "Contactos",   value: String(contacts.length),              color: "var(--color-success-text)" },
                { label: (t.crm as any)?.activitiesLabel ?? "Actividades", value: String(activities.length),            color: "var(--color-info-text)"    },
                { label: (t.crm as any)?.openDeals      ?? "Deals",       value: String(opportunities.length),          color: "var(--color-warning-text)" },
              ].map((m) => (
                <div key={m.label} style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "12px" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "4px" }}>{m.label}</div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Health Score */}
            {insights && (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Health Score
                  </span>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: insights.healthScore >= 70 ? "var(--color-success-text)" : insights.healthScore >= 40 ? "var(--color-warning-text)" : "var(--color-danger-text)" }}>
                    {insights.healthScore}/100
                  </span>
                </div>
                <div style={{ height: "6px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                  <div style={{ width: `${insights.healthScore}%`, height: "100%", background: insights.healthScore >= 70 ? "var(--color-success-text)" : insights.healthScore >= 40 ? "var(--color-warning-text)" : "var(--color-danger-text)", transition: "width 0.5s ease" }} />
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>{insights.executiveSummary}</div>
                <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)10", border: "1px solid var(--color-brand-blue)30" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-brand-blue)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {(t.crm as any)?.nextAction ?? "Siguiente acción"}
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{insights.nextBestAction}</div>
                </div>
              </div>
            )}

            {/* Account info */}
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", padding: "14px", display: "grid", gap: "6px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                {(t.crm as any)?.accountInfo ?? "Información de la cuenta"}
              </div>
              {[
                { label: (t.crm as any)?.legalName ?? "Razón social", value: account.legal_name },
                { label: (t.crm as any)?.industry  ?? "Industria",    value: account.industry   },
                { label: (t.crm as any)?.website   ?? "Sitio web",    value: account.website    },
                { label: (t.crm as any)?.taxId     ?? "RFC/Tax ID",   value: account.tax_id ?? account.client?.rfc },
                { label: (t.crm as any)?.segment   ?? "Segmento",     value: account.segment    },
                { label: (t.crm as any)?.country   ?? "País",         value: [account.city, account.country].filter(Boolean).join(", ") },
              ].map((row) => row.value ? (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{row.label}</span>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{row.value}</span>
                </div>
              ) : null)}
            </div>
          </>
        )}

        {/* ── ACTIVITIES ── */}
        {tab === "activities" && (
          <>
            {/* Add form */}
            <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "8px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                <select value={actForm.type} onChange={(e) => setActForm((p) => ({ ...p, type: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                  {ACTIVITY_TYPES.map((type) => {
                    const cfg = ACTIVITY_TYPE_CONFIG[type];
                    const label = (t.crm as any)?.[cfg?.labelKey?.replace("crm.", "")] ?? type;
                    return <option key={type} value={type}>{label}</option>;
                  })}
                </select>
                <input
                  placeholder={(t.crm as any)?.activityTitle ?? "Título de la actividad…"}
                  value={actForm.title}
                  onChange={(e) => setActForm((p) => ({ ...p, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                  style={INPUT}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="datetime-local" value={actForm.scheduled_at} onChange={(e) => setActForm((p) => ({ ...p, scheduled_at: e.target.value }))} style={{ ...INPUT, flex: 1 }} />
                <button
                  onClick={handleAddActivity}
                  disabled={addingAct || !actForm.title.trim()}
                  style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  {addingAct ? t.general.loading : t.general.save}
                </button>
              </div>
            </div>

            {/* Activity list */}
            {activities.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.crm as any)?.noActivities ?? "Sin actividades registradas"}
              </div>
            ) : activities.map((a) => {
              const cfg   = ACTIVITY_TYPE_CONFIG[a.type] ?? ACTIVITY_TYPE_CONFIG.task;
              const label = (t.crm as any)?.[cfg.labelKey.replace("crm.", "")] ?? a.type;
              return (
                <div key={a.id} style={{
                  display: "flex", gap: "10px", padding: "10px 12px",
                  borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border-faint)",
                  opacity: a.completed ? 0.6 : 1,
                }}>
                  <input type="checkbox" checked={!!a.completed} onChange={() => onCompleteActivity(a.id, !!a.completed)} style={{ cursor: "pointer", flexShrink: 0, marginTop: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: cfg.color + "20", color: cfg.color }}>{label}</span>
                      {a.scheduled_at && (
                        <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                          {new Date(a.scheduled_at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)", textDecoration: a.completed ? "line-through" : "none" }}>
                      {a.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── CONTACTS ── */}
        {tab === "contacts" && (
          <>
            <button onClick={() => setShowContactForm((v) => !v)} style={{
              height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)",
              background: showContactForm ? "var(--color-bg-subtle)" : "var(--color-brand-blue)",
              color: showContactForm ? "var(--color-text-muted)" : "#fff", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer", alignSelf: "start",
            }}>
              {showContactForm ? t.general.cancel : `+ ${(t.crm as any)?.addContact ?? "Agregar contacto"}`}
            </button>

            {showContactForm && (
              <div style={{ background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input placeholder={(t.crm as any)?.firstName ?? "Nombre *"} value={contactForm.first_name} onChange={(e) => setContactForm((p) => ({ ...p, first_name: e.target.value }))} style={INPUT} />
                  <input placeholder={(t.crm as any)?.lastName ?? "Apellido"} value={contactForm.last_name} onChange={(e) => setContactForm((p) => ({ ...p, last_name: e.target.value }))} style={INPUT} />
                  <input placeholder={(t.crm as any)?.jobTitle ?? "Cargo"} value={contactForm.job_title} onChange={(e) => setContactForm((p) => ({ ...p, job_title: e.target.value }))} style={INPUT} />
                  <input placeholder={(t.crm as any)?.department ?? "Departamento"} value={contactForm.department} onChange={(e) => setContactForm((p) => ({ ...p, department: e.target.value }))} style={INPUT} />
                  <input type="email" placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} style={INPUT} />
                  <input placeholder={(t.crm as any)?.phone ?? "Teléfono"} value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))} style={INPUT} />
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select value={contactForm.role_in_decision} onChange={(e) => setContactForm((p) => ({ ...p, role_in_decision: e.target.value }))} style={{ ...INPUT, flex: 1 }}>
                    {DECISION_ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                  </select>
                  <button onClick={handleAddContact} disabled={addingContact || !contactForm.first_name.trim()} style={{
                    height: "34px", padding: "0 14px", borderRadius: "var(--radius-md)",
                    background: "var(--color-brand-blue)", color: "#fff", border: "none",
                    fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}>
                    {addingContact ? t.general.loading : t.general.save}
                  </button>
                </div>
              </div>
            )}

            {contacts.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.crm as any)?.noContacts ?? "Sin contactos registrados"}
              </div>
            ) : contacts.map((c) => {
              const fullName = [c.first_name, c.last_name, c.name].filter(Boolean).join(" ") || "—";
              const initials = fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              return (
                <div key={c.id} style={{
                  display: "flex", gap: "10px", padding: "10px 12px",
                  borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)",
                  border: "1px solid var(--color-border-faint)",
                  alignItems: "center",
                }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: "var(--color-brand-blue)20", border: "1px solid var(--color-brand-blue)30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "var(--color-brand-blue)" }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{fullName}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                      {[c.job_title ?? c.position, c.department].filter(Boolean).join(" · ")}
                    </div>
                    {(c.email || c.phone) && (
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        {c.email && <a href={`mailto:${c.email}`} style={{ color: "var(--color-brand-blue)", textDecoration: "none" }}>{c.email}</a>}
                        {c.email && c.phone && " · "}
                        {c.phone}
                      </div>
                    )}
                  </div>
                  <button onClick={() => onRemoveContact(c.id)} style={{ width: "26px", height: "26px", borderRadius: "var(--radius-sm)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-danger-text)", flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ── OPPORTUNITIES ── */}
        {tab === "opportunities" && (
          <>
            {opportunities.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.crm as any)?.noOpportunities ?? "Sin oportunidades activas"}
              </div>
            ) : opportunities.map((o) => (
              <div key={o.id} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{o.name}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>
                    ${Number(o.estimated_value ?? o.value ?? 0).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  <span>{o.stage}</span>
                  {o.probability && <span>{o.probability}%</span>}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.crm as any)?.noOrders ?? "Sin embarques / pedidos registrados"}
              </div>
            ) : orders.map((o) => (
              <div key={o.id} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{o.order_number}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{o.status}</div>
                </div>
                {o.total_amount && <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>${Number(o.total_amount).toLocaleString()}</span>}
              </div>
            ))}
          </>
        )}

        {/* ── TIMELINE ── */}
        {tab === "timeline" && (
          <>
            {timeline.length === 0 ? (
              <div style={{ padding: "24px", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>
                {(t.crm as any)?.noTimeline ?? "Sin historial disponible"}
              </div>
            ) : timeline.map((item, i) => {
              const isLast = i === timeline.length - 1;
              const MOD_COLOR: Record<string, string> = {
                crm: "var(--color-brand-blue)", prospects: "var(--color-warning-text)",
                opportunities: "var(--color-success-text)", finanzas: "#a78bfa",
                logistica: "var(--color-info-text)",
              };
              const color = MOD_COLOR[item.module_key ?? "crm"] ?? "var(--color-brand-blue)";
              return (
                <div key={item.id} style={{ display: "flex", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: color + "20", border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
                    </div>
                    {!isLast && <div style={{ width: "1px", flex: 1, minHeight: "12px", background: "var(--color-border-faint)", margin: "4px 0" }} />}
                  </div>
                  <div style={{ flex: 1, paddingTop: "4px", paddingBottom: isLast ? 0 : "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color, padding: "1px 5px", borderRadius: "var(--radius-full)", background: color + "15" }}>
                        {item.module_key ?? "crm"}
                      </span>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                        {new Date(item.date).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.title}</div>
                    {item.description && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{item.description}</div>}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
