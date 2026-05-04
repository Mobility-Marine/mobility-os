"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchClientFinancialAlert } from "../../../services/quotations.service";
import { Field, SectionTitle, INPUT, SELECT } from "../drawerShared";
import type { ClientState } from "../drawerState";

type Props = {
  state:    ClientState;
  onChange: (updates: Partial<ClientState>) => void;
};

export default function StepClient({ state, onChange }: Props) {
  const { companyId }   = useTenant();
  const [clients,      setClients]      = useState<any[]>([]);
  const [contacts,     setContacts]     = useState<any[]>([]);
  const [financialAlert, setFinancialAlert] = useState<any | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState(state.selectedClient?.name ?? "");

  // Buscar clientes
  useEffect(() => {
    if (!search.trim() || !companyId || state.useManual) { setClients([]); return; }
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("business_partners")
        .select("id, name, email, rfc, is_active")
        .eq("company_id", companyId)
        .eq("is_customer", true)
        .or(`name.ilike.%${search}%,rfc.ilike.%${search}%`)
        .limit(6);
      setClients(data ?? []);
    }, 300);
  }, [search, companyId, state.useManual]);

  // Cargar contactos del cliente seleccionado
  useEffect(() => {
    if (!state.selectedClient?.id || !companyId) { setContacts([]); return; }
    supabase
      .from("client_contacts")
      .select("id, name, title, email, phone, is_primary")
      .eq("client_id", state.selectedClient.id)
      .order("is_primary", { ascending: false })
      .then(({ data }) => setContacts(data ?? []));
  }, [state.selectedClient?.id, companyId]);

  async function handleSelectClient(client: any) {
    onChange({ selectedClient: client, contactId: "", contactName: "", contactEmail: "", contactTitle: "" });
    setSearch(client.name);
    setClients([]);
    if (companyId) {
      const alert = await fetchClientFinancialAlert(companyId, client.id);
      setFinancialAlert(alert);
    }
  }

  function handleSelectContact(contactId: string) {
    if (!contactId) { onChange({ contactId: "", contactName: "", contactEmail: "", contactTitle: "" }); return; }
    const c = contacts.find((x) => x.id === contactId);
    if (c) onChange({ contactId: c.id, contactName: c.name, contactEmail: c.email ?? "", contactTitle: c.title ?? "" });
  }

  return (
    <>
      <SectionTitle>Información del cliente</SectionTitle>
      <div style={{ display: "flex", gap: "6px" }}>
        {["system", "manual"].map((mode) => (
          <button key={mode} onClick={() => onChange({ useManual: mode === "manual" })} style={{ flex: 1, height: "32px", borderRadius: "var(--radius-md)", background: (mode === "manual") === state.useManual ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", border: "none", color: (mode === "manual") === state.useManual ? "#fff" : "var(--color-text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
            {mode === "system" ? "Buscar en sistema" : "Captura manual"}
          </button>
        ))}
      </div>

      {!state.useManual ? (
        <div style={{ position: "relative" }}>
          <Field label="Buscar cliente" required>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); onChange({ selectedClient: null }); }}
              placeholder="Nombre de la empresa…"
              style={INPUT}
            />
          </Field>
          {clients.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
              {clients.map((c) => (
                <div key={c.id} onClick={() => handleSelectClient(c)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{c.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.email}</div>
                  </div>
                  {c.rfc && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", alignSelf: "center" }}>{c.rfc}</div>}
                </div>
              ))}
            </div>
          )}
          {state.selectedClient && (
            <div style={{ marginTop: "8px", padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-success-text)" }}>✓ {state.selectedClient.name}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {[state.selectedClient.email, state.selectedClient.rfc].filter(Boolean).join(" · ")}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <Field label="Nombre" required>
            <input value={state.manualClient.name} onChange={(e) => onChange({ manualClient: { ...state.manualClient, name: e.target.value } })} placeholder="Empresa S.A. de C.V." style={INPUT} />
          </Field>
          <Field label="RFC">
            <input value={state.manualClient.rfc} onChange={(e) => onChange({ manualClient: { ...state.manualClient, rfc: e.target.value.toUpperCase() } })} placeholder="EMP123456ABC" style={INPUT} />
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Email">
              <input type="email" value={state.manualClient.email} onChange={(e) => onChange({ manualClient: { ...state.manualClient, email: e.target.value } })} placeholder="contacto@empresa.com" style={INPUT} />
            </Field>
          </div>
        </div>
      )}

      {/* Contacto específico */}
      {(state.selectedClient || state.useManual) && contacts.length > 0 && (
        <Field label="Contacto de la cotización" hint="Se imprimirá en el PDF como 'Atención a:'">
          <select
            value={state.contactId}
            onChange={(e) => handleSelectContact(e.target.value)}
            style={SELECT}
          >
            <option value="">— Sin contacto específico —</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.title ? ` — ${c.title}` : ""}{c.is_primary ? " ★" : ""}
              </option>
            ))}
          </select>
        </Field>
      )}

      {/* Alertas financieras */}
      {financialAlert?.hasOverdue && (
        <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-danger-text)", marginBottom: "4px" }}>⚠ Alerta financiera</div>
          <div style={{ fontSize: "12px", color: "var(--color-danger-text)" }}>
            Este cliente tiene <strong>${financialAlert.overdueAmount.toLocaleString()} MXN</strong> vencidos ({financialAlert.maxDays} días de atraso).
          </div>
        </div>
      )}
      {financialAlert && !financialAlert.hasOverdue && state.selectedClient && (
        <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", color: "var(--color-success-text)" }}>
          ✓ Cliente al corriente — sin adeudos
        </div>
      )}
    </>
  );
}
