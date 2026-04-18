"use client";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS } from "../../../types/quotations.types";
import type { GeneralInfoComercializadora, SKUComercializadora } from "../../../types/quotations.types";

type Props = { info: Partial<GeneralInfoComercializadora>; onChange: (u: Partial<GeneralInfoComercializadora>) => void; };

const EMPTY_SKU = (): SKUComercializadora => ({
  descripcion: "", fraccion: "", cantidad: 1, unidad: "pza",
  precio_venta_unit: 0, moneda: "MXN", iva_pct: 16,
});

export default function GeneralInfoComercializadora({ info, onChange }: Props) {
  const skus = info.skus ?? [EMPTY_SKU()];

  return (
    <>
      <SectionTitle>Comercializadora — Información general</SectionTitle>
      <InfoBox type="warning">
        Los costos de importación son internos — el cliente solo ve el precio de venta nacionalizado.
      </InfoBox>

      <Grid2>
        <Field label="País de origen">
          <input value={info.pais_origen ?? ""} onChange={(e) => onChange({ pais_origen: e.target.value })} placeholder="China, USA…" style={INPUT} />
        </Field>
        <Field label="Incoterm">
          <select value={info.incoterm ?? ""} onChange={(e) => onChange({ incoterm: e.target.value })} style={SELECT}>
            <option value="">—</option>
            {INCOTERMS.map(inc => <option key={inc} value={inc}>{inc}</option>)}
          </select>
        </Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Descripción general de la mercancía">
            <input value={info.mercancia ?? ""} onChange={(e) => onChange({ mercancia: e.target.value })} placeholder="Ej: Electrónicos de consumo…" style={INPUT} />
          </Field>
        </div>
      </Grid2>

      {/* SKUs */}
      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
          Productos a cotizar ({skus.length})
        </div>
        {skus.map((sku, i) => (
          <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>SKU {i + 1}</span>
              {skus.length > 1 && (
                <button onClick={() => onChange({ skus: skus.filter((_, j) => j !== i) })}
                  style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
              )}
            </div>
            <Grid2>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="Descripción *">
                  <input value={sku.descripcion} onChange={(e) => onChange({ skus: skus.map((s, j) => j === i ? { ...s, descripcion: e.target.value } : s) })} placeholder="Nombre del producto" style={INPUT} />
                </Field>
              </div>
              <Field label="Fracción arancelaria">
                <input value={sku.fraccion} onChange={(e) => onChange({ skus: skus.map((s, j) => j === i ? { ...s, fraccion: e.target.value } : s) })} placeholder="8471.30.01" style={{ ...INPUT, fontFamily: "monospace" }} />
              </Field>
              <Field label="Cantidad">
                <input type="number" value={sku.cantidad} min="1" onChange={(e) => onChange({ skus: skus.map((s, j) => j === i ? { ...s, cantidad: Number(e.target.value) } : s) })} style={INPUT} />
              </Field>
              <Field label="Precio venta unit. (al cliente)">
                <input type="number" value={sku.precio_venta_unit} onChange={(e) => onChange({ skus: skus.map((s, j) => j === i ? { ...s, precio_venta_unit: Number(e.target.value) } : s) })} placeholder="0.00" style={INPUT} />
              </Field>
              <Field label="Moneda">
                <select value={sku.moneda} onChange={(e) => onChange({ skus: skus.map((s, j) => j === i ? { ...s, moneda: e.target.value } : s) })} style={SELECT}>
                  {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </Grid2>
          </div>
        ))}
        <button onClick={() => onChange({ skus: [...skus, EMPTY_SKU()] })}
          style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
          + Agregar producto
        </button>
      </div>
    </>
  );
}
