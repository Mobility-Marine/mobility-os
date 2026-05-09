"use client";
import { useState, useEffect } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
export interface ImpoInfo {
  // Datos del embarque
  fraccion_arancelaria:   string;
  descripcion_mercancia:  string;
  pais_origen:            string;
  aduana:                 string;
  clave_aduana:           string;
  tipo_aduana:            string;
  incoterm:               string;
  // Valor y cálculo
  valor_factura:          string;
  moneda_factura:         string;
  tipo_cambio:            string;
  // Incrementables
  flete_origen:           string;
  seguro:                 string;
  otros_incrementables:   string;
  // Impuestos
  arancel_pct:            string;
  prevalidacion:          string;
  iva_prevalidacion:      string;
}

export const EMPTY_IMPO_INFO = (): ImpoInfo => ({
  fraccion_arancelaria:  "",
  descripcion_mercancia: "",
  pais_origen:           "",
  aduana:                "",
  clave_aduana:          "",
  tipo_aduana:           "",
  incoterm:              "",
  valor_factura:         "",
  moneda_factura:        "USD",
  tipo_cambio:           "17",
  flete_origen:          "",
  seguro:                "",
  otros_incrementables:  "",
  arancel_pct:           "0",
  prevalidacion:         "309",
  iva_prevalidacion:     "",
});

const INCOTERMS_IMPO = ["EXW","FOB","FCA","CFR","CIF","CPT","CIP","DAP","DDP","DAT"];

type Props = {
  info:               ImpoInfo;
  setInfo:            React.Dispatch<React.SetStateAction<ImpoInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentImpo({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [aduanas, setAduanas] = useState<any[]>([]);

  // Cargar catálogo de aduanas desde Supabase
  useEffect(() => {
    import("@/lib/supabaseClient").then(({ supabase }) => {
      supabase.from("customs_offices").select("*").order("type").order("name")
        .then(({ data }) => setAduanas(data ?? []));
    });
  }, []);

  // ── Cálculos automáticos ──────────────────────────────────
  const valorFacturaMXN  = Number(info.valor_factura    || 0) * Number(info.tipo_cambio   || 1);
  const fleteflete       = Number(info.flete_origen     || 0);
  const seguro           = Number(info.seguro           || 0);
  const otrosInc         = Number(info.otros_incrementables || 0);
  const totalIncremMXN   = fleteflete + seguro + otrosInc;
  const valorAduana      = valorFacturaMXN + totalIncremMXN;
  const igi              = valorAduana * (Number(info.arancel_pct || 0) / 100);
  const dta              = valorAduana > 0
    ? Math.min(Math.max(valorAduana * 0.00176, 890), 1008)
    : 0;
  const prevalidacion    = Number(info.prevalidacion    || 0);
  const ivaPrevalidacion = prevalidacion * 0.16;
  const baseIvaImpo      = valorAduana + igi + dta + prevalidacion;
  const ivaImportacion   = baseIvaImpo * 0.16;
  const totalImpuestos   = igi + dta + prevalidacion + ivaPrevalidacion + ivaImportacion;

  function handleAduanaChange(id: string) {
    const a = aduanas.find(x => x.id === id);
    if (a) setInfo(p => ({ ...p, aduana: a.name, clave_aduana: a.clave_sat, tipo_aduana: a.type }));
  }

  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ADUANA_GROUPS = ["fronteriza","interna","maritima","aeropuerto"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── DATOS DE LA MERCANCÍA ── */}
      <div>
        <SectionTitle>Datos de la mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px" }}>
            <Field label="Fracción arancelaria *">
              <input value={info.fraccion_arancelaria}
                onChange={e => setInfo(p => ({ ...p, fraccion_arancelaria: e.target.value }))}
                placeholder="8471.30.01" style={{ ...INPUT, fontFamily: "monospace" }} />
            </Field>
            <Field label="Descripción de mercancía *">
              <input value={info.descripcion_mercancia}
                onChange={e => setInfo(p => ({ ...p, descripcion_mercancia: e.target.value }))}
                placeholder="Computadoras portátiles, autopartes, textiles…" style={INPUT} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="País de origen *">
              <input value={info.pais_origen}
                onChange={e => setInfo(p => ({ ...p, pais_origen: e.target.value }))}
                placeholder="China, USA, Alemania…" style={INPUT} />
            </Field>
            <Field label="Incoterm">
              <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                <option value="">—</option>
                {INCOTERMS_IMPO.map(inc => <option key={inc} value={inc}>{inc}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── ADUANA ── */}
      <div>
        <SectionTitle>Aduana de despacho</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginTop: "8px" }}>
          <Field label="Aduana *" hint="La clave SAT se asigna automáticamente">
            <select
              value={aduanas.find(a => a.name === info.aduana)?.id ?? ""}
              onChange={e => handleAduanaChange(e.target.value)}
              style={SELECT}>
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
            <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Clave SAT</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-info-text)", fontFamily: "monospace" }}>{info.clave_aduana}</div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "capitalize" }}>{info.tipo_aduana}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── VALOR EN ADUANA ── */}
      <div>
        <SectionTitle>Valor en aduana e incrementables</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor de factura *">
              <input type="number" value={info.valor_factura}
                onChange={e => setInfo(p => ({ ...p, valor_factura: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda factura">
              <select value={info.moneda_factura} onChange={e => setInfo(p => ({ ...p, moneda_factura: e.target.value }))} style={SELECT}>
                {["USD","EUR","MXN","CNY","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tipo de cambio (MXN)" hint="SAT del día de cruce">
              <input type="number" value={info.tipo_cambio}
                onChange={e => setInfo(p => ({ ...p, tipo_cambio: e.target.value }))}
                placeholder="17.00" step="0.01" style={INPUT} />
            </Field>
          </div>

          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
            Incrementables (en MXN)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Flete internacional" hint="En MXN">
              <input type="number" value={info.flete_origen}
                onChange={e => setInfo(p => ({ ...p, flete_origen: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Seguro" hint="En MXN">
              <input type="number" value={info.seguro}
                onChange={e => setInfo(p => ({ ...p, seguro: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Otros incrementables" hint="Empaque, cargos origen, etc.">
              <input type="number" value={info.otros_incrementables}
                onChange={e => setInfo(p => ({ ...p, otros_incrementables: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
          </div>

          {/* Resultado valor aduana */}
          {valorAduana > 0 && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Valor factura MXN</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-info-text)" }}>${fmt(valorFacturaMXN)}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Incrementables</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-info-text)" }}>${fmt(totalIncremMXN)}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Valor en Aduana</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)" }}>${fmt(valorAduana)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CÁLCULO DE IMPUESTOS ── */}
      <div>
        <SectionTitle>Cálculo de impuestos de importación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Arancel IGI (%)" hint="0% si aplica TLCAN/T-MEC/etc.">
              <input type="number" value={info.arancel_pct}
                onChange={e => setInfo(p => ({ ...p, arancel_pct: e.target.value }))}
                placeholder="0" min="0" max="100" step="0.5" style={INPUT} />
            </Field>
            <Field label="Prevalidación (MXN)" hint="Cuota fija SAT, default $309">
              <input type="number" value={info.prevalidacion}
                onChange={e => setInfo(p => ({
                  ...p,
                  prevalidacion: e.target.value,
                  iva_prevalidacion: String(Number(e.target.value) * 0.16),
                }))}
                placeholder="309" style={INPUT} />
            </Field>
            <Field label="IVA prevalidación (auto)">
              <div style={{ height: "36px", padding: "0 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", display: "flex", alignItems: "center" }}>
                ${fmt(ivaPrevalidacion)}
              </div>
            </Field>
          </div>

          {/* Tabla de impuestos calculados */}
          {valorAduana > 0 && (
            <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>Resumen de impuestos</span>
              </div>
              {[
                { label: "IGI / Arancel",        value: igi,              pct: `${info.arancel_pct}%`,    highlight: false },
                { label: "DTA",                   value: dta,              pct: "0.176% (mín $890)",        highlight: false },
                { label: "Prevalidación",         value: prevalidacion,    pct: "Cuota fija",               highlight: false },
                { label: "IVA Prevalidación",     value: ivaPrevalidacion, pct: "16% de prevalidación",     highlight: false },
                { label: "IVA Importación 16%",   value: ivaImportacion,   pct: "16% de base imponible",    highlight: false },
              ].map((row) => (
                <div key={row.label} style={{ padding: "8px 14px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{row.label}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{row.pct}</div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    MXN ${fmt(row.value)}
                  </div>
                </div>
              ))}
              <div style={{ padding: "10px 14px", background: "var(--color-info-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-info-text)" }}>TOTAL IMPUESTOS</span>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-info-text)" }}>MXN ${fmt(totalImpuestos)}</span>
              </div>
            </div>
          )}

          {valorAduana > 0 && (
            <InfoBox type="warning">
              Este cálculo es <strong>estimado</strong> con base en la información proporcionada. Los impuestos finales los determina el SAT al momento del cruce.
            </InfoBox>
          )}
        </div>
      </div>

      {/* ── CONCEPTOS DE FACTURACIÓN ── */}
      <StepConceptos
        billingConcepts={billingConcepts}
        setBillingConcepts={setBillingConcepts}
        svcCatalog={svcCatalog}
      />
    </div>
  );
}