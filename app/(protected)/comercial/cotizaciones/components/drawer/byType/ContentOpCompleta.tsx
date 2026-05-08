"use client";
import { useState, useEffect } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { CURRENCIES, INCOTERMS, CONTAINER_TYPES, TRUCK_TYPES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type ModalidadAduana  = "impo" | "expo";
type TipoTransporte   = "fcl" | "lcl" | "ltl" | "ftl" | "aereo_carga" | "courier";

type Contenedor = { tipo: string; cantidad: number };
type Bulto      = { largo_cm: string; ancho_cm: string; alto_cm: string; peso_kg: string; cantidad: string };
type Ruta       = { origen: string; destino: string; incoterm: string };

export interface OpCompletaInfo {
  modalidad:             ModalidadAduana;
  tipo_transporte:       TipoTransporte;
  // Flete común
  mercancia:             string;
  valor_comercial:       string;
  valor_moneda:          string;
  peso_kg:               string;
  incoterm:              string;
  // FCL
  contenedores:          Contenedor[];
  // LCL
  bultos:                Bulto[];
  // LTL / FTL
  rutas:                 Ruta[];
  tipo_unidad:           string;
  cantidad_unidades:     string;
  largo_cm:              string;
  ancho_cm:              string;
  alto_cm:               string;
  piezas:                string;
  // Aéreo
  aeropuerto_origen:     string;
  aeropuerto_destino:    string;
  carrier:               string;
  // Puerto (Marítimo)
  puerto_origen:         string;
  puerto_destino:        string;
  // Aduanal común
  fraccion_arancelaria:  string;
  descripcion_mercancia: string;
  pais:                  string;
  aduana:                string;
  clave_aduana:          string;
  tipo_aduana:           string;
  // Impo
  moneda_factura:        string;
  tipo_cambio:           string;
  flete_origen:          string;
  seguro:                string;
  otros_incrementables:  string;
  arancel_pct:           string;
  prevalidacion:         string;
  // Expo
  requiere_cert_origen:  boolean;
  tipo_cert_origen:      string;
  requiere_permiso_expo: boolean;
}

export const EMPTY_OP_COMPLETA_INFO = (): OpCompletaInfo => ({
  modalidad:             "impo",
  tipo_transporte:       "fcl",
  mercancia:             "",
  valor_comercial:       "",
  valor_moneda:          "USD",
  peso_kg:               "",
  incoterm:              "",
  contenedores:          [{ tipo: "40'HC", cantidad: 1 }],
  bultos:                [],
  rutas:                 [{ origen: "", destino: "", incoterm: "" }],
  tipo_unidad:           "",
  cantidad_unidades:     "1",
  largo_cm:              "",
  ancho_cm:              "",
  alto_cm:               "",
  piezas:                "",
  aeropuerto_origen:     "",
  aeropuerto_destino:    "",
  carrier:               "",
  puerto_origen:         "",
  puerto_destino:        "",
  fraccion_arancelaria:  "",
  descripcion_mercancia: "",
  pais:                  "",
  aduana:                "",
  clave_aduana:          "",
  tipo_aduana:           "",
  moneda_factura:        "USD",
  tipo_cambio:           "17",
  flete_origen:          "",
  seguro:                "",
  otros_incrementables:  "",
  arancel_pct:           "0",
  prevalidacion:         "309",
  requiere_cert_origen:  false,
  tipo_cert_origen:      "",
  requiere_permiso_expo: false,
});

// Unidades por tipo de transporte
const UNITS_BY_TRANSPORT: Record<TipoTransporte, string[]> = {
  fcl:        ["Por contenedor","Por BL","Por embarque","Por pedimento","Por factura","Por servicio","Otro"],
  lcl:        ["Por W/M","Por CBM","Por tonelada","Por BL","Por pedimento","Por factura","Por servicio","Otro"],
  ltl:        ["Por envío","Por kg","Por tonelada","Por m³","Por pieza","Por ruta","Por pedimento","Por factura","Por servicio","Otro"],
  ftl:        ["Por unidad","Por viaje","Por ruta","Por pedimento","Por factura","Por servicio","Otro"],
  aereo_carga:["Por kg cobrable","Por kg real","Por kg dimensional","Por AWB","Por pedimento","Por factura","Por embarque","Por servicio","Otro"],
  courier:    ["Por kg cobrable","Por paquete","Por guía","Por pedimento","Por factura","Por servicio","Otro"],
};

const CARRIERS_AEREO   = ["DHL","FedEx","UPS","Estafeta","Aeromexico Cargo","Lufthansa Cargo","Otro"];
const CARRIERS_COURIER = ["DHL Express","FedEx Express","UPS Express","Estafeta Internacional","Otro"];
const CERT_ORIGEN_TIPOS = ["T-MEC / USMCA","Certificado de Origen EUR.1","Form A (SGP)","Declaración de Origen","Certificado TLCUE","Otro"];
const ADUANA_GROUPS     = ["fronteriza","interna","maritima","aeropuerto"];

type Props = {
  info:               OpCompletaInfo;
  setInfo:            React.Dispatch<React.SetStateAction<OpCompletaInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentOpCompleta({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [aduanas,       setAduanas]       = useState<any[]>([]);

  useEffect(() => {
    import("@/lib/supabaseClient").then(({ supabase }) => {
      supabase.from("customs_offices").select("*").order("type").order("name")
        .then(({ data }) => setAduanas(data ?? []));
    });
  }, []);

  // Actualizar unit_label default al cambiar tipo de transporte
  useEffect(() => {
    setLineForm(p => ({ ...p, unit_label: UNITS_BY_TRANSPORT[info.tipo_transporte][0] }));
  }, [info.tipo_transporte]);

  // ── Cálculos LCL ──
  const cbmTotal  = info.bultos.reduce((s, b) => s + (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm) / 1_000_000) * Number(b.cantidad || 1), 0);
  const pesoTotalLCL = info.bultos.reduce((s, b) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
  const wmTotal   = Math.max(cbmTotal, pesoTotalLCL / 1000);

  // ── Cálculos LTL ──
  const volLTL = (info.largo_cm && info.ancho_cm && info.alto_cm)
    ? (Number(info.largo_cm) * Number(info.ancho_cm) * Number(info.alto_cm)) / 1_000_000 : null;
  const volTotalLTL = volLTL && info.piezas && Number(info.piezas) > 1 ? volLTL * Number(info.piezas) : volLTL;

  // ── Cálculos Aéreo ──
  const divisorAereo = info.tipo_transporte === "courier" ? 5000 : 6000;
  const pesoReal        = info.bultos.reduce((s, b) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
  const pesoDimensional = info.bultos.reduce((s, b) => {
    const vol = (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm)) / divisorAereo;
    return s + vol * Number(b.cantidad || 1);
  }, 0);
  const pesoCobrable = Math.max(pesoReal, pesoDimensional);

  // ── Cálculos Impo ──
  const valorFacturaMXN  = Number(info.valor_comercial || 0) * Number(info.tipo_cambio || 1);
  const totalIncremMXN   = Number(info.flete_origen || 0) + Number(info.seguro || 0) + Number(info.otros_incrementables || 0);
  const valorAduana      = valorFacturaMXN + totalIncremMXN;
  const igi              = valorAduana * (Number(info.arancel_pct || 0) / 100);
  const dta              = valorAduana > 0 ? Math.min(Math.max(valorAduana * 0.00176, 890), 1008) : 0;
  const prevalidacion    = Number(info.prevalidacion || 0);
  const ivaPrevalidacion = prevalidacion * 0.16;
  const ivaImportacion   = (valorAduana + igi + dta + prevalidacion) * 0.16;
  const totalImpuestos   = igi + dta + prevalidacion + ivaPrevalidacion + ivaImportacion;

  const totalContenedores = info.contenedores.reduce((s, c) => s + c.cantidad, 0);
  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function handleAduanaChange(id: string) {
    const a = aduanas.find(x => x.id === id);
    if (a) setInfo(p => ({ ...p, aduana: a.name, clave_aduana: a.clave_sat, tipo_aduana: a.type }));
  }

  function startEditLine(ci: number, li: number) {
    const line = billingConcepts[ci].lines[li] as any;
    setLineForm({
      description: line.description ?? "",
      quantity:    String(line.quantity  ?? ""),
      unit_label:  line.unit_label   ?? UNITS_BY_TRANSPORT[info.tipo_transporte][0],
      unit_price:  String(line.unit_price ?? ""),
      currency:    line.currency     ?? "USD",
      tax_rate:    line.tax_rate     ?? 0,
      notes:       line.notes        ?? "",
    });
    setEditingLine(li);
    setBillingConcepts(p => p.map((c, i) => i === ci
      ? { ...c, lines: c.lines.filter((_, j) => j !== li) }
      : c
    ));
  }

  function addLine(ci: number) {
    if (!lineForm.description.trim() || !lineForm.unit_price || !lineForm.quantity) return;
    setBillingConcepts(p => p.map((c, i) => i === ci ? {
      ...c, lines: [...c.lines, {
        service_type: "op_completa" as any,
        description:  lineForm.description,
        currency:     lineForm.currency,
        price:        autoTotal,
        quantity:     Number(lineForm.quantity),
        unit_price:   Number(lineForm.unit_price),
        unit_label:   lineForm.unit_label || undefined,
        tax_rate:     lineForm.tax_rate,
        notes:        lineForm.notes || undefined,
      }],
    } : c));
    setLineForm(EMPTY_LINE(info.tipo_transporte));
    setEditingLine(null);
  }

  function createConcept() {
    if (!conceptForm.description.trim()) return;
    const tempId = Date.now().toString();
    setBillingConcepts(p => [...p, { tempId, product_id: conceptForm.product_id || undefined, description: conceptForm.description, currency: conceptForm.currency, lines: [] }]);
    setActiveConcept(tempId);
    setConceptForm({ product_id: "", description: "", currency: "USD" });
    setAddingConcept(false);
  }

  const TRANSPORT_OPTIONS: { value: TipoTransporte; label: string; desc: string }[] = [
    { value: "fcl",         label: "FCL",         desc: "Contenedor completo" },
    { value: "lcl",         label: "LCL",         desc: "Carga consolidada" },
    { value: "ltl",         label: "LTL",         desc: "Carga parcial terrestre" },
    { value: "ftl",         label: "FTL",         desc: "Carga completa terrestre" },
    { value: "aereo_carga", label: "Aéreo Carga", desc: "Carga aérea general" },
    { value: "courier",     label: "Courier",     desc: "Paquetería express" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── SELECTOR MODALIDAD ── */}
      <div>
        <SectionTitle>Modalidad aduanal</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {(["impo","expo"] as const).map(m => (
            <button key={m} onClick={() => setInfo(p => ({ ...p, modalidad: m }))}
              style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.modalidad === m ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.modalidad === m ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: info.modalidad === m ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>
                {m === "impo" ? "🔻 Importación" : "🔺 Exportación"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {m === "impo" ? "Entrada de mercancía a México" : "Salida de mercancía de México"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── SELECTOR TIPO DE TRANSPORTE ── */}
      <div>
        <SectionTitle>Tipo de transporte de la carga</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
          {TRANSPORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setInfo(p => ({ ...p, tipo_transporte: opt.value }))}
              style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.tipo_transporte === opt.value ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.tipo_transporte === opt.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: info.tipo_transporte === opt.value ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{opt.label}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════ SECCIÓN FLETE ══════════════ */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--color-info-bg)", borderBottom: "1px solid var(--color-info-border)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-info-text)" }}>
            🚛 Información de Flete — {TRANSPORT_OPTIONS.find(o => o.value === info.tipo_transporte)?.label}
          </span>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* PUERTOS — Marítimo */}
          {(info.tipo_transporte === "fcl" || info.tipo_transporte === "lcl") && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Puertos</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Puerto de origen *">
                  <input value={info.puerto_origen} onChange={e => setInfo(p => ({ ...p, puerto_origen: e.target.value }))} placeholder="Shanghai, China" style={INPUT} />
                </Field>
                <Field label="Puerto de destino *">
                  <input value={info.puerto_destino} onChange={e => setInfo(p => ({ ...p, puerto_destino: e.target.value }))} placeholder="Manzanillo, México" style={INPUT} />
                </Field>
                <Field label="Incoterm">
                  <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                    <option value="">—</option>
                    {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* RUTAS — Terrestre */}
          {(info.tipo_transporte === "ltl" || info.tipo_transporte === "ftl") && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Rutas</div>
              {info.rutas.map((ruta, i) => (
                <div key={i} style={{ padding: "10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Ruta {i + 1}</span>
                    {info.rutas.length > 1 && (
                      <button onClick={() => setInfo(p => ({ ...p, rutas: p.rutas.filter((_, j) => j !== i) }))}
                        style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                    )}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    <Field label="Origen *">
                      <input value={ruta.origen} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, origen: e.target.value } : r) }))} placeholder="Ciudad, Estado" style={INPUT} />
                    </Field>
                    <Field label="Destino *">
                      <input value={ruta.destino} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, destino: e.target.value } : r) }))} placeholder="Ciudad, Estado" style={INPUT} />
                    </Field>
                    <Field label="Incoterm">
                      <select value={ruta.incoterm} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, incoterm: e.target.value } : r) }))} style={SELECT}>
                        <option value="">—</option>
                        {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              ))}
              <button onClick={() => setInfo(p => ({ ...p, rutas: [...p.rutas, { origen: "", destino: "", incoterm: "" }] }))}
                style={{ height: "30px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "11px", color: "var(--color-text-muted)", cursor: "pointer", width: "100%" }}>
                + Agregar ruta
              </button>
            </div>
          )}

          {/* FTL: Tipo de unidad */}
          {info.tipo_transporte === "ftl" && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
              <Field label="Tipo de unidad *">
                <select value={info.tipo_unidad} onChange={e => setInfo(p => ({ ...p, tipo_unidad: e.target.value }))} style={SELECT}>
                  <option value="">— Seleccionar —</option>
                  {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Cantidad">
                <input type="number" min="1" value={info.cantidad_unidades} onChange={e => setInfo(p => ({ ...p, cantidad_unidades: e.target.value }))} style={INPUT} />
              </Field>
            </div>
          )}

          {/* AEROPUERTOS */}
          {(info.tipo_transporte === "aereo_carga" || info.tipo_transporte === "courier") && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                <Field label="Aeropuerto origen *">
                  <input value={info.aeropuerto_origen} onChange={e => setInfo(p => ({ ...p, aeropuerto_origen: e.target.value }))} placeholder="PVG — Shanghai" style={INPUT} />
                </Field>
                <Field label="Aeropuerto destino *">
                  <input value={info.aeropuerto_destino} onChange={e => setInfo(p => ({ ...p, aeropuerto_destino: e.target.value }))} placeholder="MEX — CDMX" style={INPUT} />
                </Field>
                <Field label="Carrier preferente">
                  <select value={info.carrier} onChange={e => setInfo(p => ({ ...p, carrier: e.target.value }))} style={SELECT}>
                    <option value="">— Sin preferencia —</option>
                    {(info.tipo_transporte === "courier" ? CARRIERS_COURIER : CARRIERS_AEREO).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* FCL: Contenedores */}
          {info.tipo_transporte === "fcl" && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Contenedores</div>
              {info.contenedores.map((cont, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", marginBottom: "6px", alignItems: "flex-end" }}>
                  <Field label={i === 0 ? "Tipo" : ""}>
                    <select value={cont.tipo} onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, tipo: e.target.value } : c) }))} style={SELECT}>
                      {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label={i === 0 ? "Cantidad" : ""}>
                    <input type="number" min="1" value={cont.cantidad} onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, cantidad: Number(e.target.value) } : c) }))} style={INPUT} />
                  </Field>
                  {info.contenedores.length > 1 && (
                    <button onClick={() => setInfo(p => ({ ...p, contenedores: p.contenedores.filter((_, j) => j !== i) }))}
                      style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer" }}>✕</button>
                  )}
                </div>
              ))}
              <button onClick={() => setInfo(p => ({ ...p, contenedores: [...p.contenedores, { tipo: "40'HC", cantidad: 1 }] }))}
                style={{ height: "30px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "11px", color: "var(--color-text-muted)", cursor: "pointer", width: "100%" }}>
                + Agregar tipo de contenedor
              </button>
              {totalContenedores > 0 && (
                <InfoBox type="info">Total: <strong>{totalContenedores} contenedor{totalContenedores !== 1 ? "es" : ""}</strong></InfoBox>
              )}
            </div>
          )}

          {/* LCL / Aéreo: Bultos */}
          {(info.tipo_transporte === "lcl" || info.tipo_transporte === "aereo_carga" || info.tipo_transporte === "courier") && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
                {info.tipo_transporte === "lcl" ? "Bultos / Partidas" : "Paquetes / Bultos"}
              </div>
              {info.bultos.map((bulto, i) => (
                <div key={i} style={{ padding: "8px 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", marginBottom: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)" }}>Bulto {i + 1}</span>
                    {info.bultos.length > 1 && <button onClick={() => setInfo(p => ({ ...p, bultos: p.bultos.filter((_, j) => j !== i) }))} style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "6px" }}>
                    {(["largo_cm","ancho_cm","alto_cm","peso_kg","cantidad"] as const).map(key => (
                      <Field key={key} label={key === "largo_cm" ? "L(cm)" : key === "ancho_cm" ? "A(cm)" : key === "alto_cm" ? "H(cm)" : key === "peso_kg" ? "Peso(kg)" : "Cant."}>
                        <input type="number" value={bulto[key]} min="0" onChange={e => setInfo(p => ({ ...p, bultos: p.bultos.map((b, j) => j === i ? { ...b, [key]: e.target.value } : b) }))} style={INPUT} />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => setInfo(p => ({ ...p, bultos: [...p.bultos, { largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" }] }))}
                style={{ height: "30px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "11px", color: "var(--color-text-muted)", cursor: "pointer", width: "100%" }}>
                + Agregar bulto
              </button>
              {/* Resumen cálculos */}
              {info.tipo_transporte === "lcl" && cbmTotal > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", marginTop: "6px" }}>
                  <div><div style={{ fontSize: "9px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>CBM Total</div><div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{cbmTotal.toFixed(3)} m³</div></div>
                  <div><div style={{ fontSize: "9px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Peso Total</div><div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoTotalLCL.toFixed(0)} kg</div></div>
                  <div><div style={{ fontSize: "9px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase" }}>W/M Cobrable</div><div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{wmTotal.toFixed(3)}</div></div>
                </div>
              )}
              {(info.tipo_transporte === "aereo_carga" || info.tipo_transporte === "courier") && pesoCobrable > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", marginTop: "6px" }}>
                  <div><div style={{ fontSize: "9px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Peso Real</div><div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoReal.toFixed(2)} kg</div></div>
                  <div><div style={{ fontSize: "9px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Peso Dimensional</div><div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoDimensional.toFixed(2)} kg<div style={{ fontSize: "8px", color: "var(--color-text-muted)" }}>÷{divisorAereo}</div></div></div>
                  <div><div style={{ fontSize: "9px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase" }}>Peso Cobrable</div><div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{pesoCobrable.toFixed(2)} kg</div></div>
                </div>
              )}
            </div>
          )}

          {/* LTL: Dimensiones */}
          {info.tipo_transporte === "ltl" && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Dimensiones</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Largo (cm)"><input type="number" value={info.largo_cm} onChange={e => setInfo(p => ({ ...p, largo_cm: e.target.value }))} style={INPUT} /></Field>
                <Field label="Ancho (cm)"><input type="number" value={info.ancho_cm} onChange={e => setInfo(p => ({ ...p, ancho_cm: e.target.value }))} style={INPUT} /></Field>
                <Field label="Alto (cm)"><input type="number" value={info.alto_cm} onChange={e => setInfo(p => ({ ...p, alto_cm: e.target.value }))} style={INPUT} /></Field>
                <Field label="Piezas"><input type="number" value={info.piezas} onChange={e => setInfo(p => ({ ...p, piezas: e.target.value }))} style={INPUT} /></Field>
              </div>
              {volLTL && <InfoBox type="info">Volumen: <strong>{volLTL.toFixed(3)} m³</strong>{info.piezas && Number(info.piezas) > 1 ? ` × ${info.piezas} = ${volTotalLTL?.toFixed(3)} m³ total` : ""}</InfoBox>}
            </div>
          )}

          {/* Mercancía común */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>Mercancía</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Field label="Descripción *">
                <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))} placeholder="Descripción general de la carga…" style={INPUT} />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Valor comercial">
                  <input type="number" value={info.valor_comercial} onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))} placeholder="0.00" style={INPUT} />
                </Field>
                <Field label="Moneda">
                  <select value={info.valor_moneda} onChange={e => setInfo(p => ({ ...p, valor_moneda: e.target.value }))} style={SELECT}>
                    {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Peso total (kg)">
                  <input type="number" value={info.peso_kg} onChange={e => setInfo(p => ({ ...p, peso_kg: e.target.value }))} placeholder="0" style={INPUT} />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ SECCIÓN ADUANAL ══════════════ */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.1)", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#a78bfa" }}>
            🏛️ Despacho Aduanal — {info.modalidad === "impo" ? "Importación" : "Exportación"}
          </span>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* Datos mercancía */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
            <Field label="Fracción arancelaria *">
              <input value={info.fraccion_arancelaria} onChange={e => setInfo(p => ({ ...p, fraccion_arancelaria: e.target.value }))} placeholder="8471.30.01" style={{ ...INPUT, fontFamily: "monospace" }} />
            </Field>
            <Field label="Descripción aduanal *">
              <input value={info.descripcion_mercancia} onChange={e => setInfo(p => ({ ...p, descripcion_mercancia: e.target.value }))} placeholder="Descripción exacta para pedimento…" style={INPUT} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Field label={info.modalidad === "impo" ? "País de origen" : "País de destino"}>
              <input value={info.pais} onChange={e => setInfo(p => ({ ...p, pais: e.target.value }))} placeholder="China, USA…" style={INPUT} />
            </Field>
          </div>

          {/* Aduana */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
            <Field label={info.modalidad === "impo" ? "Aduana de entrada *" : "Aduana de salida *"}>
              <select value={aduanas.find(a => a.name === info.aduana)?.id ?? ""} onChange={e => handleAduanaChange(e.target.value)} style={SELECT}>
                <option value="">— Seleccionar aduana —</option>
                {ADUANA_GROUPS.map(group => {
                  const items = aduanas.filter(a => a.type === group);
                  if (!items.length) return null;
                  return (
                    <optgroup key={group} label={group.charAt(0).toUpperCase() + group.slice(1)}>
                      {items.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </optgroup>
                  );
                })}
              </select>
            </Field>
            {info.clave_aduana && (
              <div style={{ padding: "6px 10px", borderRadius: "var(--radius-md)", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "9px", color: "#a78bfa", fontWeight: 600, textTransform: "uppercase" }}>Clave SAT</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{info.clave_aduana}</div>
              </div>
            )}
          </div>

          {/* IMPO: Valor aduana + impuestos */}
          {info.modalidad === "impo" && (
            <>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Valor en aduana e incrementables</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Valor de factura *">
                  <input type="number" value={info.valor_comercial} onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))} placeholder="0.00" style={INPUT} />
                </Field>
                <Field label="Moneda factura">
                  <select value={info.moneda_factura} onChange={e => setInfo(p => ({ ...p, moneda_factura: e.target.value }))} style={SELECT}>
                    {["USD","EUR","MXN","CNY","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Tipo de cambio">
                  <input type="number" value={info.tipo_cambio} onChange={e => setInfo(p => ({ ...p, tipo_cambio: e.target.value }))} step="0.01" style={INPUT} />
                </Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Flete (MXN)"><input type="number" value={info.flete_origen} onChange={e => setInfo(p => ({ ...p, flete_origen: e.target.value }))} placeholder="0.00" style={INPUT} /></Field>
                <Field label="Seguro (MXN)"><input type="number" value={info.seguro} onChange={e => setInfo(p => ({ ...p, seguro: e.target.value }))} placeholder="0.00" style={INPUT} /></Field>
                <Field label="Otros incrementables (MXN)"><input type="number" value={info.otros_incrementables} onChange={e => setInfo(p => ({ ...p, otros_incrementables: e.target.value }))} placeholder="0.00" style={INPUT} /></Field>
              </div>
              {valorAduana > 0 && (
                <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <div><div style={{ fontSize: "9px", color: "#a78bfa", fontWeight: 600, textTransform: "uppercase" }}>Valor Factura MXN</div><div style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa" }}>${fmt(valorFacturaMXN)}</div></div>
                  <div><div style={{ fontSize: "9px", color: "#a78bfa", fontWeight: 600, textTransform: "uppercase" }}>Incrementables</div><div style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa" }}>${fmt(totalIncremMXN)}</div></div>
                  <div><div style={{ fontSize: "9px", color: "#a78bfa", fontWeight: 700, textTransform: "uppercase" }}>Valor en Aduana</div><div style={{ fontSize: "16px", fontWeight: 800, color: "#a78bfa" }}>${fmt(valorAduana)}</div></div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Arancel IGI (%)"><input type="number" value={info.arancel_pct} onChange={e => setInfo(p => ({ ...p, arancel_pct: e.target.value }))} placeholder="0" min="0" max="100" style={INPUT} /></Field>
                <Field label="Prevalidación (MXN)"><input type="number" value={info.prevalidacion} onChange={e => setInfo(p => ({ ...p, prevalidacion: e.target.value }))} placeholder="309" style={INPUT} /></Field>
                <Field label="IVA prevalidación (auto)">
                  <div style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontSize: "12px", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>${fmt(ivaPrevalidacion)}</div>
                </Field>
              </div>
              {valorAduana > 0 && (
                <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
                  {[
                    { label: "IGI / Arancel",      value: igi,              pct: `${info.arancel_pct}%` },
                    { label: "DTA",                 value: dta,              pct: "0.176% (mín $890)" },
                    { label: "Prevalidación",       value: prevalidacion,    pct: "Cuota fija" },
                    { label: "IVA Prevalidación",   value: ivaPrevalidacion, pct: "16% prevalidación" },
                    { label: "IVA Importación 16%", value: ivaImportacion,   pct: "16% base imponible" },
                  ].map((row) => (
                    <div key={row.label} style={{ padding: "6px 12px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{row.label}</div>
                        <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{row.pct}</div>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 700 }}>MXN ${fmt(row.value)}</div>
                    </div>
                  ))}
                  <div style={{ padding: "8px 12px", background: "rgba(167,139,250,0.1)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#a78bfa" }}>TOTAL IMPUESTOS</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#a78bfa" }}>MXN ${fmt(totalImpuestos)}</span>
                  </div>
                </div>
              )}
              <InfoBox type="warning">Cálculo estimado. Los impuestos finales los determina el SAT al momento del cruce.</InfoBox>
            </>
          )}

          {/* EXPO: Certificado origen + permiso */}
          {info.modalidad === "expo" && (
            <>
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: info.requiere_cert_origen ? "8px" : "0" }}>
                  <input type="checkbox" id="cert_op" checked={info.requiere_cert_origen} onChange={e => setInfo(p => ({ ...p, requiere_cert_origen: e.target.checked }))} />
                  <label htmlFor="cert_op" style={{ fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Requiere certificado de origen</label>
                </div>
                {info.requiere_cert_origen && (
                  <Field label="Tipo de certificado">
                    <select value={info.tipo_cert_origen} onChange={e => setInfo(p => ({ ...p, tipo_cert_origen: e.target.value }))} style={SELECT}>
                      <option value="">— Seleccionar —</option>
                      {CERT_ORIGEN_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                )}
              </div>
              <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" id="permiso_op" checked={info.requiere_permiso_expo} onChange={e => setInfo(p => ({ ...p, requiere_permiso_expo: e.target.checked }))} />
                <label htmlFor="permiso_op" style={{ fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Requiere permiso previo de exportación</label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════ CONCEPTOS DE FACTURACIÓN ══════════════ */}
      <StepConceptos
        billingConcepts={billingConcepts}
        setBillingConcepts={setBillingConcepts}
        svcCatalog={svcCatalog}
      />
    </div>
  );
}