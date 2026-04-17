"use client";

import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useCRMController } from "./services/crm.controller";
import { buildAccountInsights } from "./services/crm.intelligence";
import { calculateDirectorAdvice } from "./services/crm.analytics";
import type { CrmAccountInsights, AiDirectorAdvice } from "./types/crm.types";

import AccountsSidebar  from "./components/AccountsSidebar";
import AccountWorkspace from "./components/AccountWorkspace";
import AccountCopilot   from "./components/AccountCopilot";
import Customer360Panel from "./components/Customer360Panel";

export default function CRMPage() {
  const { t }  = useTranslation();
  const ctrl   = useCRMController();
  const {
    loading, accounts, selected, setSelected,
    documents, activities, contacts, opportunities, quotes, orders, timeline,
    detailLoading,
    updateLifecycle,
    addContact, removeContact,
    addActivity, completeActivity,
  } = ctrl;

  const [search,   setSearch]   = useState("");
  const [insights, setInsights] = useState<CrmAccountInsights | null>(null);
  const [director, setDirector] = useState<AiDirectorAdvice | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) =>
      !q ||
      a.name?.toLowerCase().includes(q) ||
      a.legal_name?.toLowerCase().includes(q) ||
      a.industry?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  useEffect(() => {
    if (!selected) { setInsights(null); setDirector(null); return; }
    setInsights(buildAccountInsights(selected, { contacts, activities, documents, opportunities, quotes, orders, timeline }));
    setDirector(calculateDirectorAdvice(selected, opportunities, quotes, orders, contacts.length, activities.length > 0, timeline.length));
  }, [selected, contacts, activities, documents, opportunities, quotes, orders, timeline]);

  // ── STRIP METRICS ─────────────────────────────────────────
  const totalPipeline   = opportunities.reduce((s, o) => s + (o.estimated_value ?? o.value ?? 0), 0);
  const customersCount  = accounts.filter((a) => a.is_customer || a.lifecycle_stage === "customer").length;
  const strategicCount  = accounts.filter((a) => a.strategic_account).length;
  const leadsCount      = accounts.filter((a) => a.lifecycle_stage === "lead" || a.lifecycle_stage === "opportunity").length;

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {(t.crm as any)?.loading ?? "Cargando CRM…"}
      </div>
    </div>
  );

  const STRIP_CARDS = [
    {
      label:    (t.crm as any)?.totalAccounts   ?? "Total cuentas",
      value:    accounts.length,
      sub:      `${customersCount} clientes · ${leadsCount} leads`,
      color:    "var(--color-brand-blue)",
      format:   "number",
    },
    {
      label:    (t.crm as any)?.activePipeline  ?? "Pipeline activo",
      value:    totalPipeline,
      sub:      `${opportunities.length} oportunidades`,
      color:    "var(--color-success-text)",
      format:   "currency",
    },
    {
      label:    (t.crm as any)?.strategic       ?? "Cuentas estratégicas",
      value:    strategicCount,
      sub:      (t.crm as any)?.strategicDesc   ?? "Atención ejecutiva prioritaria",
      color:    "#a78bfa",
      format:   "number",
    },
    {
      label:    (t.crm as any)?.leads           ?? "Leads / Prospectos",
      value:    leadsCount,
      sub:      (t.crm as any)?.leadsDesc       ?? "En proceso de calificación",
      color:    "var(--color-warning-text)",
      format:   "number",
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "auto 560px auto",
      gap: "16px",
      paddingBottom: "32px",
    }}>

      {/* STRIP */}
      {STRIP_CARDS.map((card) => (
        <div key={card.label} style={{
          background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)", padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {card.label}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: card.color, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
            {card.format === "currency"
              ? `$${Number(card.value).toLocaleString("es-MX", { maximumFractionDigits: 0 })}`
              : card.value
            }
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            {card.sub}
          </div>
          {/* Mini progress bar */}
          {card.format === "number" && accounts.length > 0 && (
            <div style={{ height: "3px", background: "var(--color-border-faint)", borderRadius: "var(--radius-full)", overflow: "hidden", marginTop: "4px" }}>
              <div style={{
                height: "100%", borderRadius: "var(--radius-full)",
                background: card.color,
                width: `${Math.min((Number(card.value) / accounts.length) * 100, 100)}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
          )}
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
        <AccountCopilot
          account={selected}
          insights={insights}
          director={director}
        />
      </div>
      {/* ROW CUSTOMER 360 */}
      <div style={{ gridColumn: "1 / -1", minHeight: "320px" }}>
        <Customer360Panel account={selected} />
      </div>
    </div>
  );
}
