"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS } from "../../../types/quotations.types";
import type { GeneralInfoImpoExpo } from "../../../types/quotations.types";

type Props = {
  info:        Partial<GeneralInfoImpoExpo>;
  onChange:    (u: Partial<GeneralInfoImpoExpo>) => void;
  hidePuerto?: boolean;
  hideIncoterm?: boolean;
};

export default function GeneralInfoImpoExpo({ info, onChange, hidePuerto, hideIncoterm }: Props) {
  const [aduanas, setAduanas] = useState<any[]>([]);
  const modalidad = info.modalidad ?? "impo";

  useEffect(() => {
    supabase.from("customs_offices").select("*").order("type").order("name")
      .then(({ data }) => setAduanas(data ?? []));
  }, []);

  function handleAduana(id: string) {
    const a = aduanas.find((x) => x.id === id);
    if (a) onChange({ aduana_nombre: a.name, aduana_clave_sat: a.clave_sat, aduana_tipo: a.type });
  }

  // Cálculo automático impo
  const valorAduana  = info.valor_aduana_usd ?? 0;
  const tipoCambio   = info.tipo_cambio       ?? 17;
  const arancelPct   = info.arancel_pct        ?? 0;
  const valorMXN     = valorAduana * tipoCambio;
  const igi          = valorMXN * (arancelPct / 100);
  const dtaCalc      = Math.min(Math.max(valorMXN * 0.00176, 890), 1008); // DTA estándar SAT
  const ivaImpo      = (valorMXN + igi + dtaCalc) * 0.16;

  const ADUANA_GROUPS = ["fronteriza", "interna", "maritima", "aeropuerto"];

  return (
    <>
      <SectionTitle>
        {modalidad === "impo" ? "Importación" : "Exportación"} — Información general
      </SectionTitle>

      {/* ADUANA */}
      <Grid2>
        <Field label="Aduana *" hint="La clave SAT y tipo se asignan automáticamente">
          <select
            value={aduanas.find(a => a.name === info.aduana_nombre)?.id ?? ""}
            onChange={(e) => handleAduana(e.target.value)}
            style={SELECT}
          >
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
        {info.aduana_clave_sat && (
          <div style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Aduana SAT</div>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)", fontFamily: "monospace" }}>{info.aduana_clave_sat}</div>
            <div style={{ fontSize: "11px", color: "var(--color-info-text)", textTransform: "capitalize" }}>{info.aduana_tipo}</div>
          </div>
        )}
        {!hidePuerto && (
          <Field label="Puerto / Aeropuerto de carga/descarga">
            <input value={info.puerto_aduana ?? ""} onChange={(e) => onChange({ puerto_aduana: e.target.value })} placeholder="Ej: Puerto Manzanillo, AICM T2…" style={INPUT} />
          </Field>
        )}
        <Field label="País de origen/destino">
          <input value={info.pais_origen_destino ?? ""} onChange={(e) => onChange({ pais_origen_destino: e.target.value })} placeholder="China, USA, Alemania…" style={INPUT} />
        </Field>
        {!hideIncoterm && (
          <Field label="Incoterm">
            <select value={info.incoterm ?? ""} onChange={(e) => onChange({ incoterm: e.target.value })} style={SELECT}>
              <option value="">—</option>
              {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
            </select>
          </Field>
        )}
      </Grid2>

      {/* MERCANCÍA */}
      <Grid2>
        <Field label="Fracción arancelaria *">
          <input value={info.fraccion_arancelaria ?? ""} onChange={(e) => onChange({ fraccion_arancelaria: e.target.value })} placeholder="8471.30.01" style={{ ...INPUT, fontFamily: "monospace" }} />
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descripción de mercancía *">
            <input value={info.descripcion_mercancia ?? ""} onChange={(e) => onChange({ descripcion_mercancia: e.target.value })} placeholder="Computadoras portátiles…" style={INPUT} />
          </Field>
        </div>
      </Grid2>

      {/* IMPO: Cálculo de impuestos */}
      {modalidad === "impo" && (
        <>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginTop: "4px" }}>
            Cálculo de impuestos de importación
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Valor en aduana (USD)">
              <input type="number" value={info.valor_aduana_usd ?? ""} onChange={(e) => onChange({ valor_aduana_usd: Number(e.target.value), igi_calculado: Number(e.target.value) * (info.tipo_cambio ?? 17) * ((info.arancel_pct ?? 0) / 100) })} placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Tipo de cambio">
              <input type="number" value={info.tipo_cambio ?? 17} onChange={(e) => onChange({ tipo_cambio: Number(e.target.value) })} step="0.01" style={INPUT} />
            </Field>
            <Field label="Arancel (%)">
              <input type="number" value={info.arancel_pct ?? 0} onChange={(e) => onChange({ arancel_pct: Number(e.target.value) })} min="0" max="100" style={INPUT} />
            </Field>
          </div>
          {valorAduana > 0 && (
            <InfoBox type="info">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Valor MXN",   value: `$${valorMXN.toLocaleString("es-MX", { maximumFractionDigits: 2 })}` },
                  { label: "IGI",         value: `$${igi.toLocaleString("es-MX", { maximumFractionDigits: 2 })}` },
                  { label: "DTA",         value: `$${dtaCalc.toLocaleString("es-MX", { maximumFractionDigits: 2 })}` },
                  { label: "IVA Impo 16%",value: `$${ivaImpo.toLocaleString("es-MX", { maximumFractionDigits: 2 })}` },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "9px", opacity: 0.8 }}>{item.label}</div>
                    <div style={{ fontSize: "12px", fontWeight: 800 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </InfoBox>
          )}
        </>
      )}

      {/* EXPO */}
      {modalidad === "expo" && (
        <Grid2>
          <Field label="Valor comercial">
            <input type="number" value={info.valor_comercial ?? ""} onChange={(e) => onChange({ valor_comercial: Number(e.target.value) })} placeholder="0.00" style={INPUT} />
          </Field>
          <Field label="Moneda">
            <select value={info.valor_moneda ?? "USD"} onChange={(e) => onChange({ valor_moneda: e.target.value })} style={SELECT}>
              {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" id="cert_origen" checked={!!info.requiere_cert_origen}
              onChange={(e) => onChange({ requiere_cert_origen: e.target.checked })} />
            <label htmlFor="cert_origen" style={{ fontSize: "13px", color: "var(--color-text-second)", cursor: "pointer" }}>
              Requiere certificado de origen
            </label>
          </div>
        </Grid2>
      )}
    </>
  );
}
