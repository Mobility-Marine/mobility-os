"use client";
import { Field, SectionTitle, INPUT, SELECT, InfoBox } from "../drawerShared";
import { INCOTERMS, CONTAINER_TYPES, CURRENCIES } from "../../../types/quotations.types";
import type { BillingConceptDraft } from "../drawerState";
import StepConceptos from "../steps/StepConceptos";

type Contenedor = { tipo: string; cantidad: number };
type Bulto      = { largo_cm: string; ancho_cm: string; alto_cm: string; peso_kg: string; cantidad: string };

export interface MaritimoInfo {
  subtipo:         "fcl" | "lcl";
  puerto_origen:   string;
  puerto_destino:  string;
  incoterm:        string;
  mercancia:       string;
  valor_comercial: string;
  valor_moneda:    string;
  peso_kg:         string;
  contenedores:    Contenedor[];
  bultos:          Bulto[];
}

const EMPTY_CONTENEDOR = (): Contenedor => ({ tipo: "40'HC", cantidad: 1 });
const EMPTY_BULTO      = (): Bulto      => ({ largo_cm: "", ancho_cm: "", alto_cm: "", peso_kg: "", cantidad: "1" });

export const EMPTY_MARITIMO_INFO = (): MaritimoInfo => ({
  subtipo: "fcl", puerto_origen: "", puerto_destino: "", incoterm: "",
  mercancia: "", valor_comercial: "", valor_moneda: "USD", peso_kg: "",
  contenedores: [EMPTY_CONTENEDOR()], bultos: [],
});

type Props = {
  info:               MaritimoInfo;
  setInfo:            React.Dispatch<React.SetStateAction<MaritimoInfo>>;
  billingConcepts:    BillingConceptDraft[];
  setBillingConcepts: React.Dispatch<React.SetStateAction<BillingConceptDraft[]>>;
  svcCatalog:         any[];
};

export default function ContentMaritimo({ info, setInfo, billingConcepts, setBillingConcepts, svcCatalog }: Props) {

  // Cálculos automáticos
  const totalContenedores = info.contenedores.reduce((s, c) => s + c.cantidad, 0);
  const cbmTotal  = info.bultos.reduce((s, b) => s + (Number(b.largo_cm) * Number(b.ancho_cm) * Number(b.alto_cm) / 1_000_000) * Number(b.cantidad || 1), 0);
  const pesoTotal = info.bultos.reduce((s, b) => s + Number(b.peso_kg) * Number(b.cantidad || 1), 0);
  const wmTotal   = Math.max(cbmTotal, pesoTotal / 1000);

  // Al cambiar subtipo, actualizar defaults del lineForm

  // Actualizar cantidad automática cuando cambian contenedores o W/M

  const unitOptions = info.subtipo === "fcl" ? UNITS_FCL : UNITS_LCL;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── SUBTIPO ── */}
      <div>
        <SectionTitle>Tipo de servicio marítimo</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
          {(["fcl","lcl"] as const).map(sub => (
            <button key={sub} onClick={() => setInfo(p => ({ ...p, subtipo: sub }))}
              style={{ padding: "14px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: info.subtipo === sub ? "var(--color-info-bg)" : "var(--color-bg-subtle)", border: `2px solid ${info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-border-faint)"}` }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: info.subtipo === sub ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>
                {sub === "fcl" ? "FCL — Full Container Load" : "LCL — Less than Container Load"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                {sub === "fcl" ? "Contenedor(es) completo(s) dedicados" : "Carga consolidada — se cobra por W/M"}
              </div>
            </button>
          ))}
        </div>
      </div>

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

      {/* ── FCL: Contenedores ── */}
      {info.subtipo === "fcl" && (
        <div>
          <SectionTitle>Contenedores a cotizar</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {info.contenedores.map((cont, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: "8px", alignItems: "flex-end" }}>
                <Field label={i === 0 ? "Tipo de contenedor" : ""}>
                  <select value={cont.tipo} onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, tipo: e.target.value } : c) }))} style={SELECT}>
                    {CONTAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label={i === 0 ? "Cantidad" : ""}>
                  <input type="number" min="1" value={cont.cantidad}
                    onChange={e => setInfo(p => ({ ...p, contenedores: p.contenedores.map((c, j) => j === i ? { ...c, cantidad: Number(e.target.value) } : c) }))}
                    style={INPUT} />
                </Field>
                {info.contenedores.length > 1 && (
                  <button onClick={() => setInfo(p => ({ ...p, contenedores: p.contenedores.filter((_, j) => j !== i) }))}
                    style={{ height: "36px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", cursor: "pointer", fontSize: "12px" }}>✕</button>
                )}
              </div>
            ))}
            <button onClick={() => setInfo(p => ({ ...p, contenedores: [...p.contenedores, EMPTY_CONTENEDOR()] }))}
              style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
              + Agregar tipo de contenedor
            </button>
            {totalContenedores > 0 && (
              <InfoBox type="info">
                Total: <strong>{totalContenedores} contenedor{totalContenedores !== 1 ? "es" : ""}</strong> — la cantidad en los conceptos se asignará automáticamente
              </InfoBox>
            )}
          </div>
        </div>
      )}

      {/* ── LCL: Bultos ── */}
      {info.subtipo === "lcl" && (
        <div>
          <SectionTitle>Bultos / Partidas</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {info.bultos.map((bulto, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)" }}>Bulto {i + 1}</span>
                  <button onClick={() => setInfo(p => ({ ...p, bultos: p.bultos.filter((_, j) => j !== i) }))}
                    style={{ fontSize: "10px", color: "var(--color-danger-text)", background: "none", border: "none", cursor: "pointer" }}>Eliminar</button>
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
            <button onClick={() => setInfo(p => ({ ...p, bultos: [...p.bultos, EMPTY_BULTO()] }))}
              style={{ height: "32px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)", fontSize: "12px", color: "var(--color-text-muted)", cursor: "pointer" }}>
              + Agregar bulto
            </button>
            {cbmTotal > 0 && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>CBM Total</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{cbmTotal.toFixed(3)} m³</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-info-text)", fontWeight: 600, textTransform: "uppercase" }}>Peso Total</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-info-text)" }}>{pesoTotal.toFixed(0)} kg</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-brand-blue)", fontWeight: 700, textTransform: "uppercase" }}>W/M Cobrable</div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)" }}>{wmTotal.toFixed(3)}</div>
                  <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>lo mayor entre CBM y toneladas</div>
                </div>
              </div>
            )}
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