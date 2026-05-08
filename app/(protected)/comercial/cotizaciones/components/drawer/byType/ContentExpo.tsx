"use client";
import { useState, useEffect } from "react";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
export interface ExpoInfo {
  fraccion_arancelaria:   string;
  descripcion_mercancia:  string;
  pais_destino:           string;
  aduana:                 string;
  clave_aduana:           string;
  tipo_aduana:            string;
  incoterm:               string;
  valor_comercial:        string;
  moneda_factura:         string;
  tipo_cambio:            string;
  requiere_cert_origen:   boolean;
  tipo_cert_origen:       string;
  requiere_permiso_expo:  boolean;
  observaciones_expo:     string;
}

export const EMPTY_EXPO_INFO = (): ExpoInfo => ({
  fraccion_arancelaria:  "",
  descripcion_mercancia: "",
  pais_destino:          "",
  aduana:                "",
  clave_aduana:          "",
  tipo_aduana:           "",
  incoterm:              "",
  valor_comercial:       "",
  moneda_factura:        "USD",
  tipo_cambio:           "17",
  requiere_cert_origen:  false,
  tipo_cert_origen:      "",
  requiere_permiso_expo: false,
  observaciones_expo:    "",
});

const INCOTERMS_EXPO = ["EXW","FOB","FCA","CFR","CIF","CPT","CIP","DAP","DDP","DAT","FAS"];

const CERT_ORIGEN_TIPOS = [
  "T-MEC / USMCA",
  "Certificado de Origen EUR.1",
  "Form A (SGP)",
  "Declaración de Origen",
  "Certificado TLCUE",
  "Otro",
];

type Props = {
  info:               ExpoInfo;
  setInfo:            React.Dispatch<React.SetStateAction<ExpoInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentExpo({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const [aduanas,       setAduanas]       = useState<any[]>([]);

  useEffect(() => {
    import("@/lib/supabaseClient").then(({ supabase }) => {
      supabase.from("customs_offices").select("*").order("type").order("name")
        .then(({ data }) => setAduanas(data ?? []));
    });
  }, []);

  // Cálculo valor comercial MXN
  const valorComercialMXN = Number(info.valor_comercial || 0) * Number(info.tipo_cambio || 1);
  const fmt = (n: number) => n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ADUANA_GROUPS = ["fronteriza","interna","maritima","aeropuerto"];

  function handleAduanaChange(id: string) {
    const a = aduanas.find(x => x.id === id);
    if (a) setInfo(p => ({ ...p, aduana: a.name, clave_aduana: a.clave_sat, tipo_aduana: a.type }));
  }


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
                placeholder="Autopartes, electrónicos, textiles…" style={INPUT} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="País de destino *">
              <input value={info.pais_destino}
                onChange={e => setInfo(p => ({ ...p, pais_destino: e.target.value }))}
                placeholder="USA, Alemania, China…" style={INPUT} />
            </Field>
            <Field label="Incoterm">
              <select value={info.incoterm} onChange={e => setInfo(p => ({ ...p, incoterm: e.target.value }))} style={SELECT}>
                <option value="">—</option>
                {INCOTERMS_EXPO.map(inc => <option key={inc} value={inc}>{inc}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── ADUANA DE SALIDA ── */}
      <div>
        <SectionTitle>Aduana de salida</SectionTitle>
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

      {/* ── VALOR COMERCIAL ── */}
      <div>
        <SectionTitle>Valor comercial</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor de factura *">
              <input type="number" value={info.valor_comercial}
                onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))}
                placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda">
              <select value={info.moneda_factura} onChange={e => setInfo(p => ({ ...p, moneda_factura: e.target.value }))} style={SELECT}>
                {["USD","EUR","MXN","CNY","GBP"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tipo de cambio (MXN)">
              <input type="number" value={info.tipo_cambio}
                onChange={e => setInfo(p => ({ ...p, tipo_cambio: e.target.value }))}
                placeholder="17.00" step="0.01" style={INPUT} />
            </Field>
          </div>
          {valorComercialMXN > 0 && (
            <div style={{ padding: "8px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--color-info-text)" }}>Valor en MXN equivalente</span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>MXN ${fmt(valorComercialMXN)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── REQUISITOS ESPECIALES ── */}
      <div>
        <SectionTitle>Requisitos especiales de exportación</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>

          {/* Certificado de origen */}
          <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: info.requiere_cert_origen ? "10px" : "0" }}>
              <input type="checkbox" id="cert_origen" checked={info.requiere_cert_origen}
                onChange={e => setInfo(p => ({ ...p, requiere_cert_origen: e.target.checked }))} />
              <label htmlFor="cert_origen" style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}>
                Requiere certificado de origen
              </label>
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

          {/* Permiso de exportación */}
          <div style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" id="permiso_expo" checked={info.requiere_permiso_expo}
                onChange={e => setInfo(p => ({ ...p, requiere_permiso_expo: e.target.checked }))} />
              <label htmlFor="permiso_expo" style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", cursor: "pointer" }}>
                Requiere permiso previo de exportación (SEMARNAT, COFEPRIS, SEDENA, etc.)
              </label>
            </div>
          </div>

          {/* Observaciones */}
          <Field label="Observaciones adicionales">
            <input value={info.observaciones_expo}
              onChange={e => setInfo(p => ({ ...p, observaciones_expo: e.target.value }))}
              placeholder="Mercancía peligrosa, restricciones, condiciones especiales…" style={INPUT} />
          </Field>
        </div>
      </div>

      <StepConceptos
        billingConcepts={billingConcepts}
        setBillingConcepts={setBillingConcepts}
        svcCatalog={svcCatalog}
      />
    </div>
  );
}