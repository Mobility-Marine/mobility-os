"use client";
import { Field, Grid2, Grid3, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, TRUCK_TYPES, CURRENCIES, SERVICE_TYPES, SERVICE_TYPE_CONFIG } from "../../../types/quotations.types";
import type { ServiceType } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import { useTranslation } from "@/lib/i18n/useTranslation";
import StepConceptos from "../steps/StepConceptos";

type Ruta = { origen: string; destino: string; incoterm: string };

interface TerrestreInfo {
  subtipo:            "ltl" | "ftl";
  rutas:              Ruta[];
  mercancia:          string;
  valor_comercial:    string;
  valor_moneda:       string;
  peso_kg:            string;
  // LTL
  largo_cm:           string;
  ancho_cm:           string;
  alto_cm:            string;
  piezas:             string;
  // FTL
  tipo_unidad:        string;
  cantidad_unidades:  string;
}

const EMPTY_RUTA = (): Ruta => ({ origen: "", destino: "", incoterm: "" });
const EMPTY_INFO = (): TerrestreInfo => ({
  subtipo: "ftl", rutas: [EMPTY_RUTA()],
  mercancia: "", valor_comercial: "", valor_moneda: "USD", peso_kg: "",
  largo_cm: "", ancho_cm: "", alto_cm: "", piezas: "",
  tipo_unidad: "", cantidad_unidades: "1",
});

const UNIT_LABELS = ["Por servicio","Por contenedor","Por BL","Por pedimento","Por factura","Por kg","Por tonelada","Por m³","Por W/M","Por pieza","Por embarque","Por trámite"];

type Props = {
  info:               TerrestreInfo;
  setInfo:            React.Dispatch<React.SetStateAction<TerrestreInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export type { TerrestreInfo };
export { EMPTY_INFO as EMPTY_TERRESTRE_INFO };

export default function ContentTerrestre({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {
  const { t } = useTranslation();

  const volAuto = (info.largo_cm && info.ancho_cm && info.alto_cm)
    ? ((Number(info.largo_cm) * Number(info.ancho_cm) * Number(info.alto_cm)) / 1_000_000).toFixed(3)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── SUBTIPO ── */}
      <div>
        <SectionTitle>Tipo de servicio terrestre</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {(["ltl","ftl"] as const).map(sub => (
            <button key={sub} onClick={() => setInfo(p => ({ ...p, subtipo: sub }))}
              style={{ padding: "14px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.subtipo === sub ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>
                {sub === "ltl" ? "LTL — Carga parcial" : "FTL — Carga completa"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                {sub === "ltl" ? "Espacio compartido, múltiples rutas" : "Unidad dedicada, mayor capacidad"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RUTAS ── */}
      <div>
        <SectionTitle>Rutas ({info.rutas.length})</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {info.rutas.map((ruta, i) => (
            <div key={i} style={{ padding: "12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Ruta {i + 1}</span>
                {info.rutas.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, rutas: p.rutas.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <Field label="Origen *">
                  <input value={ruta.origen} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, origen: e.target.value } : r) }))} placeholder="Ciudad, país" style={INPUT} />
                </Field>
                <Field label="Destino *">
                  <input value={ruta.destino} onChange={e => setInfo(p => ({ ...p, rutas: p.rutas.map((r, j) => j === i ? { ...r, destino: e.target.value } : r) }))} placeholder="Ciudad, país" style={INPUT} />
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
          <button onClick={() => setInfo(p => ({ ...p, rutas: [...p.rutas, EMPTY_RUTA()] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar ruta
          </button>
        </div>
      </div>

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía y peso</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción de mercancía *">
            <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))} placeholder="Cajas de cartón, maquinaria, electrónicos…" style={INPUT} />
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

      {/* ── LTL: Dimensiones ── */}
      {info.subtipo === "ltl" && (
        <div>
          <SectionTitle>Dimensiones (cálculo de volumen)</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
              <Field label="Largo (cm)"><input type="number" value={info.largo_cm} onChange={e => setInfo(p => ({ ...p, largo_cm: e.target.value }))} style={INPUT} /></Field>
              <Field label="Ancho (cm)"><input type="number" value={info.ancho_cm} onChange={e => setInfo(p => ({ ...p, ancho_cm: e.target.value }))} style={INPUT} /></Field>
              <Field label="Alto (cm)"><input type="number" value={info.alto_cm} onChange={e => setInfo(p => ({ ...p, alto_cm: e.target.value }))} style={INPUT} /></Field>
              <Field label="Piezas"><input type="number" value={info.piezas} onChange={e => setInfo(p => ({ ...p, piezas: e.target.value }))} style={INPUT} /></Field>
            </div>
            {volAuto && (
              <InfoBox type="info">
                Volumen: <strong>{volAuto} m³</strong>
                {info.piezas && Number(info.piezas) > 1 ? ` × ${info.piezas} = ${(parseFloat(volAuto) * Number(info.piezas)).toFixed(3)} m³ total` : ""}
              </InfoBox>
            )}
          </div>
        </div>
      )}

      {/* ── FTL: Unidad ── */}
      {info.subtipo === "ftl" && (
        <div>
          <SectionTitle>Unidad de transporte</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "8px", marginTop: "8px" }}>
            <Field label="Tipo de unidad *">
              <select value={info.tipo_unidad} onChange={e => setInfo(p => ({ ...p, tipo_unidad: e.target.value }))} style={SELECT}>
                <option value="">— Seleccionar —</option>
                {TRUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Cantidad">
              <input type="number" value={info.cantidad_unidades} min="1" onChange={e => setInfo(p => ({ ...p, cantidad_unidades: e.target.value }))} style={INPUT} />
            </Field>
          </div>
        </div>
      )}

      <StepConceptos
        billingConcepts={billingConcepts}
        setBillingConcepts={setBillingConcepts}
        svcCatalog={svcCatalog}
      />
    </div>
  );
}