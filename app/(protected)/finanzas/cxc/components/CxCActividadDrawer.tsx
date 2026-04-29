"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import type { AccountReceivable, ARActivityType, ClientARSummary } from "../types/cxc.types";
import { AR_ACTIVITY_CONFIG } from "../types/cxc.types";

type Props = {
  open:    boolean;
  ar:      AccountReceivable | null;
  clients?: ClientARSummary[];                     // Lista de clientes con AR activos (para selector cuando no hay AR)
  saving:  boolean;
  onClose: () => void;
  onCreate:(payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

const TYPES: ARActivityType[] = ["call", "email", "whatsapp", "visit", "promise", "note", "escalation"];

export default function CxCActividadDrawer({ open, ar, clients = [], saving, onClose, onCreate }: Props) {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [type,           setType]           = useState<ARActivityType>("call");
  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [outcome,        setOutcome]        = useState("");
  const [nextAction,     setNextAction]     = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [error,          setError]          = useState<string | null>(null);

  // Cuando no viene un AR (actividad general): selector de cliente y de factura específica
  const [selectedClientKey, setSelectedClientKey] = useState<string>("");      // formato: rfc o nombre
  const [clientInvoices,    setClientInvoices]    = useState<AccountReceivable[]>([]);
  const [selectedARId,      setSelectedARId]      = useState<string>("");       // factura específica (opcional)

  const TYPE_TEMPLATES: Record<ARActivityType, { titleEs: string; titleEn: string }> = {
    call:       { titleEs: "Llamada de cobranza",        titleEn: "Collection call"          },
    email:      { titleEs: "Email de seguimiento",       titleEn: "Follow-up email"          },
    whatsapp:   { titleEs: "WhatsApp de cobranza",       titleEn: "Collection WhatsApp"      },
    visit:      { titleEs: "Visita al cliente",          titleEn: "Client visit"             },
    promise:    { titleEs: "Promesa de pago",            titleEn: "Payment promise"          },
    note:       { titleEs: "Nota interna",               titleEn: "Internal note"            },
    escalation: { titleEs: "Escalación a dirección",     titleEn: "Escalation to management" },
    payment:    { titleEs: "Pago recibido",              titleEn: "Payment received"         },
  };

  function selectType(t: ARActivityType) {
    setType(t);
    const tmpl = TYPE_TEMPLATES[t];
    setTitle(es ? tmpl.titleEs : tmpl.titleEn);
  }

  // Cuando se elige un cliente del selector → traer sus facturas activas
  useEffect(() => {
    if (!selectedClientKey || !companyId) {
      setClientInvoices([]);
      setSelectedARId("");
      return;
    }
    const c = clients.find(cl => (cl.client_rfc ?? cl.client_name) === selectedClientKey);
    if (!c) return;

    let cancelled = false;
    supabase
      .from("accounts_receivable")
      .select("*")
      .eq("company_id", companyId)
      .eq(c.client_rfc ? "client_rfc" : "client_name", c.client_rfc ?? c.client_name)
      .in("status", ["pending", "partial", "disputed"])
      .order("document_date", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setClientInvoices((data ?? []) as AccountReceivable[]);
      });
    return () => { cancelled = true; };
  }, [selectedClientKey, companyId, clients]);

  async function handleCreate() {
    if (!title.trim()) { setError(es ? "El título es requerido" : "Title is required"); return; }
    if (type === "promise" && !nextActionDate) { setError(es ? "Ingresa la fecha de la promesa de pago" : "Enter the promise date"); return; }
    setError(null);

    // Calcular ar_id y client_id según contexto
    let finalARId:    string | undefined = ar?.id;
    let finalClient:  string | undefined = ar?.client_id;

    if (!ar) {
      if (!selectedClientKey) {
        setError(es ? "Selecciona un cliente para registrar la actividad" : "Select a client to log the activity");
        return;
      }
      const c = clients.find(cl => (cl.client_rfc ?? cl.client_name) === selectedClientKey);
      finalClient = c?.client_id ?? undefined;
      finalARId   = selectedARId || undefined;   // factura específica si se eligió, si no, queda como actividad de cliente
    }

    try {
      await onCreate({
        ar_id:            finalARId,
        client_id:        finalClient,
        type,
        title:            title.trim(),
        description:      description.trim() || undefined,
        outcome:          outcome.trim() || undefined,
        next_action:      nextAction.trim() || undefined,
        next_action_date: nextActionDate || undefined,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
  }

  function handleClose() {
    setType("call"); setTitle(""); setDescription(""); setOutcome("");
    setNextAction(""); setNextActionDate(""); setError(null);
    setSelectedClientKey(""); setClientInvoices([]); setSelectedARId("");
    onClose();
  }

  if (!open) return null;

  const acCfg = AR_ACTIVITY_CONFIG[type];
  const showClientSelector = !ar;   // Si NO viene un AR específico, mostrar selectores

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(520px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Registrar actividad" : "Log activity"}
              </div>
              {ar && (
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {ar.client_name} · {ar.document_number}
                </div>
              )}
              {!ar && selectedClientKey && (
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                  {clients.find(c => (c.client_rfc ?? c.client_name) === selectedClientKey)?.client_name ?? ""}
                  {selectedARId && clientInvoices.find(inv => inv.id === selectedARId)?.document_number
                    ? ` · ${clientInvoices.find(inv => inv.id === selectedARId)?.document_number}`
                    : ""}
                </div>
              )}
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
          )}

          {/* Selector de cliente (solo cuando no viene un AR) */}
          {showClientSelector && (
            <>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {es ? "Cliente *" : "Client *"}
                </div>
                <select
                  value={selectedClientKey}
                  onChange={e => setSelectedClientKey(e.target.value)}
                  style={{ ...INPUT, cursor: "pointer" }}>
                  <option value="">— {es ? "Seleccionar cliente" : "Select client"} —</option>
                  {clients.map((c, i) => {
                    const key = c.client_rfc ?? c.client_name;
                    return (
                      <option key={`${key}-${i}`} value={key}>
                        {c.client_name}{c.client_rfc ? ` · ${c.client_rfc}` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Factura específica (opcional) */}
              {selectedClientKey && clientInvoices.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {es ? "Factura específica (opcional)" : "Specific invoice (optional)"}
                  </div>
                  <select
                    value={selectedARId}
                    onChange={e => setSelectedARId(e.target.value)}
                    style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="">— {es ? "Actividad general del cliente" : "General client activity"} —</option>
                    {clientInvoices.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.document_number ?? "—"} · {inv.currency} ${Number(inv.balance).toLocaleString("es-MX", { minimumFractionDigits: 2 })} · {new Date(inv.document_date).toLocaleDateString(es ? "es-MX" : "en-US")}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    {es
                      ? "Si la actividad es sobre todas las facturas del cliente, déjalo en blanco."
                      : "Leave blank if the activity covers all invoices of this client."}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tipo de actividad */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Tipo de actividad" : "Activity type"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {TYPES.map(t => {
                const cfg = AR_ACTIVITY_CONFIG[t];
                const active = type === t;
                return (
                  <button key={t} onClick={() => selectType(t)}
                    style={{ padding: "10px 6px", borderRadius: "var(--radius-md)", border: `2px solid ${active ? cfg.color : "var(--color-border-faint)"}`, background: active ? `${cfg.color}18` : "var(--color-bg-subtle)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", transition: "all 0.1s" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? cfg.color : "var(--color-text-muted)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={cfg.icon} />
                    </svg>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: active ? cfg.color : "var(--color-text-muted)", textAlign: "center", lineHeight: 1.2 }}>
                      {es ? cfg.labelEs.split(" ")[0] : cfg.labelEn.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Título *" : "Title *"}
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={es ? "Describe la actividad brevemente" : "Briefly describe the activity"} style={INPUT} />
          </div>

          {/* Descripción */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Descripción" : "Description"}
            </div>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={es ? "Detalles de la gestión realizada…" : "Details of the collection action taken…"} style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }} />
          </div>

          {/* Resultado */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {es ? "Resultado" : "Outcome"}
            </div>
            <input value={outcome} onChange={e => setOutcome(e.target.value)} placeholder={es ? "¿Qué respondió el cliente?" : "What was the client's response?"} style={INPUT} />
          </div>

          {/* Próxima acción */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? `Próxima acción${type === "promise" ? " *" : ""}` : `Next action${type === "promise" ? " *" : ""}`}
              </div>
              <input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder={es ? "Descripción de la próxima acción" : "Next action description"} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {es ? `Fecha${type === "promise" ? " *" : ""}` : `Date${type === "promise" ? " *" : ""}`}
              </div>
              <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} style={INPUT} />
            </div>
          </div>

          {/* Info promesa */}
          {type === "promise" && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)" }}>
              {es
                ? "Al registrar una promesa de pago, la cuenta cambiará automáticamente a estado 'Promesa de pago' y se recordará para seguimiento."
                : "Registering a payment promise will automatically change the account to 'Payment promise' status and will be flagged for follow-up."}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleCreate} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: acCfg.color, color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? `Registrar ${acCfg.labelEs.toLowerCase()}` : `Log ${acCfg.labelEn.toLowerCase()}`)}
          </button>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
