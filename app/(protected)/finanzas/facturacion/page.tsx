"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useFacturacionController } from "./services/facturacion.controller";
import { fetchBusinessNotes, createBusinessNote, emitirComplementoPago, emitirNotaCredito } from "./services/facturacion.service";
import type { CFDITypeOption } from "./types/facturacion.types";
import type { CFDIDocument } from "./types/facturacion.types";

import FacturacionDashboard    from "./components/FacturacionDashboard";
import CFDISelector            from "./components/CFDISelector";
import FacturacionList         from "./components/FacturacionList";
import FacturacionStats        from "./components/FacturacionStats";
import FacturacionCalendario   from "./components/FacturacionCalendario";
import NotasDrawer             from "./components/NotasDrawer";
import CFDICreateDrawer        from "./components/CFDICreateDrawer";
import CFDIComplementoPago     from "./components/CFDIComplementoPago";
import CFDINotaCredito         from "./components/CFDINotaCredito";
import CFDICancelModal         from "./components/CFDICancelModal";
import CFDINominaDrawer        from "./components/CFDINominaDrawer";

type Tab = "dashboard" | "emitir" | "historial" | "notas" | "calendario";

export default function FacturacionPage() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [userId,       setUserId]       = useState("");
  const [tab,          setTab]          = useState<Tab>("dashboard");
  const [notes,        setNotes]        = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote,   setSavingNote]   = useState(false);

  // Estado de drawers
  const [selectedCFDIType,   setSelectedCFDIType]   = useState<CFDITypeOption | null>(null);
  const [cancelTarget,       setCancelTarget]        = useState<CFDIDocument | null>(null);
  const [emailTarget,        setEmailTarget]         = useState<CFDIDocument | null>(null);
  const [emailInput,         setEmailInput]          = useState("");
  const [compREPOpen,        setCompREPOpen]         = useState(false);
  const [notaCreditoOpen,    setNotaCreditoOpen]     = useState(false);
  const [savingExtra,        setSavingExtra]         = useState(false);
  const [pendingShipments,   setPendingShipments]    = useState<any[]>([]);
  const [preloadShipment,    setPreloadShipment]     = useState<any | null>(null);
  const [nominaDrawerOpen,   setNominaDrawerOpen]    = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useFacturacionController(companyId ?? "", userId);

  useEffect(() => {
    if (!companyId) return;
    ctrl.load();
    // Cargar embarques completados sin factura
    supabase
      .from("shipments")
      .select("id, reference, service_type, currency, total, client:clients(name), quotation:quotations(quote_number)")
      .eq("company_id", companyId)
      .eq("status", "delivered")
      .is("invoice_id", null)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setPendingShipments(data ?? []));
  }, [companyId]);

  const loadNotes = useCallback(async () => {
    if (!companyId) return;
    setLoadingNotes(true);
    try { setNotes(await fetchBusinessNotes(companyId)); }
    catch {} finally { setLoadingNotes(false); }
  }, [companyId]);

  useEffect(() => { if (tab === "notas") loadNotes(); }, [tab]);

  // Cuando selecciona un tipo de CFDI en el selector
  function handleSelectCFDIType(opt: CFDITypeOption) {
    if (opt.id === "complemento_pago") { setCompREPOpen(true); return; }
    if (opt.id === "nota_credito")     { setNotaCreditoOpen(true); return; }
    if (opt.id === "nomina")           { setNominaDrawerOpen(true); return; }
    setSelectedCFDIType(opt);
  }

async function handleFacturarEmbarque(shipment: any) {
    if (!companyId) return;
    const { data: sh } = await supabase
      .from("shipments")
      .select(`
        *, 
        client:clients(name, legal_name, rfc, email, tax_regime, zip_code),
        services:shipment_services(description, price, currency)
      `)
      .eq("id", shipment.id)
      .single();
    if (!sh) return;

    // Si no hay líneas en shipment_services, buscar en quotation_services
    let services = (sh.services ?? []) as any[];
    if (services.length === 0 && sh.quotation_id) {
      const { data: qsvcs } = await supabase
        .from("quotation_services")
        .select("description, price, currency, product_id, product:products(name, sat_product_code, sat_unit_code, unit)")
        .eq("quotation_id", sh.quotation_id)
        .order("sort_order");
      // Si la línea tiene producto vinculado, usar el nombre y claves del producto
      services = (qsvcs ?? []).map((s: any) => ({
        description:      s.product?.name            ?? s.description,
        price:            s.price,
        currency:         s.currency,
        product_id:       s.product_id               ?? null,
        sat_product_code: s.product?.sat_product_code ?? "84111506",
        sat_unit_code:    s.product?.sat_unit_code    ?? "E48",
        unit:             s.product?.unit             ?? "Servicio",
      }));
    }

    // Si aún no hay servicios, crear una línea con el total del embarque
    if (services.length === 0) {
      services = [{
        description: `Servicio logístico — ${sh.reference}`,
        price:       sh.total ?? 0,
        currency:    sh.currency ?? "MXN",
      }];
    }

    setPreloadShipment({
      shipment_id:     sh.id,
      reference:       sh.reference,
      client_id:       sh.client_id,
      receiver_rfc:    (sh.client as any)?.rfc           ?? "",
      receiver_name:   (sh.client as any)?.legal_name    ?? (sh.client as any)?.name ?? "",
      receiver_email:  (sh.client as any)?.email         ?? "",
      receiver_zip:    (sh.client as any)?.zip_code      ?? "",
      receiver_regime: (sh.client as any)?.tax_regime    ?? "601",
      currency:        sh.currency ?? "MXN",
      total:           sh.total,
      services:        services.map((s: any) => ({
        description:      s.description,
        price:            s.price,
        currency:         s.currency         ?? sh.currency ?? "MXN",
        product_id:       s.product_id       ?? null,
        sat_product_code: s.sat_product_code ?? "84111506",
        sat_unit_code:    s.sat_unit_code    ?? "E48",
        unit:             s.unit             ?? "Servicio",
      })),
    });
    setSelectedCFDIType({ id: "factura" } as any);
  }
  
  async function handleSendEmail() {
    if (!emailTarget) return;
    try { await ctrl.handleSendEmail(emailTarget, emailInput); setEmailTarget(null); setEmailInput(""); }
    catch {}
  }

  async function handleCreateNote(payload: any) {
    if (!companyId) return;
    setSavingNote(true);
    try { await createBusinessNote(companyId, userId, payload); await loadNotes(); }
    catch (e: any) { ctrl.load(); }
    finally { setSavingNote(false); }
  }

  async function handleEmitirComplemento(payload: any) {
    setSavingExtra(true);
    try { await emitirComplementoPago(companyId ?? "", userId, payload); await ctrl.load(); setCompREPOpen(false); }
    catch (e: any) {}
    finally { setSavingExtra(false); }
  }

  async function handleEmitirNotaCredito(payload: any) {
    setSavingExtra(true);
    try { await emitirNotaCredito(companyId ?? "", userId, payload); await ctrl.load(); setNotaCreditoOpen(false); }
    catch (e: any) {}
    finally { setSavingExtra(false); }
  }

  const TABS: { key: Tab; labelEs: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      key: "dashboard",  labelEs: "Dashboard",   labelEn: "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    },
    {
      key: "emitir",     labelEs: "Emitir CFDI",  labelEn: "Issue CFDI",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    },
    {
      key: "historial",  labelEs: "Historial",    labelEn: "History",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>,
    },
    {
      key: "notas",      labelEs: "Notas",         labelEn: "Notes",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
    {
      key: "calendario", labelEs: "Calendario",   labelEn: "Calendar",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
          {es ? "Facturación" : "Billing"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
          {es ? "Emisión de CFDI 4.0, complementos, notas y documentos fiscales." : "CFDI 4.0 issuance, complements, notes and fiscal documents."}
        </p>
      </div>

      {ctrl.error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {ctrl.error}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "1px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === t.key ? "var(--color-bg-base)" : "transparent", border: tab === t.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
            {t.icon}
            {es ? t.labelEs : t.labelEn}
          </button>
        ))}
      </div>

      {/* CONTENIDO */}
      {tab === "dashboard" && (
        <FacturacionDashboard
          stats={ctrl.stats}
          cfdis={ctrl.cfdis}
          loading={ctrl.loading}
          pendingShipments={pendingShipments}
          onSelect={ctrl.handleSelect}
          onEmitir={() => setTab("emitir")}
          onFacturarEmbarque={handleFacturarEmbarque}
        />
      )}

      {tab === "emitir" && (
        <CFDISelector onSelect={handleSelectCFDIType} />
      )}

      {tab === "historial" && (
        <>
          <FacturacionStats stats={ctrl.stats} />
          <FacturacionList
            cfdis={ctrl.cfdis}
            loading={ctrl.loading}
            filters={ctrl.filters}
            onFilter={ctrl.handleFilter}
            onSelect={ctrl.handleSelect}
            onXML={ctrl.handleDownloadXML}
            onPDF={ctrl.handleDownloadPDF}
          />
        </>
      )}

      {tab === "notas" && (
        <NotasDrawer
          notes={notes}
          saving={savingNote}
          loading={loadingNotes}
          onCreate={handleCreateNote}
        />
      )}

      {tab === "calendario" && (
        <FacturacionCalendario cfdis={ctrl.cfdis} loading={ctrl.loading} />
      )}

      {/* ── PANEL DETALLE CFDI (sidebar) ── */}
      {ctrl.selected && (
        <>
          <div onClick={() => ctrl.setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "380px", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {es ? "Detalle CFDI" : "CFDI Detail"}
              </div>
              <button onClick={() => ctrl.setSelected(null)} style={{ width: "28px", height: "28px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {ctrl.selected.cfdi.uuid && (
                <div style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>UUID SAT</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-primary)", fontFamily: "monospace", wordBreak: "break-all" }}>{ctrl.selected.cfdi.uuid}</div>
                </div>
              )}
              {[
                { l: es ? "Folio"     : "Folio",     v: `${ctrl.selected.cfdi.serie ?? ""}${ctrl.selected.cfdi.folio ?? "—"}` },
                { l: es ? "Fecha"     : "Date",      v: new Date(ctrl.selected.cfdi.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US") },
                { l: es ? "Receptor"  : "Receiver",  v: ctrl.selected.cfdi.receiver_name },
                { l: "RFC",                           v: ctrl.selected.cfdi.receiver_rfc  },
                { l: "Total",                         v: `${ctrl.selected.cfdi.currency} $${Number(ctrl.selected.cfdi.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` },
                { l: es ? "Método"    : "Method",     v: ctrl.selected.cfdi.payment_method },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "6px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{r.l}</span>
                  <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{r.v}</span>
                </div>
              ))}

              {ctrl.selected.concepts.length > 0 && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>{es ? "Conceptos" : "Concepts"}</div>
                  {ctrl.selected.concepts.map((c: any, i: number) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid var(--color-border-faint)" }}>
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

            {ctrl.selected.cfdi.status === "valid" && (
              <div style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => ctrl.handleDownloadXML(ctrl.selected!.cfdi)} style={{ flex: 1, height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>XML</button>
                  <button onClick={() => ctrl.handleDownloadPDF(ctrl.selected!.cfdi)} style={{ flex: 1, height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>PDF</button>
                  <button onClick={() => { setEmailTarget(ctrl.selected!.cfdi); setEmailInput(ctrl.selected!.cfdi.receiver_email ?? ""); }} style={{ flex: 1, height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>Email</button>
                </div>
                <button onClick={() => setCancelTarget(ctrl.selected!.cfdi)}
                  style={{ height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                  {es ? "Solicitar cancelación SAT" : "Request SAT cancellation"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── EMAIL MODAL ── */}
      {emailTarget && (
        <>
          <div onClick={() => setEmailTarget(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 600 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "360px", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", padding: "24px", zIndex: 601, display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Enviar por email" : "Send by email"}</div>
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="correo@cliente.com" style={{ ...INPUT, height: "36px" }} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleSendEmail} disabled={ctrl.saving} style={{ flex: 1, height: "36px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {ctrl.saving ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar XML + PDF" : "Send XML + PDF")}
              </button>
              <button onClick={() => setEmailTarget(null)} style={{ height: "36px", padding: "0 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                {es ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DRAWERS ── */}
      <CFDICreateDrawer
        open={selectedCFDIType?.id === "factura"}
        saving={ctrl.saving}
        preloadShipment={preloadShipment}
        onClose={() => { setSelectedCFDIType(null); setPreloadShipment(null); }}
        onCreate={ctrl.handleEmitir}
        onCreated={async (cfdi) => {
          // Vincular CFDI al embarque y marcarlo como facturado
          if (preloadShipment?.shipment_id && cfdi?.id) {
            await supabase.from("shipments")
              .update({ invoice_id: cfdi.id, status: "invoiced", updated_at: new Date().toISOString() })
              .eq("id", preloadShipment.shipment_id)
              .eq("company_id", companyId!);
          }
          setSelectedCFDIType(null);
          setPreloadShipment(null);
          setTab("historial");
          ctrl.handleSelect(cfdi);
          // Recargar embarques pendientes — el recién facturado ya no aparecerá
          if (companyId) {
            supabase.from("shipments").select("id, reference, service_type, currency, total, client:clients(name), quotation:quotations(quote_number)").eq("company_id", companyId).eq("status", "delivered").is("invoice_id", null).then(({ data }) => setPendingShipments(data ?? []));
          }
        }}
      />

      <CFDIComplementoPago
        open={compREPOpen}
        saving={savingExtra}
        cfdis={ctrl.cfdis}
        onClose={() => setCompREPOpen(false)}
        onCreate={handleEmitirComplemento}
      />

      <CFDINotaCredito
        open={notaCreditoOpen}
        saving={savingExtra}
        cfdis={ctrl.cfdis}
        onClose={() => setNotaCreditoOpen(false)}
        onCreate={handleEmitirNotaCredito}
      />

      <CFDINominaDrawer
        open={nominaDrawerOpen}
        onClose={() => setNominaDrawerOpen(false)}
        onDone={() => { ctrl.load(); setTab("historial"); }}
      />

      {cancelTarget && (
        <CFDICancelModal
          cfdi={cancelTarget}
          saving={ctrl.saving}
          onCancel={(motive, sub) => ctrl.handleCancelar(cancelTarget.id, cancelTarget.facturapi_id!, motive, sub)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
