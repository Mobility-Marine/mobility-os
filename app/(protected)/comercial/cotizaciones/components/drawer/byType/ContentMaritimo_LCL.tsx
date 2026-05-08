"use client";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

// ── Tipos ──────────────────────────────────────────────────────
type Bulto = { largo_cm: string; ancho_cm: string; alto_cm: string; peso_kg: string; cantidad: string };

export interface MaritimoLCLInfo {
  puerto_origen:   string;
  puerto_destino:  string;
  incoterm:        string;
  mercancia:       string;
  valor_comercial: string;
  valor_moneda:    string;
  bultos:          Bulto[];
}

export const EMPTY_MARITIMO_LCL_INFO = (): MaritimoLCLInfo => ({
  puerto_origen: "", puerto_destino: "", incoterm: "",
  mercancia: "", valor_comercial: "", valor_moneda: "USD",
  bultos: [{ largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" }],
});

type Props = {
  info:               MaritimoLCLInfo;
  setInfo:            React.Dispatch<React.SetStateAction<MaritimoLCLInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentMaritimo_LCL({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {

  // Cálculos automáticos de bultos
  const cbmTotal  = info.bultos.reduce((s, b) => {
    const vol = (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm)) / 1_000_000;
    return s + vol * Number(b.cantidad || 1);
  }, 0);
  const pesoTotal = info.bultos.reduce((s, b) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
  const wmTotal   = Math.max(cbmTotal, pesoTotal / 1000);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── PUERTOS ── */}
      <div>
        <SectionTitle>Puertos e Incoterm</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "8px" }}>
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

      {/* ── MERCANCÍA ── */}
      <div>
        <SectionTitle>Mercancía</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Field label="Descripción *">
            <input value={info.mercancia} onChange={e => setInfo(p => ({ ...p, mercancia: e.target.value }))} placeholder="Electrónicos, textiles, maquinaria…" style={INPUT} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <Field label="Valor comercial">
              <input type="number" value={info.valor_comercial} onChange={e => setInfo(p => ({ ...p, valor_comercial: e.target.value }))} placeholder="0.00" style={INPUT} />
            </Field>
            <Field label="Moneda valor">
              <select value={info.valor_moneda} onChange={e => setInfo(p => ({ ...p, valor_moneda: e.target.value }))} style={SELECT}>
                {["USD","MXN","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </div>

      {/* ── BULTOS ── */}
      <div>
        <SectionTitle>Bultos / Partidas</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          {info.bultos.map((bulto, i) => (
            <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Bulto {i + 1}</span>
                {info.bultos.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, bultos: p.bultos.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: "8px" }}>
                {(["largo_cm","ancho_cm","alto_cm","peso_kg","cantidad"] as const).map(key => (
                  <Field key={key} label={key === "largo_cm" ? "Largo (cm)" : key === "ancho_cm" ? "Ancho (cm)" : key === "alto_cm" ? "Alto (cm)" : key === "peso_kg" ? "Peso (kg)" : "Cantidad"}>
                    <input type="number" value={bulto[key]} min="0"
                      onChange={e => setInfo(p => ({ ...p, bultos: p.bultos.map((b, j) => j === i ? { ...b, [key]: e.target.value } : b) }))}
                      style={INPUT} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setInfo(p => ({ ...p, bultos: [...p.bultos, { largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" }] }))}
            style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
            + Agregar bulto
          </button>

          {/* Resumen cálculo */}
          {cbmTotal > 0 && (
            <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>CBM Total</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-info-text)" }}>{cbmTotal.toFixed(3)} m³</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase", marginBottom: "2px" }}>Peso Total</div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoTotal.toFixed(0)} kg</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>= {(pesoTotal / 1000).toFixed(3)} ton</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>W/M Cobrable</div>
                <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{wmTotal.toFixed(3)}</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>lo mayor entre CBM y toneladas</div>
              </div>
            </div>
          )}
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