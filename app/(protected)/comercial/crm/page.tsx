"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCRMController } from "./services/crm.controller";
import { buildAccountInsights, buildCustomerAlerts } from "./services/crm.intelligence";
import { calculateDirectorAdvice } from "./services/crm.analytics";
import type { CrmAccount, CrmAccountInsights, AiDirectorAdvice, CreateAccountPayload } from "./types/crm.types";
import { DEFAULT_CRM_FILTERS } from "./types/crm.types";

import AccountsSidebar   from "./components/AccountsSidebar";
import AccountWorkspace  from "./components/AccountWorkspace";
import AccountCopilot    from "./components/AccountCopilot";

export default function CRMPage() {
  const { t } = useTranslation();
  const ctrl  = useCRMController();
  const {
    loading, accounts, selected, setSelected,
    documents, activities, contacts, opportunities, quotes, orders, timeline,
    detailLoading,
    createAccount, updateAccount, updateLifecycle,
    addContact, removeContact, addActivity, completeActivity, uploadDocument,
  } = ctrl;

  const [search, setSearch]     = useState("");
  const [showNew, setShowNew]   = useState(false);
  const [newForm, setNewForm]   = useState<CreateAccountPayload>({ name: "", legal_name: "", industry: "", country: "", city: "", notes: "" });
  const [saving, setSaving]     = useState(false);
  const [insights, setInsights] = useState<CrmAccountInsights | null>(null);
  const [director, setDirector] = useState<AiDirectorAdvice | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (!q) return true;
      return (
        a.name?.toLowerCase().includes(q) ||
        a.legal_name?.toLowerCase().includes(q) ||
        a.industry?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q)
      );
    });
  }, [accounts, search]);

  // Insights on selected
  useEffect(() => {
    if (!selected) { setInsights(null); setDirector(null); return; }
    const ins = buildAccountInsights(selected, { contacts, activities, documents, opportunities, quotes, orders, timeline });
    setInsights(ins);
    const dir = calculateDirectorAdvice(selected, opportunities, quotes, orders, contacts.length, activities.length > 0, timeline.length);
    setDirector(dir);
  }, [selected, contacts, activities, documents, opportunities, quotes, orders, timeline]);

  async function handleCreateAccount() {
    if (!newForm.name.trim()) return;
    setSaving(true);
    try {
      await createAccount(newForm);
      setNewForm({ name: "", legal_name: "", industry: "", country: "", city: "", notes: "" });
      setShowNew(false);
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {(t.crm as any)?.loading ?? "Cargando CRM…"}
      </div>
    </div>
  );

  const INPUT: React.CSSProperties = {
    width: "100%", height: "36px", padding: "0 12px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gridTemplateRows: "auto 560px",
        gap: "16px",
        paddingBottom: "32px",
      }}>
        {/* STRIP — KPI cards */}
        {[
          { label: (t.crm as any)?.totalAccounts ?? "Total cuentas",    value: accounts.length,                                                           color: "var(--color-brand-blue)"   },
          { label: (t.crm as any)?.customers     ?? "Clientes activos",  value: accounts.filter((a) => a.is_customer || a.lifecycle_stage === "customer").length, color: "var(--color-success-text)" },
          { label: (t.crm as any)?.strategic     ?? "Cuentas estratég.", value: accounts.filter((a) => a.strategic_account).length,                         color: "#a78bfa"                   },
          { label: (t.crm as any)?.leads         ?? "Leads / Prospectos",value: accounts.filter((a) => a.lifecycle_stage === "lead" || a.lifecycle_stage === "opportunity").length, color: "var(--color-warning-text)" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
            borderRadius: "var(--radius-lg)", padding: "16px", display: "grid", gap: "8px",
          }}>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{card.label}</div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums" }}>{card.value}</div>
          </div>
        ))}

        {/* ROW_M — Sidebar | Workspace | Copilot */}
        <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
          <AccountsSidebar
            search={search}
            setSearch={setSearch}
            accounts={filtered}
            selected={selected}
            setSelected={setSelected}
            onNewAccount={() => setShowNew(true)}
          />
        </div>
        <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
          <AccountWorkspace
            account={selected}
            insights={insights}
            activities={activities}
            contacts={contacts}
            opportunities={opportunities}
            orders={orders}
            timeline={timeline}
            detailLoading={detailLoading}
            onUpdateLifecycle={updateLifecycle}
            onAddActivity={addActivity}
            onCompleteActivity={completeActivity}
            onAddContact={addContact}
            onRemoveContact={removeContact}
          />
        </div>
        <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
          <AccountCopilot account={selected} insights={insights} director={director} />
        </div>
      </div>

      {/* DRAWER — Nueva cuenta */}
      {showNew && (
        <>
          <div onClick={() => setShowNew(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
          <div style={{
            position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px, 95vw)",
            background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-xl)", zIndex: 401,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {(t.crm as any)?.newAccount ?? "Nueva cuenta CRM"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {(t.crm as any)?.newAccountDesc ?? "Conectado automáticamente al cliente global"}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "grid", gap: "12px", alignContent: "start" }}>
              {[
                { key: "name",       label: (t.crm as any)?.accountName  ?? "Nombre comercial *", placeholder: "Empresa S.A."                },
                { key: "legal_name", label: (t.crm as any)?.legalName    ?? "Razón social",       placeholder: "Empresa S.A. de C.V."         },
                { key: "industry",   label: (t.crm as any)?.industry     ?? "Industria",          placeholder: "Manufactura, Servicios…"       },
                { key: "city",       label: (t.crm as any)?.city         ?? "Ciudad",             placeholder: "Guadalajara"                   },
                { key: "country",    label: (t.crm as any)?.country      ?? "País",               placeholder: "México"                        },
                { key: "website",    label: (t.crm as any)?.website      ?? "Sitio web",          placeholder: "www.empresa.com"               },
              ].map((f) => (
                <div key={f.key}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</div>
                  <input
                    value={(newForm as any)[f.key] ?? ""}
                    onChange={(e) => setNewForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={INPUT}
                  />
                </div>
              ))}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {(t.crm as any)?.notes ?? "Notas"}
                </div>
                <textarea
                  rows={3}
                  value={newForm.notes ?? ""}
                  onChange={(e) => setNewForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={(t.crm as any)?.notesPlaceholder ?? "Contexto estratégico…"}
                  style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }}
                />
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
              <button onClick={handleCreateAccount} disabled={saving || !newForm.name.trim()} style={{
                flex: 1, height: "40px", borderRadius: "var(--radius-md)",
                background: "var(--color-brand-blue)", color: "#fff", border: "none",
                fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              }}>
                {saving ? t.general.loading : (t.crm as any)?.newAccount ?? "Crear cuenta"}
              </button>
              <button onClick={() => setShowNew(false)} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
                {t.general.cancel}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
