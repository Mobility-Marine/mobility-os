"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { BUSINESS_NOTE_TYPES } from "../types/facturacion.types";
import type { BusinessNote } from "../types/facturacion.types";

type Props = {
  notes:   BusinessNote[];
  saving:  boolean;
  loading: boolean;
  onCreate:(payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function NotasDrawer({ notes, saving, loading, onCreate }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [showForm,     setShowForm]     = useState(false);
  const [clients,      setClients]      = useState<any[]>([]);
  const [form, setForm] = useState({
    type: "remision", date: new Date().toISOString().split("T")[0],
    client_id: "", receiver_name: "", receiver_rfc: "",
    receiver_email: "", currency: "MXN", notes: "",
  });
  const [concepts, setConcepts] = useState<any[]>([]);
  const [conceptForm, setConceptForm] = useState({ description: "", quantity: 1, unit_price: 0, unit: "pza" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("business_partners")
      .select("id, name, legal_name, rfc, email")
      .eq("company_id", companyId)
      .eq("is_customer", true)
      .eq("is_active", true)
      .order("name")
      .limit(200)
      .then(({ data }) => setClients(data ?? []));
  }, [companyId]);

  function selectClient(clientId: string) {
    const c = clients.find((cl) => cl.id === clientId);
    if (!c) return;
    setForm((p) => ({ ...p, client_id: c.id, receiver_name: c.legal_name ?? c.name, receiver_rfc: c.rfc ?? "", receiver_email: c.email ?? "" }));
  }

  function addConcept() {
    if (!conceptForm.description) return;
    setConcepts((p) => [...p, { ...conceptForm, total: conceptForm.quantity * conceptForm.unit_price }]);
    setConceptForm({ description: "", quantity: 1, unit_price: 0, unit: "pza" });
  }

  const total = concepts.reduce((s, c) => s + c.total, 0);

  async function handleCreate() {
    if (!form.receiver_name) { setError(es ? "Nombre del receptor requerido" : "Receiver name required"); return; }
    if (concepts.length === 0) { setError(es ? "Agrega al menos un concepto" : "Add at least one concept"); return; }
    setError(null);
    try {
      await onCreate({ ...form, concepts });
      setShowForm(false);
      setConcepts([]);
      setForm({ type: "remision", date: new Date().toISOString().split("T")[0], client_id: "", receiver_name: "", receiver_rfc: "", receiver_email: "", currency: "MXN", notes: "" });
    } catch (e: any) { setError(e.message); }
  }

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    draft: { color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)"  },
    sent:  { color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)"    },
    voided:{ color: "var(--color-danger-text)",  bg: "var(--color-danger-bg)"  },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {es ? "Notas y documentos sin valor fiscal" : "Non-fiscal notes and documents"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>
            {es ? "Remisiones, recibos de honorarios, presupuestos informales y otros." : "Delivery notes, honorarium receipts, informal estimates and others."}
          </div>
        </div>
        <button onClick={() => setShowForm((p) => !p)}
          style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nueva nota" : "New note"}
        </button>
      </div>

      {/* Tipos disponibles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
        {BUSINESS_NOTE_TYPES.map((t) => (
          <div key={t.key} onClick={() => { setForm((p) => ({ ...p, type: t.key })); setShowForm(true); }}
            style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand-blue)"; e.currentTarget.style.background = "var(--color-info-bg)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-faint)"; e.currentTarget.style.background = "var(--color-bg-base)"; }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "3px" }}>{es ? t.labelEs : t.labelEn}</div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", lineHeight: 1.4 }}>{es ? t.descEs : t.descEn}</div>
          </div>
        ))}
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-brand-blue)", borderRadius: "var(--radius-lg)", padding: "20px", display: "grid", gap: "14px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {BUSINESS_NOTE_TYPES.find((t) => t.key === form.type)?.[es ? "labelEs" : "labelEn"] ?? "Nota"}
          </div>

          {error && <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Tipo de documento" : "Document type"}</div>
              <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                {BUSINESS_NOTE_TYPES.map((t) => <option key={t.key} value={t.key}>{es ? t.labelEs : t.labelEn}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Fecha" : "Date"}</div>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} style={INPUT} />
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Cliente (opcional)" : "Client (optional)"}</div>
            <select value={form.client_id} onChange={(e) => selectClient(e.target.value)} style={{ ...INPUT, cursor: "pointer", marginBottom: "6px" }}>
              <option value="">{es ? "— Sin cliente registrado —" : "— No registered client —"}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.legal_name ?? c.name}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <input value={form.receiver_name} onChange={(e) => setForm((p) => ({ ...p, receiver_name: e.target.value }))} placeholder={es ? "Nombre / Razón social" : "Name / Legal name"} style={{ ...INPUT, fontSize: "11px" }} />
              <input value={form.receiver_rfc} onChange={(e) => setForm((p) => ({ ...p, receiver_rfc: e.target.value.toUpperCase() }))} placeholder="RFC" maxLength={13} style={{ ...INPUT, fontSize: "11px", fontFamily: "monospace" }} />
              <input type="email" value={form.receiver_email} onChange={(e) => setForm((p) => ({ ...p, receiver_email: e.target.value }))} placeholder="Email" style={{ ...INPUT, fontSize: "11px" }} />
            </div>
          </div>

          {/* Conceptos */}
          <div style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", padding: "12px", display: "grid", gap: "8px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Conceptos" : "Concepts"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 80px 100px 60px auto", gap: "6px", alignItems: "center" }}>
              <input value={conceptForm.description} onChange={(e) => setConceptForm((p) => ({ ...p, description: e.target.value }))} placeholder={es ? "Descripción" : "Description"} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
              <input type="number" min="1" value={conceptForm.quantity} onChange={(e) => setConceptForm((p) => ({ ...p, quantity: Number(e.target.value) }))} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
              <input type="number" min="0" value={conceptForm.unit_price} onChange={(e) => setConceptForm((p) => ({ ...p, unit_price: Number(e.target.value) }))} placeholder="0.00" style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
              <input value={conceptForm.unit} onChange={(e) => setConceptForm((p) => ({ ...p, unit: e.target.value }))} placeholder={es ? "Unid." : "Unit"} style={{ ...INPUT, height: "30px", fontSize: "11px" }} />
              <button onClick={addConcept} style={{ height: "30px", padding: "0 10px", borderRadius: "var(--radius-sm)", background: "var(--color-brand-blue)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>+</button>
            </div>
            {concepts.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", padding: "4px 8px", background: "var(--color-bg-base)", borderRadius: "var(--radius-sm)" }}>
                <span style={{ flex: 1, color: "var(--color-text-second)" }}>{c.description}</span>
                <span style={{ color: "var(--color-text-muted)" }}>{c.quantity} {c.unit}</span>
                <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>${fmt(c.total)}</span>
                <button onClick={() => setConcepts((p) => p.filter((_, idx) => idx !== i))} style={{ width: "16px", height: "16px", borderRadius: "2px", background: "var(--color-danger-bg)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            {concepts.length > 0 && (
              <div style={{ textAlign: "right", fontSize: "13px", fontWeight: 800, color: "var(--color-text-primary)" }}>Total: ${fmt(total)}</div>
            )}
          </div>

          <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder={es ? "Observaciones adicionales…" : "Additional notes…"} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />

          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleCreate} disabled={saving}
              style={{ flex: 1, height: "38px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              {saving ? (es ? "Guardando…" : "Saving…") : (es ? "Crear documento" : "Create document")}
            </button>
            <button onClick={() => setShowForm(false)} style={{ height: "38px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
              {es ? "Cancelar" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de notas */}
      {loading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "13px" }}>{es ? "Cargando…" : "Loading…"}</div>
      ) : notes.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Sin documentos creados" : "No documents created"}</div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>{es ? "Crea una remisión, presupuesto o recibo sin valor fiscal." : "Create a delivery note, estimate or non-fiscal receipt."}</div>
        </div>
      ) : (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          {notes.map((note, i) => {
            const sc    = STATUS_COLORS[note.status] ?? STATUS_COLORS.draft;
            const tConf = BUSINESS_NOTE_TYPES.find((t) => t.key === note.type);
            return (
              <div key={note.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 140px 110px 80px", padding: "11px 16px", borderBottom: i < notes.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", fontFamily: "monospace" }}>{note.note_number ?? "—"}</div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{note.receiver_name}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{tConf ? (es ? tConf.labelEs : tConf.labelEn) : note.type}</div>
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{new Date(note.date).toLocaleDateString(es ? "es-MX" : "en-US")}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{note.currency} ${fmt(note.total)}</div>
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color, textAlign: "center" }}>
                  {note.status === "draft" ? (es ? "Borrador" : "Draft") : note.status === "sent" ? (es ? "Enviada" : "Sent") : (es ? "Anulada" : "Voided")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
