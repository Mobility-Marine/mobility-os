"use client";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CONTAINER_TYPES } from "../../../types/quotations.types";
import type { GeneralInfoMaritimo, BultoItem } from "../../../types/quotations.types";

type Props = { info: Partial<GeneralInfoMaritimo>; onChange: (u: Partial<GeneralInfoMaritimo>) => void; };

const EMPTY_BULTO = (): BultoItem => ({ largo_cm: 0, ancho_cm: 0, alto_cm: 0, peso_kg: 0, cantidad: 1 });

export default function GeneralInfoMaritimo({ info, onChange }: Props) {
  const subtipo = info.subtipo ?? "fcl";
  const bultos  = info.bultos ?? [];
  const contenedores = info.contenedores ?? [{ tipo: "40'HC", cantidad: 1 }];

  // Calcular CBM total y peso total para LCL
  const cbmTotal  = bultos.reduce((s, b) => s + ((b.largo_cm * b.ancho_cm * b.alto_cm) / 1_000_000) * b.cantidad, 0);
  const pesoTotal = bultos.reduce((s, b) => s + b.peso_kg * b.cantidad, 0);
  const wmTotal   = Math.max(cbmTotal, pesoTotal / 1000);

  return (
    <>
      <SectionTitle>Información general — Marítimo {subtipo.toUpperCase()}</SectionTitle>

      {/* PUERTOS */}
      <Grid3>
        <Field label="Puerto de origen *">
          <input value={info.puerto_origen ?? ""} onChange={(e) => onChange({ puerto_origen: e.target.value })} placeholder="Shanghai, China" style={INPUT} />
        </Field>
        <Field label="Puerto de destino *">
          <input value={info.puerto_destino ?? ""} onChange={(e) => onChange({ puerto_destino: e.target.value })} placeholder="Manzanillo, México" style={INPUT} />
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
            <input value={info.mercancia ?? ""} onChange={(e) => onChange({ mercancia: e.target.value })} placeholder="Electrónicos, textiles, maquinaria…" style={INPUT} />
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
        <Field label="Peso total (kg)">
          <input type="number" value={info.peso_kg ?? ""} onChange={(e) => onChange({ peso_kg: Number(e.target.value) })} placeholder="0" style={INPUT} />
        </Field>
      </Grid2>

      {/* FCL: Contenedores */}
      {subtipo === "fcl" && (
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Contenedores
          </div>
          {contenedores.map((cont, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
              <Field label={i === 0 ? "Tipo de contenedor" : ""}>
                <select value={cont.tipo} onChange={(e) => onChange({ contenedores: contenedores.map((c, j) => j === i ? { ...c, tipo: e.target.value } : c) })} style={SELECT}>
                  {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label={i === 0 ? "Cantidad" : ""}>
                <input type="number" value={cont.cantidad} min="1" onChange={(e) => onChange({ contenedores: contenedores.map((c, j) => j === i ? { ...c, cantidad: Number(e.target.value) } : c) })} style={INPUT} />
              </Field>
              {contenedores.length > 1 && (
                <button onClick={() => onChange({ contenedores: contenedores.filter((_, j) => j !== i) })}
                  style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer", fontSize: "11px" }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={() => onChange({ contenedores: [...contenedores, { tipo: "40'HC", cantidad: 1 }] })}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar tipo de contenedor
          </button>
        </div>
      )}

      {/* LCL: Bultos con cálculo automático */}
      {subtipo === "lcl" && (
        <div style={{ display: "grid", gap: "8px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Bultos / Partidas
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
              <strong>CBM total:</strong> {cbmTotal.toFixed(3)} m³ &nbsp;·&nbsp;
              <strong>Peso total:</strong> {pesoTotal.toFixed(0)} kg ({(pesoTotal/1000).toFixed(3)} ton) &nbsp;·&nbsp;
              <strong>W/M cobrable:</strong> {wmTotal.toFixed(3)} (lo mayor entre CBM y toneladas)
            </InfoBox>
          )}
        </div>
      )}
    </>
  );
}
