"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useFacturacionController } from "./services/facturacion.controller";
import FacturacionStats  from "./components/FacturacionStats";
import FacturacionList   from "./components/FacturacionList";
import CFDICreateDrawer  from "./components/CFDICreateDrawer";
import CFDICancelModal   from "./components/CFDICancelModal";
import type { CFDIDocument } from "./types/facturacion.types";

export default function FacturacionPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,        setUserId]        = useState("");
  const [createOpen,    setCreateOpen]    = useState(false);
  const [cancelTarget,  setCancelTarget]  = useState<CFDIDocument | null>(null);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [emailInput,    setEmailInput]    = useState("");
  const [emailTarget,   setEmailTarget]   = useState<CFDIDocument | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useFacturacionController(companyId ?? "", userId);

  useEffect(() => {
    if (!companyId) return;
    ctrl.load();
  }, [companyId]);

  function handleSelectCFDI(cfdi: CFDIDocument) {
    ctrl.handleSelect(cfdi);
  }

  async function handleSendEmail() {
    if (!emailTarget) return;
    try {
      await ctrl.handleSendEmail(emailTarget, emailInput);
      setSendEmailOpen(false); setEmailInput(""); setEmailTarget(null);
    } catch {}
  }

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            {es ? "Facturación" : "Billing"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {es ? "CFDI 4.0 — Emisión, cancelación y seguimiento de facturas electrónicas." : "CFDI 4.0 — Issuance, cancellation and tracking of electronic invoices."}
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          style={{ height: "38px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {es ? "Nueva Factura" : "New Invoice"}
        </button>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* KPIs */}
      <FacturacionStats stats={ctrl.stats} />

      {/* LISTA */}
      <FacturacionList
        cfdis={ctrl.cfdis}
        loading={ctrl.loading}
        filters={ctrl.filters}
        onFilter={ctrl.handleFilter}
        onSelect={handleSelectCFDI}
        onXML={ctrl.handleDownloadXML}
        onPDF={ctrl.handleDownloadPDF}
      />

      {/* Panel de detalle */}
      {ctrl.selected && (
        <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "380px", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Detalle CFDI" : "CFDI Detail"}
            </div>
            <button onClick={() => ctrl.setSelected(null)} style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* UUID */}
            {ctrl.selected.cfdi.uuid && (
              <div style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>UUID SAT</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-primary)", fontFamily: "monospace", wordBreak: "break-all" }}>{ctrl.selected.cfdi.uuid}</div>
              </div>
            )}

            {/* Info */}
            {[
              { l: es ? "Folio" : "Folio",       v: `${ctrl.selected.cfdi.serie ?? ""}${ctrl.selected.cfdi.folio ?? "—"}` },
              { l: es ? "Fecha" : "Date",         v: new Date(ctrl.selected.cfdi.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US") },
              { l: es ? "Receptor" : "Receiver",  v: ctrl.selected.cfdi.receiver_name },
              { l: "RFC",                          v: ctrl.selected.cfdi.receiver_rfc },
              { l: es ? "Total" : "Total",         v: `${ctrl.selected.cfdi.currency} $${Number(ctrl.selected.cfdi.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` },
              { l: es ? "Método" : "Method",       v: ctrl.selected.cfdi.payment_method },
              { l: es ? "Forma" : "Form",          v: ctrl.selected.cfdi.payment_form },
            ].map((r) => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "6px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
              </div>
            ))}

            {/* Conceptos */}
            {ctrl.selected.concepts.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{es ? "Conceptos" : "Concepts"}</div>
                {ctrl.selected.concepts.map((c, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-border-faint)" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{c.description}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{c.quantity} × ${Number(c.unit_price).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>${Number(c.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones */}
          {ctrl.selected.cfdi.status === "valid" && (
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => ctrl.handleDownloadXML(ctrl.selected!.cfdi)} style={{ flex: 1, height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>XML</button>
                <button onClick={() => ctrl.handleDownloadPDF(ctrl.selected!.cfdi)} style={{ flex: 1, height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>PDF</button>
                <button onClick={() => { setEmailTarget(ctrl.selected!.cfdi); setEmailInput(ctrl.selected!.cfdi.receiver_email ?? ""); setSendEmailOpen(true); }} style={{ flex: 1, height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Email</button>
              </div>
              <button onClick={() => setCancelTarget(ctrl.selected!.cfdi)}
                style={{ height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                {es ? "Solicitar cancelación SAT" : "Request SAT cancellation"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Send email mini modal */}
      {sendEmailOpen && emailTarget && (
        <>
          <div onClick={() => setSendEmailOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 600 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "360px", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", padding: "24px", zIndex: 601, display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Enviar por email" : "Send by email"}</div>
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="correo@cliente.com" style={{ width: "100%", height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-primary)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleSendEmail} disabled={ctrl.saving} style={{ flex: 1, height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {ctrl.saving ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar XML + PDF" : "Send XML + PDF")}
              </button>
              <button onClick={() => setSendEmailOpen(false)} style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                {es ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Drawer crear CFDI */}
      <CFDICreateDrawer
        open={createOpen}
        saving={ctrl.saving}
        onClose={() => setCreateOpen(false)}
        onCreate={ctrl.handleEmitir}
      />

      {/* Modal cancelar CFDI */}
      {cancelTarget && (
        <CFDICancelModal
          cfdi={cancelTarget}
          saving={ctrl.saving}
          onCancel={(motive, substitution) => ctrl.handleCancelar(cancelTarget.id, cancelTarget.facturapi_id!, motive, substitution)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
