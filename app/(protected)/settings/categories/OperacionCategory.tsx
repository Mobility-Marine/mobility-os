"use client";

// ════════════════════════════════════════════════════════════════════════
// OPERACIÓN — Categoría más grande de Settings (8 cards)
// ════════════════════════════════════════════════════════════════════════
// Define cómo trabaja el ERP día a día:
//   1) Cotizaciones — formato + vigencia + términos por defecto
//   2) Pedidos — formato (NUEVO en BD)
//   3) Servicios logísticos — formato + subtipos CON/LOG con contadores separados
//   4) Recepciones — formato (REC-{AÑO}-{NUM})
//   5) Órdenes de compra — formato (OC-{AÑO}-{NUM})
//   6) Conteos de inventario — formato (CNT-{AÑO}-{NUM})
//   7) Margen mínimo — % de alerta cuando un producto se vende debajo de él
//   8) Objetivos del negocio — meta mensual de ventas
// ════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import SettingCard            from "../components/SettingCard";
import SettingDrawer          from "../components/SettingDrawer";
import FolioFormatField       from "../components/FolioFormatField";
import { useCompanySettings } from "../hooks/useCompanySettings";
import { previewFolio }       from "@/lib/folios/generators";

type DrawerKey =
  | null
  | "cotizaciones"
  | "pedidos"
  | "servicios"
  | "recepciones"
  | "ordenes_compra"
  | "conteos"
  | "margen"
  | "objetivos";

// ════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════

export default function OperacionCategory() {
  const { settings, loading, saving, update } = useCompanySettings();
  const [openDrawer, setOpenDrawer] = useState<DrawerKey>(null);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando configuración…
      </div>
    );
  }

  const rfc = settings?.fiscal_rfc ?? null;

  // Previews de cada folio
  const previewCot = previewFolio(
    settings?.quote_number_format    ?? "COT-{AÑO}-{NUM}",
    settings?.quote_number_counter   ?? 1,
    rfc,
  );
  const previewPed = previewFolio(
    settings?.order_number_format    ?? "PED-{EMPRESA}-{NUM}",
    settings?.order_number_counter   ?? 1,
    rfc,
  );
  const previewServCon = previewFolio(
    settings?.shipment_ref_format    ?? "{SUBTIPO}-{EMPRESA}-{NUM}",
    settings?.shipment_ref_counter_consultoria ?? 1,
    rfc,
    { SUBTIPO: "CON" },
  );
  const previewServLog = previewFolio(
    settings?.shipment_ref_format    ?? "{SUBTIPO}-{EMPRESA}-{NUM}",
    settings?.shipment_ref_counter_logistica ?? 1,
    rfc,
    { SUBTIPO: "LOG" },
  );
  const previewRec = previewFolio(
    settings?.reception_number_format ?? "REC-{AÑO}-{NUM}",
    settings?.reception_number_counter ?? 1,
    rfc,
  );
  const previewOC  = previewFolio(
    settings?.po_number_format       ?? "OC-{AÑO}-{NUM}",
    settings?.po_number_counter      ?? 1,
    rfc,
  );
  const previewCnt = previewFolio(
    settings?.count_number_format    ?? "CNT-{AÑO}-{NUM}",
    settings?.count_number_counter   ?? 1,
    rfc,
  );

  return (
    <>
      {/* Grid de cards */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap:                 "16px",
        }}
      >
        <SettingCard
          icon="📋"
          title="Cotizaciones"
          description="Formato del folio, vigencia por defecto y términos comerciales."
          preview={previewCot}
          previewLabel="PRÓXIMO FOLIO"
          onClick={() => setOpenDrawer("cotizaciones")}
        />
        <SettingCard
          icon="🛒"
          title="Pedidos"
          description="Formato del folio para órdenes de venta confirmadas."
          preview={previewPed}
          previewLabel="PRÓXIMO FOLIO"
          onClick={() => setOpenDrawer("pedidos")}
        />
        <SettingCard
          icon="🚚"
          title="Servicios logísticos"
          description="Formato unificado para consultoría (CON) y logística (LOG)."
          preview={`${previewServCon} · ${previewServLog}`}
          previewLabel="PRÓXIMOS FOLIOS"
          onClick={() => setOpenDrawer("servicios")}
        />
        <SettingCard
          icon="📥"
          title="Recepciones"
          description="Folio para recepción de mercancía contra orden de compra."
          preview={previewRec}
          previewLabel="PRÓXIMO FOLIO"
          onClick={() => setOpenDrawer("recepciones")}
        />
        <SettingCard
          icon="📜"
          title="Órdenes de compra"
          description="Folio para OCs emitidas a proveedores."
          preview={previewOC}
          previewLabel="PRÓXIMO FOLIO"
          onClick={() => setOpenDrawer("ordenes_compra")}
        />
        <SettingCard
          icon="🧮"
          title="Conteos de inventario"
          description="Folio para tomas físicas y ajustes de almacén."
          preview={previewCnt}
          previewLabel="PRÓXIMO FOLIO"
          onClick={() => setOpenDrawer("conteos")}
        />
        <SettingCard
          icon="📊"
          title="Margen mínimo"
          description="Porcentaje de alerta cuando un producto se vende debajo del margen."
          preview={`${Number(settings?.margin_minimum_pct ?? 20)}%`}
          previewLabel="UMBRAL ACTUAL"
          onClick={() => setOpenDrawer("margen")}
        />
        <SettingCard
          icon="🎯"
          title="Objetivos del negocio"
          description="Meta mensual de ventas y métrica de seguimiento (cotizaciones / facturas)."
          preview={`${Number(settings?.monthly_goal ?? 0).toLocaleString("es-MX", { style: "currency", currency: settings?.goal_currency ?? "MXN" })}`}
          previewLabel="META MENSUAL"
          onClick={() => setOpenDrawer("objetivos")}
        />
      </div>

      {/* Drawers */}
      <CotizacionesDrawer    open={openDrawer === "cotizaciones"}    onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <PedidosDrawer         open={openDrawer === "pedidos"}         onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <ServiciosDrawer       open={openDrawer === "servicios"}       onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <RecepcionesDrawer     open={openDrawer === "recepciones"}     onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <OrdenesCompraDrawer   open={openDrawer === "ordenes_compra"}  onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <ConteosDrawer         open={openDrawer === "conteos"}         onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <MargenDrawer          open={openDrawer === "margen"}          onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
      <ObjetivosDrawer       open={openDrawer === "objetivos"}       onClose={() => setOpenDrawer(null)} settings={settings} saving={saving} update={update} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// DRAWERS
// ════════════════════════════════════════════════════════════════════════

type DrawerSubProps = {
  open:     boolean;
  onClose:  () => void;
  settings: ReturnType<typeof useCompanySettings>["settings"];
  saving:   boolean;
  update:   ReturnType<typeof useCompanySettings>["update"];
};

// ────────────────────────────────────────────────────────────────────────
// 1) Cotizaciones
// ────────────────────────────────────────────────────────────────────────
function CotizacionesDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    quote_number_format:  "COT-{AÑO}-{NUM}",
    quote_number_counter: 1,
    quote_validity_days:  15,
    quote_terms_services: "",
    quote_terms_products: "",
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        quote_number_format:  settings.quote_number_format  ?? "COT-{AÑO}-{NUM}",
        quote_number_counter: settings.quote_number_counter ?? 1,
        quote_validity_days:  settings.quote_validity_days  ?? 15,
        quote_terms_services: settings.quote_terms_services ?? "",
        quote_terms_products: settings.quote_terms_products ?? "",
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Cotizaciones"
      description="Formato del folio, vigencia y términos por defecto."
      icon="📋" size="lg" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <Section title="Numeración">
        <FolioFormatField
          format={form.quote_number_format}
          counter={form.quote_number_counter}
          onChangeFormat={(v)  => setForm({ ...form, quote_number_format: v })}
          onChangeCounter={(v) => setForm({ ...form, quote_number_counter: v })}
          fiscalRfc={settings?.fiscal_rfc}
          supportedTokens={["EMPRESA", "AÑO", "MES", "NUM"]}
        />
      </Section>

      <Section title="Vigencia">
        <label style={labelStyle}>Días de validez por defecto</label>
        <input
          type="number" min={1} max={365}
          style={{ ...inputStyle, maxWidth: "180px" }}
          value={form.quote_validity_days}
          onChange={(e) => setForm({ ...form, quote_validity_days: Number(e.target.value) || 15 })}
        />
        <Hint>Número de días que la cotización es válida desde su emisión.</Hint>
      </Section>

      <Section title="Términos y condiciones por defecto">
        <label style={labelStyle}>Para cotizaciones de servicios</label>
        <textarea
          rows={5}
          style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          value={form.quote_terms_services}
          onChange={(e) => setForm({ ...form, quote_terms_services: e.target.value })}
          placeholder="Términos que se cargan automáticamente en cotizaciones de servicios logísticos."
        />
        <div style={{ height: 14 }} />
        <label style={labelStyle}>Para cotizaciones de productos</label>
        <textarea
          rows={5}
          style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
          value={form.quote_terms_products}
          onChange={(e) => setForm({ ...form, quote_terms_products: e.target.value })}
          placeholder="Términos que se cargan automáticamente en cotizaciones de productos."
        />
      </Section>
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 2) Pedidos
// ────────────────────────────────────────────────────────────────────────
function PedidosDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    order_number_format:  "PED-{EMPRESA}-{NUM}",
    order_number_counter: 1,
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        order_number_format:  settings.order_number_format  ?? "PED-{EMPRESA}-{NUM}",
        order_number_counter: settings.order_number_counter ?? 1,
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Pedidos"
      description="Folio para órdenes de venta confirmadas (post-cotización)."
      icon="🛒" size="md" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <FolioFormatField
        format={form.order_number_format}
        counter={form.order_number_counter}
        onChangeFormat={(v)  => setForm({ ...form, order_number_format: v })}
        onChangeCounter={(v) => setForm({ ...form, order_number_counter: v })}
        fiscalRfc={settings?.fiscal_rfc}
        supportedTokens={["EMPRESA", "AÑO", "MES", "NUM"]}
        helpText="Sugerencia: usa {EMPRESA} para identificar al tenant en folios multi-empresa."
      />
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 3) Servicios logísticos (con contadores separados)
// ────────────────────────────────────────────────────────────────────────
function ServiciosDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    shipment_ref_format:               "{SUBTIPO}-{EMPRESA}-{NUM}",
    shipment_ref_counter_consultoria:  1,
    shipment_ref_counter_logistica:    1,
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        shipment_ref_format:              settings.shipment_ref_format              ?? "{SUBTIPO}-{EMPRESA}-{NUM}",
        shipment_ref_counter_consultoria: settings.shipment_ref_counter_consultoria ?? 1,
        shipment_ref_counter_logistica:   settings.shipment_ref_counter_logistica   ?? 1,
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  const previewCon = previewFolio(form.shipment_ref_format, form.shipment_ref_counter_consultoria, settings?.fiscal_rfc ?? null, { SUBTIPO: "CON" });
  const previewLog = previewFolio(form.shipment_ref_format, form.shipment_ref_counter_logistica,   settings?.fiscal_rfc ?? null, { SUBTIPO: "LOG" });

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Servicios logísticos"
      description="Folios separados por subtipo: consultoría (CON) y logística (LOG)."
      icon="🚚" size="lg" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <Section title="Formato compartido">
        <label style={labelStyle}>Formato del folio</label>
        <input
          type="text"
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
          value={form.shipment_ref_format}
          onChange={(e) => setForm({ ...form, shipment_ref_format: e.target.value })}
          placeholder="{SUBTIPO}-{EMPRESA}-{NUM}"
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
          {["SUBTIPO", "EMPRESA", "AÑO", "MES", "NUM"].map((t) => (
            <button
              key={t} type="button"
              onClick={() => setForm({ ...form, shipment_ref_format: form.shipment_ref_format + `{${t}}` })}
              style={tokenChipStyle}
            >
              {`{${t}}`}
            </button>
          ))}
        </div>
        <Hint>
          <strong>Sugerencia:</strong> mantén <code>{"{SUBTIPO}"}</code> al inicio para que el folio sea
          legible y los subtipos se ordenen alfabéticamente en listados.
        </Hint>
      </Section>

      <Section title="Consultoría (CON)">
        <div style={previewBoxStyle}>
          <div style={previewLabelStyle}>PRÓXIMO FOLIO</div>
          <div style={previewValueStyle}>{previewCon}</div>
        </div>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Próximo número (consultoría / seguro)</label>
          <input
            type="number" min={1}
            style={{ ...inputStyle, maxWidth: "180px" }}
            value={form.shipment_ref_counter_consultoria}
            onChange={(e) => setForm({ ...form, shipment_ref_counter_consultoria: Number(e.target.value) || 1 })}
          />
          <Hint>Incluye servicios de consultoría aduanal y servicios de seguro de carga.</Hint>
        </div>
      </Section>

      <Section title="Logística (LOG)">
        <div style={previewBoxStyle}>
          <div style={previewLabelStyle}>PRÓXIMO FOLIO</div>
          <div style={previewValueStyle}>{previewLog}</div>
        </div>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Próximo número (logística)</label>
          <input
            type="number" min={1}
            style={{ ...inputStyle, maxWidth: "180px" }}
            value={form.shipment_ref_counter_logistica}
            onChange={(e) => setForm({ ...form, shipment_ref_counter_logistica: Number(e.target.value) || 1 })}
          />
          <Hint>Incluye terrestre, marítimo, aéreo, multimodal, almacenaje y aduanal.</Hint>
        </div>
      </Section>
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 4) Recepciones
// ────────────────────────────────────────────────────────────────────────
function RecepcionesDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    reception_number_format:  "REC-{AÑO}-{NUM}",
    reception_number_counter: 1,
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        reception_number_format:  settings.reception_number_format  ?? "REC-{AÑO}-{NUM}",
        reception_number_counter: settings.reception_number_counter ?? 1,
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Recepciones"
      description="Folio para recepción de mercancía en almacén."
      icon="📥" size="md" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <FolioFormatField
        format={form.reception_number_format}
        counter={form.reception_number_counter}
        onChangeFormat={(v)  => setForm({ ...form, reception_number_format: v })}
        onChangeCounter={(v) => setForm({ ...form, reception_number_counter: v })}
        fiscalRfc={settings?.fiscal_rfc}
        supportedTokens={["EMPRESA", "AÑO", "MES", "NUM"]}
      />
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 5) Órdenes de compra
// ────────────────────────────────────────────────────────────────────────
function OrdenesCompraDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    po_number_format:  "OC-{AÑO}-{NUM}",
    po_number_counter: 1,
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        po_number_format:  settings.po_number_format  ?? "OC-{AÑO}-{NUM}",
        po_number_counter: settings.po_number_counter ?? 1,
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Órdenes de compra"
      description="Folio para órdenes emitidas a proveedores."
      icon="📜" size="md" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <FolioFormatField
        format={form.po_number_format}
        counter={form.po_number_counter}
        onChangeFormat={(v)  => setForm({ ...form, po_number_format: v })}
        onChangeCounter={(v) => setForm({ ...form, po_number_counter: v })}
        fiscalRfc={settings?.fiscal_rfc}
        supportedTokens={["EMPRESA", "AÑO", "MES", "NUM"]}
      />
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 6) Conteos de inventario
// ────────────────────────────────────────────────────────────────────────
function ConteosDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    count_number_format:  "CNT-{AÑO}-{NUM}",
    count_number_counter: 1,
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        count_number_format:  settings.count_number_format  ?? "CNT-{AÑO}-{NUM}",
        count_number_counter: settings.count_number_counter ?? 1,
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Conteos de inventario"
      description="Folio para tomas físicas y ajustes de almacén."
      icon="🧮" size="md" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <FolioFormatField
        format={form.count_number_format}
        counter={form.count_number_counter}
        onChangeFormat={(v)  => setForm({ ...form, count_number_format: v })}
        onChangeCounter={(v) => setForm({ ...form, count_number_counter: v })}
        fiscalRfc={settings?.fiscal_rfc}
        supportedTokens={["EMPRESA", "AÑO", "MES", "NUM"]}
      />
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 7) Margen mínimo
// ────────────────────────────────────────────────────────────────────────
function MargenDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [pct, setPct] = useState<number>(20);

  useEffect(() => {
    if (open && settings) {
      setPct(Number(settings.margin_minimum_pct) || 20);
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update({ margin_minimum_pct: pct });
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Margen mínimo"
      description="Umbral de alerta cuando un producto se vende debajo de este margen."
      icon="📊" size="sm" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <div>
        <label style={labelStyle}>Margen mínimo de ganancia (%)</label>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="number" min={0} max={100} step={0.5}
            style={{ ...inputStyle, maxWidth: "140px", textAlign: "right" }}
            value={pct}
            onChange={(e) => setPct(Math.max(0, Math.min(100, Number(e.target.value))) || 0)}
          />
          <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--fg-muted)" }}>%</span>
        </div>
        <Hint>
          El sistema mostrará una alerta visual al cotizar productos que dejen un margen menor a este
          porcentaje. No bloquea la operación, solo advierte.
        </Hint>
      </div>
    </SettingDrawer>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 8) Objetivos del negocio
// ────────────────────────────────────────────────────────────────────────
function ObjetivosDrawer({ open, onClose, settings, saving, update }: DrawerSubProps) {
  const [form, setForm] = useState({
    monthly_goal:        0,
    goal_currency:       "MXN",
    monthly_goal_metric: "invoices",
  });

  useEffect(() => {
    if (open && settings) {
      setForm({
        monthly_goal:        Number(settings.monthly_goal) || 0,
        goal_currency:       settings.goal_currency       ?? "MXN",
        monthly_goal_metric: settings.monthly_goal_metric ?? "invoices",
      });
    }
  }, [open, settings]);

  const handleSave = async () => {
    const ok = await update(form);
    if (ok) onClose();
  };

  return (
    <SettingDrawer
      open={open} onClose={onClose} title="Objetivos del negocio"
      description="Meta mensual de ventas y métrica que se rastrea en el dashboard."
      icon="🎯" size="md" saving={saving}
      footer={<DrawerFooter saving={saving} onCancel={onClose} onSave={handleSave} />}
    >
      <Section title="Meta mensual">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
          <div>
            <label style={labelStyle}>Importe</label>
            <input
              type="number" min={0} step={1000}
              style={inputStyle}
              value={form.monthly_goal}
              onChange={(e) => setForm({ ...form, monthly_goal: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label style={labelStyle}>Moneda</label>
            <select
              style={inputStyle}
              value={form.goal_currency}
              onChange={(e) => setForm({ ...form, goal_currency: e.target.value })}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Métrica de seguimiento">
        <label style={labelStyle}>¿Qué cuenta como avance hacia la meta?</label>
        <select
          style={inputStyle}
          value={form.monthly_goal_metric}
          onChange={(e) => setForm({ ...form, monthly_goal_metric: e.target.value })}
        >
          <option value="invoices">Facturas timbradas (CFDI emitidos)</option>
          <option value="quotes_accepted">Cotizaciones aceptadas</option>
          <option value="orders">Pedidos confirmados</option>
          <option value="payments_received">Pagos recibidos (cobranza)</option>
        </select>
        <Hint>El dashboard mostrará el progreso vs. esta meta usando la métrica elegida.</Hint>
      </Section>
    </SettingDrawer>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HELPERS DE UI
// ════════════════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <h3
        style={{
          fontSize:      "12px",
          fontWeight:    700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color:         "var(--fg-muted, #64748b)",
          margin:        "0 0 12px",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--fg-muted, #64748b)", lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function DrawerFooter({ saving, onCancel, onSave }: { saving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <>
      <button onClick={onCancel} disabled={saving} style={btnSecondary}>Cancelar</button>
      <button onClick={onSave}   disabled={saving} style={btnPrimary}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </>
  );
}

// ── Estilos compartidos ────────────────────────────────────────────────
const labelStyle = {
  display:       "block",
  fontSize:      "12px",
  fontWeight:    600,
  color:         "var(--fg-muted, #64748b)",
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
  marginBottom:  "6px",
};

const inputStyle = {
  width:        "100%",
  padding:      "10px 12px",
  fontSize:     "14px",
  borderRadius: "8px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "var(--bg-input, #ffffff)",
  color:        "var(--fg, #0f172a)",
  fontFamily:   "inherit",
  outline:      "none",
};

const tokenChipStyle = {
  padding:      "4px 10px",
  fontSize:     "12px",
  fontFamily:   "ui-monospace, 'SF Mono', Menlo, monospace",
  fontWeight:   500,
  borderRadius: "6px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "var(--surface-soft, rgba(148,163,184,0.06))",
  color:        "var(--fg, #0f172a)",
  cursor:       "pointer",
};

const previewBoxStyle = {
  padding:      "14px 16px",
  borderRadius: "10px",
  background:   "rgba(37,99,235,0.06)",
  border:       "1px dashed rgba(37,99,235,0.25)",
};

const previewLabelStyle = {
  fontSize:      "10px",
  fontWeight:    700,
  letterSpacing: "0.08em",
  color:         "#1d4ed8",
  textTransform: "uppercase" as const,
  marginBottom:  "4px",
};

const previewValueStyle = {
  fontSize:    "18px",
  fontFamily:  "ui-monospace, 'SF Mono', Menlo, monospace",
  fontWeight:  600,
  color:       "var(--fg, #0f172a)",
};

const btnPrimary = {
  padding:      "9px 18px",
  fontSize:     "13px",
  fontWeight:   600,
  borderRadius: "8px",
  border:       "none",
  background:   "var(--accent, #2563eb)",
  color:        "#ffffff",
  cursor:       "pointer",
};

const btnSecondary = {
  padding:      "9px 16px",
  fontSize:     "13px",
  fontWeight:   500,
  borderRadius: "8px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "transparent",
  color:        "var(--fg, #0f172a)",
  cursor:       "pointer",
};