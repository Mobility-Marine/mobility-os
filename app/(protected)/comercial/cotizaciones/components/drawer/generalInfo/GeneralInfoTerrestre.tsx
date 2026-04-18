"use client";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, TRUCK_TYPES } from "../../../types/quotations.types";
import type { GeneralInfoTerrestre } from "../../../types/quotations.types";

type Props = { info: Partial<GeneralInfoTerrestre>; onChange: (u: Partial<GeneralInfoTerrestre>) => void; };

const EMPTY_RUTA = () => ({ origen: "", destino: "", incoterm: "" });

export default function GeneralInfoTerrestre({ info, onChange }: Props) {
  const subtipo = info.subtipo ?? "ltl";
  const rutas   = info.rutas ?? [EMPTY_RUTA()];

  // LTL: calcular volumen automático
  const volAuto = (info.largo_cm && info.ancho_cm && info.alto_cm)
    ? ((info.largo_cm * info.ancho_cm * info.alto_cm) / 1_000_000).toFixed(3)
    : null;

  return (
    <>
      <SectionTitle>Información general — Terrestre {subtipo.toUpperCase()}</SectionTitle>

      {/* RUTAS */}
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
          Rutas ({rutas.length})
        </div>
        {rutas.map((ruta, i) => (
          <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)" }}>Ruta {i + 1}</span>
              {rutas.length > 1 && (
                <button onClick={() => onChange({ rutas: rutas.filter((_, j) => j !== i) })}
                  style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>
                  Eliminar
                </button>
              )}
            </div>
            <Grid3>
              <Field label="Origen *">
                <input value={ruta.origen} onChange={(e) => onChange({ rutas: rutas.map((r, j) => j === i ? { ...r, origen: e.target.value } : r) })} placeholder="Ciudad, país…" style={INPUT} />
              </Field>
              <Field label="Destino *">
                <input value={ruta.destino} onChange={(e) => onChange({ rutas: rutas.map((r, j) => j === i ? { ...r, destino: e.target.value } : r) })} placeholder="Ciudad, país…" style={INPUT} />
              </Field>
              <Field label="Incoterm">
                <select value={ruta.incoterm ?? ""} onChange={(e) => onChange({ rutas: rutas.map((r, j) => j === i ? { ...r, incoterm: e.target.value } : r) })} style={SELECT}>
                  <option value="">—</option>
                  {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
                </select>
              </Field>
            </Grid3>
          </div>
        ))}
        <button onClick={() => onChange({ rutas: [...rutas, EMPTY_RUTA()] })}
          style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
          + Agregar ruta
        </button>
      </div>

      {/* MERCANCÍA */}
      <Grid2>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descripción de mercancía *">
            <input value={info.mercancia ?? ""} onChange={(e) => onChange({ mercancia: e.target.value })} placeholder="Cajas de cartón, maquinaria, electrónicos…" style={INPUT} />
          </Field>
        </div>
        <Field label="Valor comercial">
          <input type="number" value={info.valor_comercial ?? ""} onChange={(e) => onChange({ valor_comercial: Number(e.target.value) })} placeholder="0.00" style={INPUT} />
        </Field>
        <Field label="Moneda valor">
          <select value={info.valor_moneda ?? "USD"} onChange={(e) => onChange({ valor_moneda: e.target.value })} style={SELECT}>
            {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Peso total (kg)">
          <input type="number" value={info.peso_kg ?? ""} onChange={(e) => onChange({ peso_kg: Number(e.target.value) })} placeholder="0" style={INPUT} />
        </Field>
      </Grid2>

      {/* LTL: dimensiones + volumen automático */}
      {subtipo === "ltl" && (
        <>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", marginTop: "4px" }}>
            Dimensiones (para cálculo de volumen)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
            <Field label="Largo (cm)">
              <input type="number" value={info.largo_cm ?? ""} onChange={(e) => onChange({ largo_cm: Number(e.target.value) })} placeholder="0" style={INPUT} />
            </Field>
            <Field label="Ancho (cm)">
              <input type="number" value={info.ancho_cm ?? ""} onChange={(e) => onChange({ ancho_cm: Number(e.target.value) })} placeholder="0" style={INPUT} />
            </Field>
            <Field label="Alto (cm)">
              <input type="number" value={info.alto_cm ?? ""} onChange={(e) => onChange({ alto_cm: Number(e.target.value) })} placeholder="0" style={INPUT} />
            </Field>
            <Field label="Piezas">
              <input type="number" value={info.piezas ?? ""} onChange={(e) => onChange({ piezas: Number(e.target.value) })} placeholder="0" style={INPUT} />
            </Field>
          </div>
          {volAuto && (
            <InfoBox type="info">
              Volumen calculado: <strong>{volAuto} m³</strong>
              {info.piezas && info.piezas > 1 ? ` × ${info.piezas} piezas = ${(parseFloat(volAuto) * info.piezas).toFixed(3)} m³ total` : ""}
            </InfoBox>
          )}
        </>
      )}

      {/* FTL: tipo y cantidad de unidades */}
      {subtipo === "ftl" && (
        <Grid2>
          <Field label="Tipo de unidad *">
            <select value={info.tipo_unidad ?? ""} onChange={(e) => onChange({ tipo_unidad: e.target.value })} style={SELECT}>
              <option value="">— Seleccionar —</option>
              {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Cantidad de unidades">
            <input type="number" value={info.cantidad_unidades ?? 1} onChange={(e) => onChange({ cantidad_unidades: Number(e.target.value) })} min="1" style={INPUT} />
          </Field>
        </Grid2>
      )}
    </>
  );
}
