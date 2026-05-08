"use client";
import { useState, useEffect } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { CURRENCIES, CONTAINER_TYPES, TRUCK_TYPES, INCOTERMS } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type TipoTransporte = "fcl" | "lcl" | "ltl" | "ftl" | "aereo_carga" | "courier";

type Contenedor = { tipo: string; cantidad: number };
type Bulto      = { largo_cm: string; ancho_cm: string; alto_cm: string; peso_kg: string; cantidad: string };

interface SKU {
  descripcion:        string;
  fraccion:           string;
  cantidad:           string;
  unidad:             string;
  precio_unit_origen: string;
  moneda_origen:      string;
}

export interface ComercializadoraInfo {
  // Producto
  skus:                  SKU[];
  pais_origen:           string;
  incoterm:              string;
  // Tipo de transporte
  tipo_transporte:       TipoTransporte;
  // Flete (campos por tipo)
  puerto_origen:         string;
  puerto_destino:        string;
  aeropuerto_origen:     string;
  aeropuerto_destino:    string;
  carrier:               string;
  contenedores:          Contenedor[];
  bultos:                Bulto[];
  rutas:                 { origen: string; destino: string }[];
  tipo_unidad:           string;
  cantidad_unidades:     string;
  // Costo flete (lo captura el agente)
  costo_flete_mxn:       string;
  // Valor y tipo de cambio
  tipo_cambio:           string;
  // Incrementables (además del flete)
  seguro:                string;
  otros_incrementables:  string;
  // Impuestos
  arancel_pct:           string;
  prevalidacion:         string;
  // Comercializadora
  comision_pct:          string;
  destino_entrega:       string;
  moneda_venta:          string;
}

export const EMPTY_COMERCIALIZADORA_INFO = (): ComercializadoraInfo => ({
  skus:                 [{ descripcion: "", fraccion: "", cantidad: "1", unidad: "pza", precio_unit_origen: "", moneda_origen: "USD" }],
  pais_origen:          "",
  incoterm:             "FOB",
  tipo_transporte:      "fcl",
  puerto_origen:        "",
  puerto_destino:       "",
  aeropuerto_origen:    "",
  aeropuerto_destino:   "",
  carrier:              "",
  contenedores:         [{ tipo: "40'HC", cantidad: 1 }],
  bultos:               [],
  rutas:                [{ origen: "", destino: "" }],
  tipo_unidad:          "",
  cantidad_unidades:    "1",
  costo_flete_mxn:      "",
  tipo_cambio:          "17",
  seguro:               "",
  otros_incrementables: "",
  arancel_pct:          "0",
  prevalidacion:        "309",
  comision_pct:         "5",
  destino_entrega:      "",
  moneda_venta:         "MXN",
});

const TRANSPORT_OPTIONS: { value: TipoTransporte; label: string }[] = [
  { value: "fcl",         label: "FCL — Marítimo" },
  { value: "lcl",         label: "LCL — Marítimo" },
  { value: "ltl",         label: "LTL — Terrestre" },
  { value: "ftl",         label: "FTL — Terrestre" },
  { value: "aereo_carga", label: "Aéreo Carga" },
  { value: "courier",     label: "Courier" },
];

const UNIDADES = ["pza", "caja", "kg", "ton", "m", "m²", "m³", "lt", "set", "par", "rollo"];
const CARRIERS_AEREO   = ["DHL","FedEx","UPS","Aeromexico Cargo","Otro"];
const CARRIERS_COURIER = ["DHL Express","FedEx Express","UPS Express","Otro"];
const ADUANA_GROUPS    = ["fronteriza","interna","maritima","aeropuerto"];

type Props = {
  info:               ComercializadoraInfo;
  setInfo:            React.Dispatch<React.SetStateAction<ComercializadoraInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentComercializadora({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [aduanas,       setAduanas]       = useState<any[]>([]);
  const [aduanaId,      setAduanaId]      = useState("");
  const [aduanaSAT,     setAduanaSAT]     = useState({ nombre: "", clave: "", tipo: "" });

  useEffect(() => {
    import("@/lib/supabaseClient").then(({ supabase }) => {
      supabase.from("customs_offices").select("*").order("type").order("name")
        .then(({ data }) => setAduanas(data ?? []));
    });
  }, []);

  function handleAduanaChange(id: string) {
    const a = aduanas.find(x => x.id === id);
    if (a) { setAduanaId(id); setAduanaSAT({ nombre: a.name, clave: a.clave_sat, tipo: a.type }); }
  }

  // ── Cálculos ──────────────────────────────────────────────
  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tc = Number(info.tipo_cambio || 17);

  // Valor total de mercancía en MXN (suma de todos los SKUs)
  const valorMercMXN = info.skus.reduce((s, sku) => {
    const valorUSD = Number(sku.precio_unit_origen || 0) * Number(sku.cantidad || 1);
    return s + valorUSD * tc;
  }, 0);

  const costoFleteMXN   = Number(info.costo_flete_mxn   || 0);
  const seguroMXN       = Number(info.seguro             || 0);
  const otrosMXN        = Number(info.otros_incrementables || 0);
  const valorAduana     = valorMercMXN + costoFleteMXN + seguroMXN + otrosMXN;
  const igi             = valorAduana * (Number(info.arancel_pct || 0) / 100);
  const dta             = valorAduana > 0 ? Math.min(Math.max(valorAduana * 0.00176, 890), 1008) : 0;
  const prevalidacion   = Number(info.prevalidacion || 0);
  const ivaPreval       = prevalidacion * 0.16;
  const ivaImpo         = (valorAduana + igi + dta + prevalidacion) * 0.16;
  const totalImpuestos  = igi + dta + prevalidacion + ivaPreval + ivaImpo;
  const costoTotalMXN   = valorMercMXN + costoFleteMXN + seguroMXN + otrosMXN + totalImpuestos;
  const comisionMXN     = costoTotalMXN * (Number(info.comision_pct || 0) / 100);
  const precioFinalMXN  = costoTotalMXN + comisionMXN;

  // Precio por pieza (total SKUs)
  const totalPiezas = info.skus.reduce((s, sku) => s + Number(sku.cantidad || 1), 0);
  const precioPorPiezaMXN = totalPiezas > 0 ? precioFinalMXN / totalPiezas : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── SELECTOR TIPO TRANSPORTE ── */}
      <div>
        <SectionTitle>Tipo de transporte internacional</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
          {TRANSPORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setInfo(p => ({ ...p, tipo_transporte: opt.value }))}
              style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.tipo_transporte === opt.value ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.tipo_transporte === opt.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: info.tipo_transporte === opt.value ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════ SECCIÓN PRODUCTO ══════════════ */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>📦 Producto(s) a importar</span>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="País de origen *">
              <input value={info.pais_origen} onChange={e => setInfo(p => ({ ...p, pais_origen: e.target.value }))} placeholder="China, USA…" style={INPUT} />
            </Field>
            <Field label="Incoterm">
              <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
              </select>
            </Field>
            <Field label="Tipo de cambio (MXN)">
              <input type="number" value={info.tipo_cambio} onChange={e => setInfo(p => ({ ...p, tipo_cambio: e.target.value }))} step="0.01" style={INPUT} />
            </Field>
          </div>

          {/* SKUs */}
          {info.skus.map((sku, i) => (
            <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Producto {i + 1}</span>
                {info.skus.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, skus: p.skus.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
                  <Field label="Fracción arancelaria">
                    <input value={sku.fraccion} onChange={e => setInfo(p => ({ ...p, skus: p.skus.map((s, j) => j === i ? { ...s, fraccion: e.target.value } : s) }))} placeholder="8471.30.01" style={{ ...INPUT, fontFamily: "monospace" }} />
                  </Field>
                  <Field label="Descripción *">
                    <input value={sku.descripcion} onChange={e => setInfo(p => ({ ...p, skus: p.skus.map((s, j) => j === i ? { ...s, descripcion: e.target.value } : s) }))} placeholder="Nombre del producto…" style={INPUT} />
                  </Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                  <Field label="Cantidad *">
                    <input type="number" value={sku.cantidad} min="1" onChange={e => setInfo(p => ({ ...p, skus: p.skus.map((s, j) => j === i ? { ...s, cantidad: e.target.value } : s) }))} style={INPUT} />
                  </Field>
                  <Field label="Unidad">
                    <select value={sku.unidad} onChange={e => setInfo(p => ({ ...p, skus: p.skus.map((s, j) => j === i ? { ...s, unidad: e.target.value } : s) }))} style={SELECT}>
                      {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Precio unit. origen *">
                    <input type="number" value={sku.precio_unit_origen} onChange={e => setInfo(p => ({ ...p, skus: p.skus.map((s, j) => j === i ? { ...s, precio_unit_origen: e.target.value } : s) }))} placeholder="0.00" style={INPUT} />
                  </Field>
                  <Field label="Moneda">
                    <select value={sku.moneda_origen} onChange={e => setInfo(p => ({ ...p, skus: p.skus.map((s, j) => j === i ? { ...s, moneda_origen: e.target.value } : s) }))} style={SELECT}>
                      {["USD","EUR","CNY","MXN"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                {sku.precio_unit_origen && sku.cantidad && (
                  <div style={{ fontSize: "11px", color: "var(--color-info-text)", padding: "4px 8px", background: "var(--color-info-bg)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-info-border)" }}>
                    Valor en MXN: ${fmt(Number(sku.precio_unit_origen) * Number(sku.cantidad) * tc)} ({sku.cantidad} {sku.unidad} × {sku.moneda_origen} ${sku.precio_unit_origen} × TC {tc})
                  </div>
                )}
              </div>
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, skus: [...p.skus, { descripcion: "", fraccion: "", cantidad: "1", unidad: "pza", precio_unit_origen: "", moneda_origen: "USD" }] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar producto
          </button>
          {valorMercMXN > 0 && (
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--color-info-text)" }}>Valor total mercancía en MXN</span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>MXN ${fmt(valorMercMXN)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ SECCIÓN FLETE ══════════════ */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--color-info-bg)", borderBottom: "1px solid var(--color-info-border)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-info-text)" }}>🚛 Datos de flete</span>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Marítimo */}
          {(info.tipo_transporte === "fcl" || info.tipo_transporte === "lcl") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <Field label="Puerto de origen"><input value={info.puerto_origen} onChange={e => setInfo(p => ({ ...p, puerto_origen: e.target.value }))} placeholder="Shanghai, China" style={INPUT} /></Field>
              <Field label="Puerto de destino"><input value={info.puerto_destino} onChange={e => setInfo(p => ({ ...p, puerto_destino: e.target.value }))} placeholder="Manzanillo, México" style={INPUT} /></Field>
            </div>
          )}
          {info.tipo_transporte === "fcl" && (
            <div>
              {info.contenedores.map((cont, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", marginBottom: "6px", alignItems: "flex-end" }}>
                  <Field label={i === 0 ? "Tipo de contenedor" : ""}><select value={cont.tipo} onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, tipo: e.target.value } : c) }))} style={SELECT}>{CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
                  <Field label={i === 0 ? "Cantidad" : ""}><input type="number" min="1" value={cont.cantidad} onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, cantidad: Number(e.target.value) } : c) }))} style={INPUT} /></Field>
                  {info.contenedores.length > 1 && <button onClick={() => setInfo(p => ({ ...p, contenedores: p.contenedores.filter((_, j) => j !== i) }))} style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer" }}>✕</button>}
                </div>
              ))}
              <button onClick={() => setInfo(p => ({ ...p, contenedores: [...p.contenedores, { tipo: "40'HC", cantidad: 1 }] }))} style={{ height: "30px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "11px", color: "var(--color-text-muted)", cursor: "pointer", width: "100%" }}>+ Agregar contenedor</button>
            </div>
          )}

          {/* Aéreo */}
          {(info.tipo_transporte === "aereo_carga" || info.tipo_transporte === "courier") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <Field label="Aeropuerto origen"><input value={info.aeropuerto_origen} onChange={e => setInfo(p => ({ ...p, aeropuerto_origen: e.target.value }))} placeholder="PVG — Shanghai" style={INPUT} /></Field>
              <Field label="Aeropuerto destino"><input value={info.aeropuerto_destino} onChange={e => setInfo(p => ({ ...p, aeropuerto_destino: e.target.value }))} placeholder="MEX — CDMX" style={INPUT} /></Field>
              <Field label="Carrier">
                <select value={info.carrier} onChange={e => setInfo(p => ({ ...p, carrier: e.target.value }))} style={SELECT}>
                  <option value="">— Sin preferencia —</option>
                  {(info.tipo_transporte === "courier" ? CARRIERS_COURIER : CARRIERS_AEREO).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          )}

          {/* Terrestre */}
          {(info.tipo_transporte === "ltl" || info.tipo_transporte === "ftl") && (
            <>
              {info.rutas.map((ruta, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
                  <Field label={i === 0 ? "Origen" : ""}><input value={ruta.origen} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, origen: e.target.value } : r) }))} placeholder="Ciudad, País" style={INPUT} /></Field>
                  <Field label={i === 0 ? "Destino" : ""}><input value={ruta.destino} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, destino: e.target.value } : r) }))} placeholder="Ciudad, País" style={INPUT} /></Field>
                  {info.rutas.length > 1 && <button onClick={() => setInfo(p => ({ ...p, rutas: p.rutas.filter((_, j) => j !== i) }))} style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer" }}>✕</button>}
                </div>
              ))}
              {info.tipo_transporte === "ftl" && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
                  <Field label="Tipo de unidad"><select value={info.tipo_unidad} onChange={e => setInfo(p => ({ ...p, tipo_unidad: e.target.value }))} style={SELECT}><option value="">— Seleccionar —</option>{TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></Field>
                  <Field label="Cantidad"><input type="number" min="1" value={info.cantidad_unidades} onChange={e => setInfo(p => ({ ...p, cantidad_unidades: e.target.value }))} style={INPUT} /></Field>
                </div>
              )}
            </>
          )}

          {/* Costo flete + incrementables */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Costo flete (MXN) *" hint="Costo interno del flete">
              <input type="number" value={info.costo_flete_mxn} onChange={e => setInfo(p => ({ ...p, costo_flete_mxn: e.target.value }))} placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Seguro (MXN)">
              <input type="number" value={info.seguro} onChange={e => setInfo(p => ({ ...p, seguro: e.target.value }))} placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Otros incrementables (MXN)">
              <input type="number" value={info.otros_incrementables} onChange={e => setInfo(p => ({ ...p, otros_incrementables: e.target.value }))} placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Destino de entrega">
              <input value={info.destino_entrega} onChange={e => setInfo(p => ({ ...p, destino_entrega: e.target.value }))} placeholder="Almacén del cliente…" style={INPUT} />
            </Field>
          </div>
        </div>
      </div>

      {/* ══════════════ SECCIÓN ADUANAL ══════════════ */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.1)", borderBottom: "1px solid rgba(167,139,250,0.2)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#a78bfa" }}>🏛️ Despacho Aduanal — Importación (Padrón Propio)</span>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px" }}>
            <Field label="Aduana de entrada *">
              <select value={aduanaId} onChange={e => handleAduanaChange(e.target.value)} style={SELECT}>
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
            {aduanaSAT.clave && (
              <div style={{ padding: "6px 10px", borderRadius: "var(--radius-md)", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: "9px", color: "#a78bfa", fontWeight: 600, textTransform: "uppercase" }}>Clave SAT</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#a78bfa", fontFamily: "monospace" }}>{aduanaSAT.clave}</div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Arancel IGI (%)">
              <input type="number" value={info.arancel_pct} onChange={e => setInfo(p => ({ ...p, arancel_pct: e.target.value }))} placeholder="0" min="0" max="100" style={INPUT} />
            </Field>
            <Field label="Prevalidación (MXN)">
              <input type="number" value={info.prevalidacion} onChange={e => setInfo(p => ({ ...p, prevalidacion: e.target.value }))} placeholder="309" style={INPUT} />
            </Field>
            <Field label="IVA prevalidación (auto)">
              <div style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", fontSize: "12px", display: "flex", alignItems: "center", color: "var(--color-text-muted)" }}>
                ${fmt(ivaPreval)}
              </div>
            </Field>
          </div>

          {valorAduana > 0 && (
            <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
              {[
                { label: "Valor en Aduana",     value: valorAduana, sub: "Mercancía + Flete + Incrementables" },
                { label: "IGI / Arancel",        value: igi,         sub: `${info.arancel_pct}%` },
                { label: "DTA",                  value: dta,         sub: "0.176% (mín $890)" },
                { label: "Prevalidación",        value: prevalidacion, sub: "Cuota fija" },
                { label: "IVA Prevalidación",    value: ivaPreval,   sub: "16% prevalidación" },
                { label: "IVA Importación 16%",  value: ivaImpo,     sub: "16% base imponible" },
              ].map((row) => (
                <div key={row.label} style={{ padding: "6px 12px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>{row.label}</div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{row.sub}</div>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 700 }}>MXN ${fmt(row.value)}</div>
                </div>
              ))}
              <div style={{ padding: "8px 12px", background: "rgba(167,139,250,0.1)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 800, color: "#a78bfa" }}>TOTAL IMPUESTOS</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#a78bfa" }}>MXN ${fmt(totalImpuestos)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ SECCIÓN COMERCIALIZADORA ══════════════ */}
      <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", background: "var(--color-success-bg)", borderBottom: "1px solid var(--color-success-border)" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>💰 Margen y precio final al cliente</span>
        </div>
        <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Field label="Comisión comercializadora (% sobre costo total)" hint="Uso de padrón de importadores Propio">
              <input type="number" value={info.comision_pct} onChange={e => setInfo(p => ({ ...p, comision_pct: e.target.value }))} placeholder="5" min="0" max="100" step="0.5" style={INPUT} />
            </Field>
            <Field label="Moneda de venta al cliente">
              <select value={info.moneda_venta} onChange={e => setInfo(p => ({ ...p, moneda_venta: e.target.value }))} style={SELECT}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {/* Resumen de costos — INTERNO */}
          {costoTotalMXN > 0 && (
            <>
              <div style={{ padding: "4px 10px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-warning-text)" }}>⚠ USO INTERNO — No aparece en la cotización del cliente</span>
              </div>
              <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
                {[
                  { label: "Costo mercancía",    value: valorMercMXN,   highlight: false },
                  { label: "Costo flete",         value: costoFleteMXN,  highlight: false },
                  { label: "Seguro + otros",      value: seguroMXN + otrosMXN, highlight: false },
                  { label: "Impuestos totales",   value: totalImpuestos, highlight: false },
                  { label: "Costo total MXN",     value: costoTotalMXN,  highlight: true  },
                  { label: `Comisión ${info.comision_pct}%`, value: comisionMXN, highlight: false },
                ].map((row) => (
                  <div key={row.label} style={{ padding: "6px 12px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center", background: row.highlight ? "var(--color-bg-subtle)" : "transparent" }}>
                    <span style={{ fontSize: row.highlight ? "13px" : "11px", fontWeight: row.highlight ? 800 : 600, color: "var(--color-text-primary)" }}>{row.label}</span>
                    <span style={{ fontSize: row.highlight ? "13px" : "12px", fontWeight: 700 }}>MXN ${fmt(row.value)}</span>
                  </div>
                ))}
                <div style={{ padding: "10px 12px", background: "var(--color-success-bg)", display: "flex", justifyContent: "space-between", borderTop: "2px solid var(--color-success-border)" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success-text)" }}>PRECIO FINAL NACIONALIZADO</div>
                    {totalPiezas > 1 && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>÷ {totalPiezas} piezas</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-success-text)" }}>MXN ${fmt(precioFinalMXN)}</div>
                    {totalPiezas > 1 && <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>= ${fmt(precioPorPiezaMXN)} / pieza</div>}
                  </div>
                </div>
              </div>
              <InfoBox type="info">
                El cliente verá en la cotización el <strong>precio unitario nacionalizado</strong> (${fmt(precioPorPiezaMXN)} MXN/pieza) — no el desglose de costos ni la comisión.
              </InfoBox>
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