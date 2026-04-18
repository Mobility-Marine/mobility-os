"use client";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS } from "../../../types/quotations.types";
import type { GeneralInfoAereo, BultoItem } from "../../../types/quotations.types";

type Props = { info: Partial<GeneralInfoAereo>; onChange: (u: Partial<GeneralInfoAereo>) => void; };

const EMPTY_BULTO = (): BultoItem => ({ largo_cm: 0, ancho_cm: 0, alto_cm: 0, peso_kg: 0, cantidad: 1 });
const CARRIERS     = ["DHL", "FedEx", "UPS", "Estafeta", "Redpack", "Otro"];

export default function GeneralInfoAereo({ info, onChange }: Props) {
  const subtipo = info.subtipo ?? "carga";
  const bultos  = info.bultos ?? [];

  const pesoReal        = bultos.reduce((s, b) => s + b.peso_kg * b.cantidad, 0);
  const pesoDimensional = bultos.reduce((s, b) => {
    const vol = (b.largo_cm * b.ancho_cm * b.alto_cm) / 6000;
    return s + vol * b.cantidad;
  }, 0);
  const pesoCobrable = Math.max(pesoReal, pesoDimensional);

  return (
    <>
      <SectionTitle>Información general — Aéreo {subtipo === "carga" ? "Carga" : "Courier"}</SectionTitle>

      {/* AEROPUERTOS */}
      <Grid3>
        <Field label="Aeropuerto origen *">
          <input value={info.aeropuerto_origen ?? ""} onChange={(e) => onChange({ aeropuerto_origen: e.target.value })} placeholder="PVG Shanghai" style={INPUT} />
        </Field>
        <Field label="Aeropuerto destino *">
          <input value={info.aeropuerto_destino ?? ""} onChange={(e) => onChange({ aeropuerto_destino: e.target.value })} placeholder="MEX Ciudad de México" style={INPUT} />
        </Field>
        <Field label="Incoterm">
          <select value={info.incoterm ?? ""} onChange={(e) => onChange({ incoterm: e.target.value })} style={SELECT}>
            <option value="">—</option>
            {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
          </select>
        </Field>
      </Grid3>

      {/* MERCANCÍA */}
      <Grid2>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descripción de mercancía *">
            <input value={info.mercancia ?? ""} onChange={(e) => onChange({ mercancia: e.target.value })} placeholder="Componentes electrónicos, muestras…" style={INPUT} />
          </Field>
        </div>
        <Field label="Valor comercial">
          <input type="number" value={info.valor_comercial ?? ""} onChange={(e) => onChange({ valor_comercial: Number(e.target.value) })} placeholder="0.00" style={INPUT} />
        </Field>
        <Field label="Moneda">
          <select value={info.valor_moneda ?? "USD"} onChange={(e) => onChange({ valor_moneda: e.target.value })} style={SELECT}>
            {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </Grid2>

      {/* COURIER: carrier */}
      {subtipo === "courier" && (
        <Field label="Carrier preferente">
          <select value={info.carrier ?? ""} onChange={(e) => onChange({ carrier: e.target.value })} style={SELECT}>
            <option value="">— Sin preferencia —</option>
            {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      )}

      {/* BULTOS */}
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
          Bultos / Piezas
        </div>
        {bultos.map((bulto, i) => (
          <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Bulto {i + 1}</span>
              <button onClick={() => onChange({ bultos: bultos.filter((_, j) => j !== i) })}
                style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
              {[
                { label: "Largo (cm)", key: "largo_cm" },
                { label: "Ancho (cm)", key: "ancho_cm" },
                { label: "Alto (cm)",  key: "alto_cm"  },
                { label: "Peso (kg)",  key: "peso_kg"  },
                { label: "Cantidad",   key: "cantidad"  },
              ].map(({ label, key }) => (
                <Field key={key} label={label}>
                  <input type="number" value={(bulto as any)[key] ?? 0}
                    onChange={(e) => onChange({ bultos: bultos.map((b, j) => j === i ? { ...b, [key]: Number(e.target.value) } : b) })}
                    min="0" style={INPUT} />
                </Field>
              ))}
            </div>
          </div>
        ))}
        <button onClick={() => onChange({ bultos: [...bultos, EMPTY_BULTO()] })}
          style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
          + Agregar bulto
        </button>
        {bultos.length > 0 && (
          <InfoBox type="info">
            <strong>Peso real:</strong> {pesoReal.toFixed(2)} kg &nbsp;·&nbsp;
            <strong>Peso dimensional:</strong> {pesoDimensional.toFixed(2)} kg (L×A×H÷6000) &nbsp;·&nbsp;
            <strong>Peso cobrable:</strong> {pesoCobrable.toFixed(2)} kg
          </InfoBox>
        )}
      </div>
    </>
  );
}
