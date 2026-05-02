"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { useFacturacionController } from "./services/facturacion.controller";
import { fetchBusinessNotes, createBusinessNote, emitirComplementoPago, emitirNotaCredito } from "./services/facturacion.service";
import type { CFDITypeOption } from "./types/facturacion.types";
import type { CFDIDocument } from "./types/facturacion.types";
// Filtros del dashboard de Facturación (lista principal con chips)
type ActiveFilter = "all" | "factura" | "proforma" | "nota_credito" | "complemento" | "cancelled";
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
import { CFDICartaPorteDrawer }                                from "./cartaporte/components/CFDICartaPorteDrawer";
import { saveCartaPorteDraft, stampCartaPorte }                from "./cartaporte/services/carta_porte.service";
import type { CFDIConCartaPorteData, CartaPorteParentType }   from "./cartaporte/types/carta_porte.types";

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

  const [selectedCFDIType,   setSelectedCFDIType]   = useState<CFDITypeOption | null>(null);
  const [cancelTarget,       setCancelTarget]        = useState<CFDIDocument | null>(null);
  const [emailTarget,        setEmailTarget]         = useState<CFDIDocument | null>(null);
  const [emailInput,         setEmailInput]          = useState("");
  const [compREPOpen,        setCompREPOpen]         = useState(false);
  const [notaCreditoOpen,    setNotaCreditoOpen]     = useState(false);
  const [savingExtra,        setSavingExtra]         = useState(false);
  const [pendingShipments,   setPendingShipments]    = useState<any[]>([]);
  const [pendingOrders,      setPendingOrders]       = useState<any[]>([]);
  const [preloadShipment,    setPreloadShipment]     = useState<any | null>(null);
  const [nominaDrawerOpen,   setNominaDrawerOpen]    = useState(false);

  // ─── Carta Porte (Factura/Traslado con CCP 3.1) ───
  const [cartaPorteDrawerOpen, setCartaPorteDrawerOpen] = useState<CartaPorteParentType | null>(null);
  const [savingCartaPorte,     setSavingCartaPorte]     = useState(false);

  // ─── Edición de Proforma ───
  // Cuando hay un editProformaId, el CFDICreateDrawer se abre en modo edición
  const [editProformaId,     setEditProformaId]     = useState<string | null>(null);

  // ─── Filtro activo de la lista del dashboard ───
  const [dashboardFilter,    setDashboardFilter]    = useState<ActiveFilter>("all");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const ctrl = useFacturacionController(companyId ?? "", userId);

  useEffect(() => {
    if (!companyId) return;
    ctrl.load();
    supabase
      .from("shipments")
      .select("id, reference, service_type, currency, total, client:clients(name), quotation:quotations(quote_number)")
      .eq("company_id", companyId)
      .eq("status", "delivered")
      .is("invoice_id", null)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setPendingShipments(data ?? []));
    supabase
      .from("orders")
      .select("id, order_number, currency, total, subtotal, tax_rate, tax_amount, delivery_date, client:clients(name, legal_name, rfc, email, tax_regime, zip_code), quotation:quotations(quote_number)")
      .eq("company_id", companyId)
      .eq("status", "delivered")
      .is("invoice_id", null)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setPendingOrders(data ?? []));
  }, [companyId]);

  const loadNotes = useCallback(async () => {
    if (!companyId) return;
    setLoadingNotes(true);
    try { setNotes(await fetchBusinessNotes(companyId)); }
    catch {} finally { setLoadingNotes(false); }
  }, [companyId]);

  useEffect(() => { if (tab === "notas") loadNotes(); }, [tab]);

  function handleSelectCFDIType(opt: CFDITypeOption) {
    if (opt.id === "complemento_pago") { setCompREPOpen(true); return; }
    if (opt.id === "nota_credito")     { setNotaCreditoOpen(true); return; }
    if (opt.id === "nomina")           { setNominaDrawerOpen(true); return; }

    // ─── Carta Porte: drawer dedicado que combina CFDI base + complemento ───
    if (opt.id === "factura_carta_porte" || opt.id === "traslado_carta_porte") {
      setCartaPorteDrawerOpen(opt.id as CartaPorteParentType);
      return;
    }

    // ─── Traslado simple (sin CCP): caso muy raro, lo dejamos para después ───
    if (opt.id === "traslado") {
      alert(es
        ? "El Traslado simple (sin Carta Porte) estará disponible próximamente. Para mover mercancía con vehículos, usa 'Traslado con Carta Porte'."
        : "Simple Transfer (without Bill of Lading) will be available soon. To move goods with vehicles, use 'Transfer with Bill of Lading'."
      );
      return;
    }

    setSelectedCFDIType(opt);
  }

  async function handleFacturarEmbarque(shipment: any) {
    if (!companyId) return;
    const { data: sh } = await supabase
      .from("shipments")
      .select(`*, client:clients(name, legal_name, rfc, email, tax_regime, zip_code), services:shipment_services(description, price, currency, product_id, product:products(name, sat_product_code, sat_unit_code, unit))`)
      .eq("id", shipment.id)
      .single();
    if (!sh) return;

    let services = (sh.services ?? []).map((s: any) => ({
      description:      s.product?.name             ?? s.description,
      price:            s.price,
      currency:         s.currency,
      product_id:       s.product_id                ?? null,
      sat_product_code: s.product?.sat_product_code ?? "84111506",
      sat_unit_code:    s.product?.sat_unit_code     ?? "E48",
      unit:             s.product?.unit              ?? "Servicio",
    }));

    if (services.length === 0 && sh.quotation_id) {
      const { data: qsvcs } = await supabase
        .from("quotation_services")
        .select("description, price, currency, product_id, product:products(name, sat_product_code, sat_unit_code, unit)")
        .eq("quotation_id", sh.quotation_id)
        .order("sort_order");
      services = (qsvcs ?? []).map((s: any) => ({
        description:      s.product?.name             ?? s.description,
        price:            s.price,
        currency:         s.currency,
        product_id:       s.product_id                ?? null,
        sat_product_code: s.product?.sat_product_code ?? "84111506",
        sat_unit_code:    s.product?.sat_unit_code     ?? "E48",
        unit:             s.product?.unit              ?? "Servicio",
      }));
    }

    if (services.length === 0) {
      services = [{ description: `Servicio logístico — ${sh.reference}`, price: sh.total ?? 0, currency: sh.currency ?? "MXN" }];
    }

    const mappedServices = services.map((s: any) => ({
      description:      s.description,
      price:            s.price,
      currency:         s.currency         ?? sh.currency ?? "MXN",
      product_id:       s.product_id       ?? null,
      sat_product_code: s.sat_product_code ?? "84111506",
      sat_unit_code:    s.sat_unit_code     ?? "E48",
      unit:             s.unit             ?? "Servicio",
    }));
    const uniqueCurrencies = [...new Set(mappedServices.map((s: any) => s.currency as string))];
    const hasMultiCurrency = uniqueCurrencies.length > 1;
    const servicesByCurrency = uniqueCurrencies.reduce((acc: Record<string, any[]>, cur: string) => {
      acc[cur] = mappedServices.filter((s: any) => s.currency === cur);
      return acc;
    }, {} as Record<string, any[]>);

    setPreloadShipment({
      shipment_id:     sh.id,
      reference:       sh.reference,
      client_id:       sh.client_id,
      receiver_rfc:    (sh.client as any)?.rfc        ?? "",
      receiver_name:   (sh.client as any)?.legal_name ?? (sh.client as any)?.name ?? "",
      receiver_email:  (sh.client as any)?.email      ?? "",
      receiver_zip:    (sh.client as any)?.zip_code   ?? "",
      receiver_regime: (sh.client as any)?.tax_regime ?? "601",
      currency:        sh.currency ?? "MXN",
      total:           sh.total,
      services:        mappedServices,
      hasMultiCurrency,
      servicesByCurrency,
    });
    setSelectedCFDIType({ id: "factura" } as any);
  }

// ─── Abrir el drawer en modo edición de Proforma ───
  function handleEditProforma(cfdi: CFDIDocument) {
    setEditProformaId(cfdi.id);
    setSelectedCFDIType({ id: "factura" } as any);
  }

  // ─── Callback que se dispara cuando una proforma cambia (saved/updated/stamped/deleted) ───
  async function handleProformaChange(action: "saved" | "updated" | "stamped" | "deleted", cfdi?: any) {
    // Refrescar la lista en todos los casos
    await ctrl.load();

    // Si fue timbrada, abrir su detalle (mismo comportamiento que onCreated del flujo timbrado directo)
    if (action === "stamped" && cfdi) {
      ctrl.handleSelect(cfdi);
      setTab("dashboard");
    }

    // Si fue eliminada o timbrada, recargar también pendientes (por si estaba ligada a un embarque/pedido)
    if ((action === "stamped" || action === "deleted") && companyId) {
      supabase.from("shipments").select("id, reference, service_type, currency, total, client:clients(name), quotation:quotations(quote_number)").eq("company_id", companyId).eq("status", "delivered").is("invoice_id", null).then(({ data }) => setPendingShipments(data ?? []));
      supabase.from("orders").select("id, order_number, currency, total, delivery_date, client:clients(name, legal_name, rfc, email, tax_regime, zip_code), quotation:quotations(quote_number)").eq("company_id", companyId).eq("status", "delivered").is("invoice_id", null).then(({ data }) => setPendingOrders(data ?? []));
    }
  }
  
  async function handleFacturarPedido(order: any) {
    if (!companyId) return;
    const { data: items } = await supabase
      .from("order_items")
      .select("description, quantity, unit_price, discount_pct, subtotal, unit, product_id, product:products(name, sat_product_code, sat_unit_code, unit)")
      .eq("order_id", order.id)
      .order("sort_order");

            // Para items sin product_id, buscar el producto por nombre para obtener claves SAT
    const itemsWithSAT = await Promise.all((items ?? []).map(async (item: any) => {
      if (item.product) return item;
      if (!item.description) return item;
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, sat_product_code, sat_unit_code, unit")
        .eq("company_id", companyId!)
        .ilike("name", item.description.trim())
        .maybeSingle();
      return prod ? { ...item, product: prod } : item;
    }));

    const mappedServices = itemsWithSAT.map((item: any) => ({
      description:      item.product?.name             ?? item.description,
      price:            item.subtotal,
      currency:         order.currency                 ?? "MXN",
      product_id:       item.product_id                ?? item.product?.id ?? null,
      sat_product_code: item.product?.sat_product_code ?? "",
      sat_unit_code:    item.product?.sat_unit_code     ?? "",
      unit:             item.product?.unit              ?? item.unit ?? "",
      quantity:         item.quantity,
      unit_price:       item.unit_price,
    }));

        const services = mappedServices.length > 0 ? mappedServices : [{
      description:      `Pedido ${order.order_number}`,
      price:            order.total ?? 0,
      currency:         order.currency ?? "MXN",
      sat_product_code: "",
      sat_unit_code:    "",
      unit:             "",
    }];

    setPreloadShipment({
      order_id:        order.id,
      reference:       order.order_number,
      client_id:       order.client_id,
      receiver_rfc:    order.client?.rfc          ?? "",
      receiver_name:   order.client?.legal_name   ?? order.client?.name ?? "",
      receiver_email:  order.client?.email        ?? "",
      receiver_zip:    order.client?.zip_code     ?? "",
      receiver_regime: order.client?.tax_regime   ?? "601",
      currency:        order.currency             ?? "MXN",
      total:           order.total,
      services,
      hasMultiCurrency:    false,
      servicesByCurrency: { [order.currency ?? "MXN"]: services },
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

  async function handleEmitirNotaCredito(payload: any) {
    setSavingExtra(true);
    try { await emitirNotaCredito(companyId ?? "", userId, payload); await ctrl.load(); setNotaCreditoOpen(false); }
    catch (e: any) {}
    finally { setSavingExtra(false); }
  }

  // ─────────────────────────────────────────────────────────────
  // Handlers de Carta Porte
  // ─────────────────────────────────────────────────────────────
  async function handleSaveCartaPorteDraft(data: CFDIConCartaPorteData) {
    if (!companyId || !cartaPorteDrawerOpen) return;
    setSavingCartaPorte(true);
    try {
      await saveCartaPorteDraft(companyId, cartaPorteDrawerOpen, data);
      await ctrl.load();
      setCartaPorteDrawerOpen(null);
      setTab("historial");
    } catch (e: any) {
      alert(e.message ?? (es ? "Error guardando borrador" : "Error saving draft"));
    } finally {
      setSavingCartaPorte(false);
    }
  }

  async function handleStampCartaPorte(data: CFDIConCartaPorteData) {
    if (!companyId || !cartaPorteDrawerOpen) return;
    setSavingCartaPorte(true);
    try {
      // 1) Crear el borrador en BD
      const result = await saveCartaPorteDraft(companyId, cartaPorteDrawerOpen, data);
      // 2) Timbrar el borrador (lo manda al SAT vía Facturapi)
      const stamped = await stampCartaPorte(result.cfdi_id);
      // 3) Refrescar lista y cerrar drawer
      await ctrl.load();
      setCartaPorteDrawerOpen(null);
      setTab("historial");
      // 4) Abrir detalle del CFDI recién timbrado
      if (stamped?.cfdi?.id) {
        const sel = ctrl.cfdis.find((c) => c.id === stamped.cfdi.id) ?? stamped.cfdi;
        ctrl.handleSelect(sel as any);
      }
    } catch (e: any) {
      alert(e.message ?? (es ? "Error al timbrar Carta Porte" : "Error stamping Bill of Lading"));
    } finally {
      setSavingCartaPorte(false);
    }
  }

  const TABS: { key: Tab; labelEs: string; labelEn: string; icon: React.ReactNode }[] = [
    { key: "dashboard",  labelEs: "Dashboard",   labelEn: "Dashboard",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { key: "emitir",     labelEs: "Emitir CFDI",  labelEn: "Issue CFDI",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
    { key: "historial",  labelEs: "Historial",    labelEn: "History",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg> },
    { key: "notas",      labelEs: "Notas",        labelEn: "Notes",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { key: "calendario", labelEs: "Calendario",   labelEn: "Calendar",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  ];

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

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

      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "1px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === t.key ? "var(--color-bg-base)" : "transparent", border: tab === t.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none", color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
            {t.icon}
            {es ? t.labelEs : t.labelEn}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <FacturacionDashboard
          stats={ctrl.stats}
          cfdis={ctrl.cfdis}
          loading={ctrl.loading}
          pendingShipments={pendingShipments}
          pendingOrders={pendingOrders}
          onSelect={ctrl.handleSelect}
          onEditProforma={handleEditProforma}
          onEmitir={() => setTab("emitir")}
          onFacturarEmbarque={handleFacturarEmbarque}
          onFacturarPedido={handleFacturarPedido}
          activeFilter={dashboardFilter}
          onChangeFilter={setDashboardFilter}
        />
      )}
      {tab === "emitir"     && <CFDISelector onSelect={handleSelectCFDIType} />}
      {tab === "historial"  && (
        <>
          <FacturacionStats stats={ctrl.stats} />
          <FacturacionList cfdis={ctrl.cfdis} loading={ctrl.loading} filters={ctrl.filters} onFilter={ctrl.handleFilter} onSelect={ctrl.handleSelect} onXML={ctrl.handleDownloadXML} onPDF={ctrl.handleDownloadPDF} />
        </>
      )}
      {tab === "notas"      && <NotasDrawer notes={notes} saving={savingNote} loading={loadingNotes} onCreate={handleCreateNote} />}
      {tab === "calendario" && <FacturacionCalendario cfdis={ctrl.cfdis} loading={ctrl.loading} />}

      {/* PANEL DETALLE CFDI */}
      {ctrl.selected && (
        <>
          <div onClick={() => ctrl.setSelected(null)} style={{ position: "fixed", inset: 0, zIndex: 299 }} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "380px", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>{es ? "Detalle CFDI" : "CFDI Detail"}</div>
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
                { l: es ? "Folio"    : "Folio",    v: `${ctrl.selected.cfdi.serie ?? ""}${ctrl.selected.cfdi.folio ?? "—"}` },
                { l: es ? "Fecha"    : "Date",     v: new Date(ctrl.selected.cfdi.cfdi_date).toLocaleDateString(es ? "es-MX" : "en-US") },
                { l: es ? "Receptor" : "Receiver", v: ctrl.selected.cfdi.receiver_name },
                { l: "RFC",                         v: ctrl.selected.cfdi.receiver_rfc  },
                { l: "Total",                       v: `${ctrl.selected.cfdi.currency} $${Number(ctrl.selected.cfdi.total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` },
                { l: es ? "Método"   : "Method",   v: ctrl.selected.cfdi.payment_method },
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
                <button onClick={() => setCancelTarget(ctrl.selected!.cfdi)} style={{ height: "34px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                  {es ? "Solicitar cancelación SAT" : "Request SAT cancellation"}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* EMAIL MODAL */}
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

      {/* DRAWERS */}
      <CFDICreateDrawer
        open={selectedCFDIType?.id === "factura"}
        saving={ctrl.saving}
        preloadShipment={preloadShipment}
        editProformaId={editProformaId}
        onProformaChange={handleProformaChange}
        onClose={() => { setSelectedCFDIType(null); setPreloadShipment(null); setEditProformaId(null); }}
        onCreate={ctrl.handleEmitir}
        onCreated={async (cfdi) => {
          // Vincular CFDI al embarque
          if (preloadShipment?.shipment_id && cfdi?.id) {
            await supabase.from("shipments")
              .update({ invoice_id: cfdi.id, status: "invoiced", total: cfdi.total ?? preloadShipment.total, currency: cfdi.currency ?? preloadShipment.currency, updated_at: new Date().toISOString() })
              .eq("id", preloadShipment.shipment_id)
              .eq("company_id", companyId!);
          }
          // Vincular CFDI al pedido
          if (preloadShipment?.order_id && cfdi?.id) {
            await supabase.from("orders")
              .update({ invoice_id: cfdi.id, invoiced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
              .eq("id", preloadShipment.order_id)
              .eq("company_id", companyId!);
          }
          setSelectedCFDIType(null);
          setPreloadShipment(null);
          setTab("historial");
          ctrl.handleSelect(cfdi);
          // Recargar pendientes
          if (companyId) {
            supabase.from("shipments").select("id, reference, service_type, currency, total, client:clients(name), quotation:quotations(quote_number)").eq("company_id", companyId).eq("status", "delivered").is("invoice_id", null).then(({ data }) => setPendingShipments(data ?? []));
            supabase.from("orders").select("id, order_number, currency, total, delivery_date, client:clients(name, legal_name, rfc, email, tax_regime, zip_code), quotation:quotations(quote_number)").eq("company_id", companyId).eq("status", "delivered").is("invoice_id", null).then(({ data }) => setPendingOrders(data ?? []));
          }
        }}
      />

      <CFDIComplementoPago open={compREPOpen} saving={savingExtra} cfdis={ctrl.cfdis} onClose={() => setCompREPOpen(false)} onCreate={handleEmitirComplemento} />
      <CFDINotaCredito     open={notaCreditoOpen} saving={savingExtra} cfdis={ctrl.cfdis} onClose={() => setNotaCreditoOpen(false)} onCreate={handleEmitirNotaCredito} />
      <CFDINominaDrawer    open={nominaDrawerOpen} onClose={() => setNominaDrawerOpen(false)} onDone={() => { ctrl.load(); setTab("historial"); }} />

      <CFDICartaPorteDrawer
        open={!!cartaPorteDrawerOpen}
        parentType={cartaPorteDrawerOpen ?? "factura_carta_porte"}
        saving={savingCartaPorte}
        onClose={() => setCartaPorteDrawerOpen(null)}
        onSaveDraft={handleSaveCartaPorteDraft}
        onStamp={handleStampCartaPorte}
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
