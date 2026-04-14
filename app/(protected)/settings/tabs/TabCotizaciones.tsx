"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchCompanySettings, upsertCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import type { CompanySettings } from "@/app/(protected)/comercial/cotizaciones/types/quotations.types";
import { supabase } from "@/lib/supabaseClient";

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
      <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
        {desc && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

const VARIABLES = [
  { var: "{AÑO}",     desc: "Año actual (ej: 2026)" },
  { var: "{MES}",     desc: "Mes actual (ej: 04)" },
  { var: "{NUM}",     desc: "Consecutivo (ej: 0001)" },
  { var: "{CLIENTE}", desc: "3 letras del cliente (ej: MOB)" },
  { var: "{TIPO}",    desc: "L=Logística, P=Productos" },
];

// ── TÉRMINOS POR DEFECTO ──────────────────────────────────────

const DEFAULT_TERMS_SERVICES = `TÉRMINOS Y CONDICIONES — SERVICIOS LOGÍSTICOS

PRECIOS Y MONEDA
1. Los precios están expresados en la moneda indicada (MXN/USD/EUR) y no incluyen I.V.A. (16%) salvo que se indique expresamente.
2. Los precios están sujetos a cambio sin previo aviso y son válidos únicamente durante el período de vigencia indicado.
3. El tipo de cambio aplicable para operaciones en moneda extranjera será el del día de la facturación.

SERVICIOS LOGÍSTICOS
4. Cotización válida únicamente para los conceptos, rutas y especificaciones indicadas. Conceptos adicionales se cotizarán por separado.
5. El traslado de mercancía en unidad dedicada será monitoreado vía satelital; si es consolidado, vía correo.
6. Los tiempos de tránsito son aproximados y están sujetos a cambios por causas de fuerza mayor, condiciones viales, climáticas o aduanales.
7. Servicio válido solo para carga general. No aplica para mercancía peligrosa salvo acuerdo escrito previo con documentación DGD/DGC.
8. Sin almacenamiento, sin maniobras en terminal, sin demoras, sin cargos de detención incluidos, salvo indicación expresa.
9. Recolección y/o entrega residencial no incluida. El camino en origen-destino y sitio final de descarga deben ser adecuados para el equipo asignado.
10. Sujeto a aceptación de la línea de envío y disponibilidad de equipo.
11. Despacho de aduana en origen y destino no incluido salvo indicación expresa. Aranceles, impuestos y gastos aduanales corren por cuenta del cliente.
12. El costo del combustible puede variar en la fecha de envío.
13. Aplica para mercancía estibable sin sobredimensión ni sobrepeso, salvo acuerdo previo.
14. Viaje en falso se cobrará al 75% del monto cotizado.
15. La maniobra debe contar con 2 hrs de carga y 2 hrs de descarga; de lo contrario empezarán a contar demoras cobradas por hora.
16. Con solicitud de unidad con 24 hrs. anticipadas al día del servicio.
17. La cotización por despacho aduanal no incluye rectificaciones, reconocimiento aduanero, multas, almacenajes ni servicios extraordinarios derivados de falta de instrucciones claras o información incorrecta.
18. Las marcas y números son responsabilidad del remitente. Todos los paquetes deben estar correctamente marcados.

SEGURO Y RESPONSABILIDADES
19. El seguro de la mercancía y sus maniobras de carga y descarga van por cuenta del cliente, quien cubrirá todo tipo de riesgo liberando de cualquier responsabilidad al prestador del servicio (derogando y subrogando derechos, sujeto a la Ley de Caminos, Puentes y Autotransporte Federal). Sin embargo, podemos cubrir estos riesgos si se contrata un seguro por escrito que se cotizará aparte.
20. Para embarques de Mercancías Peligrosas, es responsabilidad del embarcador cumplir con las regulaciones internacionales (DGD y DGC en español e inglés, debidamente llenados). El prestador no es responsable por omisión o información incorrecta.
21. La responsabilidad del prestador queda limitada a los términos del contrato de transporte involucrado; nunca excederá la responsabilidad del transportista (línea aérea, naviera o transporte terrestre por carretera o ferrocarril).
22. El prestador es ajeno a multas, daños y cargos adicionales por omisiones o etiquetado incorrecto del embarcador.
23. La presente cotización ampara únicamente los conceptos indicados. Si usted no recibió lo solicitado, revise con su ejecutivo los cargos faltantes o conceptos adicionales.

CONDICIONES DE PAGO
24. Condiciones de pago: las pactadas con el cliente.
25. Precios sujetos a confirmación por escrito del cliente dentro del período de vigencia.

ACUERDO NEGOCIADO DE TARIFA (NRA)
La presente propuesta constituye una oferta para un Acuerdo Negociado de Tarifa confidencial (NRA). Para aceptarlo deberá: (1) enviar un correo electrónico especificando la misma y declarar que está de acuerdo con la oferta; o (2) firmar donde se indique y enviar al remitente la aceptación de la oferta.

Firma: _______________________
Fecha: ____/____/________ (dd/mm/aaaa)

Agradecemos su preferencia y quedamos a sus apreciables órdenes.`;

const DEFAULT_TERMS_SERVICES_EN = `TERMS AND CONDITIONS — LOGISTICS SERVICES

PRICES AND CURRENCY
1. Prices are expressed in the indicated currency (MXN/USD/EUR) and do not include VAT (16%) unless expressly stated.
2. Prices are subject to change without prior notice and are valid only during the indicated validity period.
3. The applicable exchange rate for foreign currency transactions will be the rate on the invoicing date.

LOGISTICS SERVICES
4. Quotation valid only for the concepts, routes and specifications indicated. Additional concepts will be quoted separately.
5. Cargo in dedicated units will be monitored via satellite; if consolidated, via email.
6. Transit times are approximate and subject to change due to force majeure, road, weather or customs conditions.
7. Valid only for general cargo. Does not apply to hazardous materials unless prior written agreement with DGD/DGC documentation.
8. No warehousing, no terminal handling, no delays, no detention charges included, unless expressly indicated.
9. Residential pickup and/or delivery not included. The road at origin-destination and final delivery site must be suitable for the assigned equipment.
10. Subject to acceptance of the shipping line and equipment availability.
11. Customs clearance at origin and destination not included unless expressly indicated. Tariffs, taxes and customs expenses are at the client's expense.
12. Fuel cost may vary on the shipping date.
13. Applies to stackable cargo without overdimension or overweight, unless prior agreement.
14. Unsuccessful pickup will be charged at 75% of the quoted amount.
15. Loading/unloading time is 2 hours each; beyond that, detention charges apply per hour.
16. Unit must be requested 24 hours in advance.
17. Customs brokerage quotation does not include corrections, customs examination, fines, storage or extraordinary services derived from unclear instructions or incorrect information.
18. Marks and numbers are the shipper's responsibility. All packages must be correctly marked.

INSURANCE AND LIABILITY
19. Cargo insurance and handling operations are at the client's expense. The client assumes all risk, releasing the service provider from any liability (waiving and subrogating rights, subject to applicable law). Insurance can be arranged upon written request and will be quoted separately.
20. For Hazardous Materials shipments, the shipper is responsible for compliance with international regulations (DGD and DGC in Spanish and English, duly completed). The provider is not responsible for omissions or incorrect information.
21. The provider's liability is limited to the terms of the transport contract; it will never exceed the carrier's liability (airline, shipping line, road or rail transport).
22. The provider is not liable for fines, damages or additional charges due to the shipper's omissions or incorrect labeling.
23. This quotation covers only the concepts indicated. If you did not receive what was requested, please review missing charges with your account executive.

PAYMENT CONDITIONS
24. Payment terms: as agreed with the client.
25. Prices subject to written confirmation by the client within the validity period.

NEGOTIATED RATE AGREEMENT (NRA)
This proposal constitutes an offer for a confidential Negotiated Rate Agreement (NRA). To accept it you must: (1) send an email specifying the same and declare that you agree with the offer; or (2) sign where indicated and send the sender the acceptance of the offer.

Signature: _______________________
Date: ____/____/________ (mm/dd/yyyy)

We appreciate your business and remain at your service.`;

const DEFAULT_TERMS_PRODUCTS = `TÉRMINOS Y CONDICIONES — PRODUCTOS

PRECIOS Y MONEDA
1. Los precios están expresados en la moneda indicada (MXN/USD/EUR) y no incluyen I.V.A. (16%) salvo que se indique expresamente.
2. Los precios están sujetos a cambio sin previo aviso y son válidos únicamente durante el período de vigencia indicado.
3. Las cantidades, unidades, descripciones y SKUs son los especificados en el detalle de la cotización.

PRODUCTOS
4. Las imágenes, muestras y especificaciones técnicas son referenciales; el vendedor se reserva el derecho de realizar mejoras sin previo aviso.
5. El embalaje y etiquetado de la mercancía es responsabilidad del comprador una vez entregada en punto de origen, salvo acuerdo expreso.
6. Las marcas, números y referencias de los bultos son responsabilidad del destinatario; todos los paquetes deben estar correctamente marcados.
7. No se incluyen maniobras de carga y descarga salvo que se especifique expresamente en la cotización.
8. Aplica para mercancía conforme a las especificaciones indicadas. Variaciones en medidas, calibre, color o material quedan sujetas a confirmación previa.

ENTREGA Y LOGÍSTICA
9. Los tiempos de entrega son aproximados y pueden variar por condiciones de producción, inventario o logística.
10. El flete y envío no están incluidos en el precio salvo indicación expresa. Se cotizarán por separado según destino y método de envío.
11. Despacho de aduana, aranceles e impuestos de importación/exportación corren por cuenta del comprador salvo acuerdo en contrario.
12. Los riesgos de pérdida o daño de la mercancía se transfieren al comprador en el momento de la entrega en el punto acordado.

SEGURO Y RESPONSABILIDADES
13. El seguro de la mercancía en tránsito es responsabilidad del comprador. El vendedor no asume responsabilidad por pérdidas o daños durante el transporte salvo acuerdo escrito previo.
14. La responsabilidad del vendedor se limita al valor de la mercancía facturada. No aplica para daños indirectos, lucro cesante o perjuicios derivados.
15. Garantías, devoluciones y reclamaciones se rigen según las políticas comerciales acordadas por escrito.

CONDICIONES DE PAGO
16. Condiciones de pago: las pactadas con el cliente.
17. El pedido se confirma con el anticipo o la orden de compra firmada, según lo acordado.
18. Precios sujetos a confirmación por escrito del cliente dentro del período de vigencia.
19. En caso de cancelación posterior a la confirmación, se aplicarán cargos según las políticas vigentes.

ACEPTACIÓN
La aceptación de esta cotización implica el conocimiento y aceptación de los presentes términos y condiciones.

Firma: _______________________
Fecha: ____/____/________ (dd/mm/aaaa)

Agradecemos su preferencia y quedamos a sus apreciables órdenes.`;

const DEFAULT_TERMS_PRODUCTS_EN = `TERMS AND CONDITIONS — PRODUCTS

PRICES AND CURRENCY
1. Prices are expressed in the indicated currency (MXN/USD/EUR) and do not include VAT (16%) unless expressly stated.
2. Prices are subject to change without prior notice and are valid only during the indicated validity period.
3. Quantities, units, descriptions and SKUs are as specified in the quotation detail.

PRODUCTS
4. Images, samples and technical specifications are for reference only; the seller reserves the right to make improvements without prior notice.
5. Packaging and labeling of merchandise is the buyer's responsibility once delivered at origin, unless otherwise agreed.
6. Marks, numbers and references on packages are the recipient's responsibility; all packages must be correctly marked.
7. Loading and unloading operations are not included unless expressly specified in the quotation.
8. Applies to merchandise per the specifications indicated. Variations in dimensions, gauge, color or material are subject to prior confirmation.

DELIVERY AND LOGISTICS
9. Delivery times are approximate and may vary due to production, inventory or logistics conditions.
10. Freight and shipping are not included in the price unless expressly indicated. These will be quoted separately based on destination and shipping method.
11. Customs clearance, tariffs and import/export taxes are at the buyer's expense unless otherwise agreed.
12. Risk of loss or damage to the merchandise transfers to the buyer at the time of delivery at the agreed point.

INSURANCE AND LIABILITY
13. Cargo insurance during transit is the buyer's responsibility. The seller assumes no liability for loss or damage during transport unless prior written agreement.
14. The seller's liability is limited to the value of the invoiced merchandise. Indirect damages, lost profits or consequential damages do not apply.
15. Warranties, returns and claims are governed by the commercial policies agreed in writing.

PAYMENT CONDITIONS
16. Payment terms: as agreed with the client.
17. The order is confirmed with the advance payment or signed purchase order, as agreed.
18. Prices subject to written confirmation by the client within the validity period.
19. In case of cancellation after confirmation, charges will apply per current policies.

ACCEPTANCE
Acceptance of this quotation implies knowledge and acceptance of these terms and conditions.

Signature: _______________________
Date: ____/____/________ (mm/dd/yyyy)

We appreciate your business and remain at your service.`;

export default function TabCotizaciones() {
  const { t, lang } = useTranslation();
  const { companyId } = useTenant();

  const [form, setForm] = useState<Partial<CompanySettings>>({
    quote_number_format:   "COT-{AÑO}-{NUM}",
    quote_number_counter:  1,
    quote_validity_days:   15,
    margin_minimum_pct:    20,
    template_products:     "elegante",
    template_services:     "elegante",
    quote_terms_services:  "",
    quote_terms_products:  "",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [termsTab, setTermsTab] = useState<"services" | "products">("services");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (s) {
        setForm((p) => ({
          ...p, ...s,
          // Precargar términos por defecto si no existen
          quote_terms_services: s.quote_terms_services || (lang === "en" ? DEFAULT_TERMS_SERVICES_EN : DEFAULT_TERMS_SERVICES),
          quote_terms_products: s.quote_terms_products || (lang === "en" ? DEFAULT_TERMS_PRODUCTS_EN : DEFAULT_TERMS_PRODUCTS),
        }));
      } else {
        setForm((p) => ({
          ...p,
          quote_terms_services: lang === "en" ? DEFAULT_TERMS_SERVICES_EN : DEFAULT_TERMS_SERVICES,
          quote_terms_products: lang === "en" ? DEFAULT_TERMS_PRODUCTS_EN : DEFAULT_TERMS_PRODUCTS,
        }));
      }
    });
  }, [companyId, lang]);

useEffect(() => {
  if (!companyId) return;
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;
    supabase
      .from("company_users")
      .select("role")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === "admin" || data?.role === "owner"));
  });
}, [companyId]);
  
  function set(k: keyof CompanySettings, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  const previewNumber = () => {
    const now = new Date();
    return (form.quote_number_format ?? "COT-{AÑO}-{NUM}")
      .replace("{AÑO}",    String(now.getFullYear()))
      .replace("{MES}",    String(now.getMonth() + 1).padStart(2, "0"))
      .replace("{NUM}",    String(form.quote_number_counter ?? 1).padStart(4, "0"))
      .replace("{CLIENTE}","MOB")
      .replace("{TIPO}",   "L");
  };

  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      await upsertCompanySettings(companyId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function resetTerms() {
    if (termsTab === "services") {
      set("quote_terms_services", lang === "en" ? DEFAULT_TERMS_SERVICES_EN : DEFAULT_TERMS_SERVICES);
    } else {
      set("quote_terms_products", lang === "en" ? DEFAULT_TERMS_PRODUCTS_EN : DEFAULT_TERMS_PRODUCTS);
    }
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabCotizaciones ?? "Configuración de cotizaciones"}
      </div>

      {/* CONSECUTIVO */}
      <Section
        title={(t.settings as any)?.consecutivoTitle ?? "Formato de numeración"}
        desc={(t.settings as any)?.consecutivoDesc ?? "Define cómo se generan los números de cotización."}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Formato
          </div>
          <input
            value={form.quote_number_format ?? ""}
            onChange={(e) => set("quote_number_format", e.target.value)}
            placeholder="COT-{AÑO}-{NUM}"
            style={INPUT}
          />
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {VARIABLES.map((v) => (
            <button key={v.var} onClick={() => set("quote_number_format", (form.quote_number_format ?? "") + v.var)} title={v.desc} style={{
              height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {v.var}
            </button>
          ))}
        </div>

        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)" }}>
          <div style={{ fontSize: "11px", color: "var(--color-info-text)", marginBottom: "3px" }}>Vista previa:</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
            {previewNumber()}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Próximo número
            </div>
            <input type="number" value={form.quote_number_counter ?? 1} onChange={(e) => set("quote_number_counter", Number(e.target.value))} min="1" style={INPUT} />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Vigencia por defecto (días)
            </div>
            <input type="number" value={form.quote_validity_days ?? 15} onChange={(e) => set("quote_validity_days", Number(e.target.value))} min="1" style={INPUT} />
          </div>
        </div>
      </Section>

      {/* MARGEN MÍNIMO */}
      <Section
        title={(t.settings as any)?.marginTitle ?? "Margen mínimo"}
        desc={(t.settings as any)?.marginDesc ?? "El sistema alerta si el margen de ganancia es menor a este porcentaje."}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="number"
            value={form.margin_minimum_pct ?? 20}
            onChange={(e) => set("margin_minimum_pct", Number(e.target.value))}
            min="0" max="100"
            style={{ ...INPUT, width: "100px" }}
          />
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>% de margen mínimo</span>
        </div>
      </Section>

      {/* TÉRMINOS Y CONDICIONES */}
      <Section
        title={(t.settings as any)?.defaultTermsTitle ?? "Términos y condiciones por defecto"}
        desc={(t.settings as any)?.defaultTermsDesc ?? "Se auto-rellenan al crear cotizaciones según el tipo seleccionado. Puedes editar cada versión de forma independiente."}
      >
        {/* TAB SELECTOR */}
        <div style={{ display: "flex", gap: "3px", background: "var(--color-bg-subtle)", padding: "3px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", alignSelf: "start" }}>
          {([
            { key: "services", label: "Servicios logísticos", icon: "🚛" },
            { key: "products", label: "Productos",            icon: "📦" },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setTermsTab(tab.key)} style={{
              height: "30px", padding: "0 14px", borderRadius: "var(--radius-sm)",
              background: termsTab === tab.key ? "var(--color-bg-base)" : "transparent",
              border: termsTab === tab.key ? "1px solid var(--color-border)" : "1px solid transparent",
              color: termsTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: "12px", fontWeight: termsTab === tab.key ? 700 : 400,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
              boxShadow: termsTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              transition: "var(--transition-fast)",
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* INFO */}
        <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.5 }}>
          {termsTab === "services"
            ? "Estos términos aparecen automáticamente en cotizaciones de tipo Servicios Logísticos."
            : "Estos términos aparecen automáticamente en cotizaciones de tipo Productos."
          }
        </div>

        {/* TEXTAREA */}
        <textarea
          key={termsTab}
          rows={20}
          value={termsTab === "services" ? (form.quote_terms_services ?? "") : (form.quote_terms_products ?? "")}
          onChange={(e) => set(
            termsTab === "services" ? "quote_terms_services" : "quote_terms_products",
            e.target.value
          )}
          style={{ ...INPUT, height: "auto", padding: "12px", resize: "vertical", fontFamily: "monospace", fontSize: "11px", lineHeight: 1.6 }}
        />

        {/* RESET */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={resetTerms} style={{
            height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)",
            background: "transparent", border: "1px solid var(--color-border)",
            color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer",
          }}>
            ↺ Restaurar términos por defecto ({termsTab === "services" ? "servicios" : "productos"})
          </button>
        </div>
      </Section>

{/* ── FOLIO POR TIPO DE CFDI ── */}
<Section
  title="Numeración de documentos fiscales y no fiscales"
  desc="Configura la serie y el folio inicial para cada tipo de CFDI. Las facturas estándar, con Carta Porte y Comercio Exterior comparten el mismo folio por ser todas Tipo I."
>
  {/* Solo admin */}
  {!isAdmin && (
    <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)" }}>
      Solo administradores y propietarios pueden modificar la numeración de documentos.
    </div>
  )}

  <div style={{ display: "grid", gap: "12px" }}>
    {([
      {
        key: "ingreso",   labelEs: "Facturas de Ingreso (Tipo I)",        labelEn: "Income Invoices (Type I)",
        desc: "Incluye Facturas estándar, Carta Porte y Comercio Exterior",
        seriesKey: "invoice_series",   folioKey: "invoice_next_folio",
        color: "var(--color-success-text)", bg: "var(--color-success-bg)",
      },
      {
        key: "egreso",    labelEs: "Notas de Crédito (Tipo E)",           labelEn: "Credit Notes (Type E)",
        desc: "Devoluciones, descuentos y bonificaciones",
        seriesKey: "egreso_series",    folioKey: "egreso_next_folio",
        color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",
      },
      {
        key: "pago",      labelEs: "Complementos de Pago (Tipo P)",       labelEn: "Payment Complements (Type P)",
        desc: "Recibos electrónicos de pago (REP)",
        seriesKey: "pago_series",      folioKey: "pago_next_folio",
        color: "var(--color-brand-blue)", bg: "var(--color-info-bg)",
      },
      {
        key: "traslado",  labelEs: "Traslados (Tipo T)",                  labelEn: "Transfers (Type T)",
        desc: "Movimiento de mercancías sin transacción comercial",
        seriesKey: "traslado_series",  folioKey: "traslado_next_folio",
        color: "var(--color-text-second)", bg: "var(--color-bg-subtle)",
      },
      {
        key: "nomina",    labelEs: "Nómina (Tipo N)",                     labelEn: "Payroll (Type N)",
        desc: "Recibos de nómina de empleados",
        seriesKey: "nomina_series",    folioKey: "nomina_next_folio",
        color: "#7c3aed", bg: "#ede9fe",
      },
      {
        key: "notas",     labelEs: "Notas sin valor fiscal",              labelEn: "Non-fiscal notes",
        desc: "Remisiones, recibos de honorarios, presupuestos informales",
        seriesKey: "note_series",      folioKey: "note_next_folio",
        color: "var(--color-text-muted)", bg: "var(--color-bg-subtle)",
      },
    ] as const).map((item) => (
      <div key={item.key} style={{ display: "grid", gridTemplateColumns: "1fr 120px 140px 120px", gap: "10px", alignItems: "center", padding: "12px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", opacity: isAdmin ? 1 : 0.6 }}>
        {/* Label */}
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{lang === "en" ? item.labelEn : item.labelEs}</div>
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{item.desc}</div>
        </div>

        {/* Tipo badge */}
        <div>
          <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: item.bg, color: item.color }}>
            {item.key === "ingreso" ? "Tipo I" : item.key === "egreso" ? "Tipo E" : item.key === "pago" ? "Tipo P" : item.key === "traslado" ? "Tipo T" : item.key === "nomina" ? "Tipo N" : "No fiscal"}
          </span>
        </div>

        {/* Serie */}
        <div>
          <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Serie</div>
          <input
            disabled={!isAdmin}
            value={String((form as any)[item.seriesKey] ?? (item.key === "ingreso" ? "A" : item.key === "notas" ? "NR" : item.key.charAt(0).toUpperCase()))}
            onChange={(e) => isAdmin && set(item.seriesKey as any, e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
            maxLength={10}
            style={{ ...INPUT, height: "32px", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, opacity: isAdmin ? 1 : 0.5 }}
          />
        </div>

        {/* Folio */}
        <div>
          <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Próximo folio</div>
          <input
            type="number"
            min="1"
            disabled={!isAdmin}
            value={Number((form as any)[item.folioKey] ?? 1)}
            onChange={(e) => isAdmin && set(item.folioKey as any, Number(e.target.value))}
            style={{ ...INPUT, height: "32px", fontSize: "12px", fontVariantNumeric: "tabular-nums", opacity: isAdmin ? 1 : 0.5 }}
          />
        </div>
      </div>
    ))}
  </div>

  {/* Preview */}
  <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)" }}>
    <div style={{ fontSize: "11px", color: "var(--color-info-text)", marginBottom: "6px" }}>Vista previa del próximo folio por tipo:</div>
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
      {[
        { label: "Factura",    s: "invoice_series",  f: "invoice_next_folio",  def: "A"  },
        { label: "N.Crédito",  s: "egreso_series",   f: "egreso_next_folio",   def: "E"  },
        { label: "REP",        s: "pago_series",     f: "pago_next_folio",     def: "P"  },
        { label: "Traslado",   s: "traslado_series", f: "traslado_next_folio", def: "T"  },
        { label: "Nómina",     s: "nomina_series",   f: "nomina_next_folio",   def: "N"  },
        { label: "Nota",       s: "note_series",     f: "note_next_folio",     def: "NR" },
      ].map((p) => (
        <div key={p.label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: "9px", color: "var(--color-info-text)", marginBottom: "2px" }}>{p.label}</div>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-brand-blue)", fontFamily: "monospace" }}>
            {String((form as any)[p.s] ?? p.def)}-{String(Number((form as any)[p.f] ?? 1)).padStart(4, "0")}
          </div>
        </div>
      ))}
    </div>
  </div>

  <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
    El folio se incrementa automáticamente con cada documento timbrado. Si ya tienes documentos previos en otro sistema, ajusta el número para continuar el consecutivo sin duplicados.
  </div>
</Section>
      
      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
          {error}
        </div>
      )}

      <div>
        <button onClick={handleSave} disabled={saving} style={{
          height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)",
          background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
          color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer",
        }}>
          {saving ? t.general.loading : saved ? "✓ Guardado" : t.general.save}
        </button>
      </div>
    </div>
  );
}
