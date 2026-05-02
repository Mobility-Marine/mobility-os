"use client";

import { useState, useEffect } from "react";
import type { CartaPorteData, CartaPorteMercancia } from "../../types/carta_porte.types";
import { newMercancia } from "../../types/carta_porte.defaults";

interface Props {
  data: CartaPorteData;
  setMercancias: (next: CartaPorteMercancia[]) => void;
  setMercanciasAgregado: (next: CartaPorteData["mercancias_agregado"]) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function MercanciasSection({ data, setMercancias, setMercanciasAgregado, showValidation, errors }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(data.mercancias[0]?._temp_id ?? null);
  const [activeTab, setActiveTab] = useState<Record<string, "datos" | "peligroso" | "cofepris" | "comercio">>({});

  // Auto-cálculo de peso bruto y total mercancías
  useEffect(() => {
    const totalPeso = data.mercancias.reduce((sum, m) => sum + (m.peso_en_kg || 0), 0);
    if (totalPeso !== data.mercancias_agregado.peso_bruto_total ||
        data.mercancias.length !== data.mercancias_agregado.num_total_mercancias) {
      setMercanciasAgregado({
        ...data.mercancias_agregado,
        peso_bruto_total: totalPeso,
        num_total_mercancias: data.mercancias.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.mercancias]);

  const isInternational = data.header.transp_internac === "Sí";

  const updateMerc = (id: string, patch: Partial<CartaPorteMercancia>) => {
    setMercancias(data.mercancias.map(m => m._temp_id === id ? { ...m, ...patch } : m));
  };

  const addMerc = () => {
    const n = newMercancia();
    setMercancias([...data.mercancias, n]);
    setExpandedId(n._temp_id);
  };

  const removeMerc = (id: string) => {
    if (data.mercancias.length <= 1) return;
    setMercancias(data.mercancias.filter(m => m._temp_id !== id));
  };

  const tabFor = (id: string) => activeTab[id] ?? "datos";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "820px" }}>

      <div style={BANNER}>
        Mercancía a transportar. Cada mercancía con clave SAT, descripción, peso y datos especiales si aplica
        (peligrosa, COFEPRIS, comercio exterior).
      </div>

      {/* Resumen */}
      <div style={{
        padding: "12px 14px", borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px",
      }}>
        <Stat label="Total mercancías" value={String(data.mercancias.length)} />
        <Stat label="Peso bruto total" value={`${data.mercancias_agregado.peso_bruto_total.toLocaleString("es-MX")} ${data.mercancias_agregado.unidad_peso}`} />
        <FieldS label="Unidad de peso">
          <select
            value={data.mercancias_agregado.unidad_peso}
            onChange={e => setMercanciasAgregado({ ...data.mercancias_agregado, unidad_peso: e.target.value })}
            style={INPUT}
          >
            <option value="KGM">KGM — Kilogramo</option>
            <option value="LBR">LBR — Libra</option>
            <option value="TNE">TNE — Tonelada</option>
          </select>
        </FieldS>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Mercancías capturadas
        </div>
        <button type="button" onClick={addMerc} style={BUTTON_GHOST}>+ Agregar mercancía</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.mercancias.map((m, idx) => {
          const errCount = showValidation
            ? errors.filter(e => e.field.includes(`mercancias[${idx}]`)).length
            : 0;
          const isExpanded = expandedId === m._temp_id;

          return (
            <div key={m._temp_id} style={{
              borderRadius: "var(--radius-md)", overflow: "hidden",
              background: "var(--color-bg-subtle)",
              border: isExpanded ? "1px solid var(--color-brand-blue)" : (errCount > 0 ? "1px solid #dc2626" : "1px solid var(--color-border-faint)"),
            }}>
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : m._temp_id)}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", gap: "10px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={NUM_BADGE}>{idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.descripcion || "Sin descripción"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {m.cantidad} {m.unidad ?? m.clave_unidad} · {m.peso_en_kg.toLocaleString("es-MX")} kg
                  </div>
                </div>
                {errCount > 0 && !isExpanded && (
                  <span style={ERROR_BADGE}>{errCount}</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div style={{ borderTop: "1px solid var(--color-border-faint)" }}>
                  {/* Tabs */}
                  <div style={{
                    padding: "8px 14px",
                    display: "flex", gap: "4px",
                    borderBottom: "1px solid var(--color-border-faint)",
                    overflowX: "auto",
                  }}>
                    <Tab active={tabFor(m._temp_id) === "datos"} onClick={() => setActiveTab(s => ({ ...s, [m._temp_id]: "datos" }))}>Datos básicos</Tab>
                    <Tab active={tabFor(m._temp_id) === "peligroso"} onClick={() => setActiveTab(s => ({ ...s, [m._temp_id]: "peligroso" }))}>
                      {m.material_peligroso ? "⚠ Peligroso" : "Peligroso"}
                    </Tab>
                    <Tab active={tabFor(m._temp_id) === "cofepris"} onClick={() => setActiveTab(s => ({ ...s, [m._temp_id]: "cofepris" }))}>COFEPRIS</Tab>
                    {isInternational && (
                      <Tab active={tabFor(m._temp_id) === "comercio"} onClick={() => setActiveTab(s => ({ ...s, [m._temp_id]: "comercio" }))}>Comercio Ext.</Tab>
                    )}
                  </div>

                  <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {tabFor(m._temp_id) === "datos" && (
                      <>
                        <FieldS label="Descripción" required>
                          <input type="text" value={m.descripcion}
                            onChange={e => updateMerc(m._temp_id, { descripcion: e.target.value })}
                            placeholder="Ej: Cajas de equipo electrónico"
                            style={INPUT} />
                        </FieldS>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                          <FieldS label="Bienes transp (clave SAT)" required hint="Catálogo c_ClaveProdServCP">
                            <input type="text" value={m.bienes_transp}
                              onChange={e => updateMerc(m._temp_id, { bienes_transp: e.target.value.toUpperCase() })}
                              maxLength={8}
                              style={{ ...INPUT, fontFamily: "monospace" }} />
                          </FieldS>
                          <FieldS label="Clave unidad" required>
                            <input type="text" value={m.clave_unidad}
                              onChange={e => updateMerc(m._temp_id, { clave_unidad: e.target.value.toUpperCase() })}
                              maxLength={3}
                              style={{ ...INPUT, fontFamily: "monospace" }} />
                          </FieldS>
                          <FieldS label="Unidad descriptiva">
                            <input type="text" value={m.unidad ?? ""}
                              onChange={e => updateMerc(m._temp_id, { unidad: e.target.value || undefined })}
                              style={INPUT} />
                          </FieldS>
                          <FieldS label="Cantidad" required>
                            <input type="number" min="0" step="0.001" value={m.cantidad || ""}
                              onChange={e => updateMerc(m._temp_id, { cantidad: parseFloat(e.target.value) || 0 })}
                              style={{ ...INPUT, textAlign: "right" }} />
                          </FieldS>
                          <FieldS label="Peso en kg" required>
                            <input type="number" min="0" step="0.001" value={m.peso_en_kg || ""}
                              onChange={e => updateMerc(m._temp_id, { peso_en_kg: parseFloat(e.target.value) || 0 })}
                              style={{ ...INPUT, textAlign: "right" }} />
                          </FieldS>
                          <FieldS label="Valor mercancía">
                            <input type="number" min="0" step="0.01" value={m.valor_mercancia ?? ""}
                              onChange={e => updateMerc(m._temp_id, { valor_mercancia: parseFloat(e.target.value) || undefined })}
                              style={{ ...INPUT, textAlign: "right" }} />
                          </FieldS>
                          <FieldS label="Moneda">
                            <select value={m.moneda ?? "MXN"}
                              onChange={e => updateMerc(m._temp_id, { moneda: e.target.value })}
                              style={INPUT}>
                              <option value="MXN">MXN</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </FieldS>
                          <FieldS label="Embalaje">
                            <input type="text" value={m.embalaje ?? ""}
                              onChange={e => updateMerc(m._temp_id, { embalaje: e.target.value || undefined })}
                              maxLength={2}
                              style={INPUT} />
                          </FieldS>
                        </div>
                      </>
                    )}

                    {tabFor(m._temp_id) === "peligroso" && (
                      <>
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                          <input type="checkbox" checked={m.material_peligroso}
                            onChange={e => updateMerc(m._temp_id, { material_peligroso: e.target.checked })} />
                          <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: 600 }}>
                            Esta mercancía es material peligroso
                          </span>
                        </label>
                        {m.material_peligroso && (
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                            <FieldS label="Clave material peligroso" required hint="Catálogo c_MaterialPeligroso">
                              <input type="text" value={m.cve_material_peligroso ?? ""}
                                onChange={e => updateMerc(m._temp_id, { cve_material_peligroso: e.target.value.toUpperCase() || undefined })}
                                style={{ ...INPUT, fontFamily: "monospace" }} />
                            </FieldS>
                            <FieldS label="Descripción embalaje">
                              <input type="text" value={m.desc_embalaje ?? ""}
                                onChange={e => updateMerc(m._temp_id, { desc_embalaje: e.target.value || undefined })}
                                style={INPUT} />
                            </FieldS>
                          </div>
                        )}
                        {!m.material_peligroso && (
                          <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "12px", textAlign: "center" }}>
                            Activa el checkbox si la mercancía es material peligroso (combustibles, químicos, etc.)
                          </div>
                        )}
                      </>
                    )}

                    {tabFor(m._temp_id) === "cofepris" && (
                      <>
                        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                          Solo aplica para medicamentos, plaguicidas, sustancias químicas o productos regulados por COFEPRIS.
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                          <FieldS label="Sector COFEPRIS">
                            <select value={m.sector_cofepris ?? ""}
                              onChange={e => updateMerc(m._temp_id, { sector_cofepris: e.target.value || undefined })}
                              style={INPUT}>
                              <option value="">No aplica</option>
                              <option value="01">01 — Medicamentos</option>
                              <option value="02">02 — Plaguicidas</option>
                              <option value="03">03 — Precursores químicos</option>
                              <option value="04">04 — Sustancias químicas</option>
                              <option value="05">05 — Productos biotecnológicos</option>
                            </select>
                          </FieldS>
                          <FieldS label="Reg. sanitario / Folio">
                            <input type="text" value={m.registro_sanitario_folio_autorizacion ?? ""}
                              onChange={e => updateMerc(m._temp_id, { registro_sanitario_folio_autorizacion: e.target.value || undefined })}
                              style={INPUT} />
                          </FieldS>
                          <FieldS label="Fabricante">
                            <input type="text" value={m.fabricante ?? ""}
                              onChange={e => updateMerc(m._temp_id, { fabricante: e.target.value || undefined })}
                              style={INPUT} />
                          </FieldS>
                          <FieldS label="Lote medicamento">
                            <input type="text" value={m.lote_medicamento ?? ""}
                              onChange={e => updateMerc(m._temp_id, { lote_medicamento: e.target.value || undefined })}
                              style={INPUT} />
                          </FieldS>
                          <FieldS label="Fecha caducidad">
                            <input type="date" value={m.fecha_caducidad ?? ""}
                              onChange={e => updateMerc(m._temp_id, { fecha_caducidad: e.target.value || undefined })}
                              style={INPUT} />
                          </FieldS>
                        </div>
                      </>
                    )}

                    {tabFor(m._temp_id) === "comercio" && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                        <FieldS label="Fracción arancelaria">
                          <input type="text" value={m.fraccion_arancelaria ?? ""}
                            onChange={e => updateMerc(m._temp_id, { fraccion_arancelaria: e.target.value || undefined })}
                            maxLength={10}
                            style={{ ...INPUT, fontFamily: "monospace" }} />
                        </FieldS>
                        <FieldS label="UUID Comercio Ext.">
                          <input type="text" value={m.uuid_comercio_ext ?? ""}
                            onChange={e => updateMerc(m._temp_id, { uuid_comercio_ext: e.target.value || undefined })}
                            style={{ ...INPUT, fontFamily: "monospace", fontSize: "11px" }} />
                        </FieldS>
                        <FieldS label="Tipo materia">
                          <select value={m.tipo_materia ?? ""}
                            onChange={e => updateMerc(m._temp_id, { tipo_materia: e.target.value || undefined })}
                            style={INPUT}>
                            <option value="">No aplica</option>
                            <option value="01">01 — Materia prima</option>
                            <option value="02">02 — Productos terminados</option>
                            <option value="03">03 — Productos semi-terminados</option>
                            <option value="04">04 — Otra</option>
                          </select>
                        </FieldS>
                      </div>
                    )}

                    {data.mercancias.length > 1 && (
                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
                        <button type="button" onClick={() => removeMerc(m._temp_id)} style={BUTTON_DANGER}>
                          Eliminar mercancía
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const BANNER: React.CSSProperties = {
  padding: "12px 14px", borderRadius: "var(--radius-md)",
  background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
  fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5,
};
const BUTTON_GHOST: React.CSSProperties = {
  height: "30px", padding: "0 10px", fontSize: "11px", fontWeight: 600,
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)", color: "var(--color-text-second)", cursor: "pointer",
};
const BUTTON_DANGER: React.CSSProperties = {
  padding: "6px 12px", fontSize: "11px", fontWeight: 600,
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)", cursor: "pointer",
};
const NUM_BADGE: React.CSSProperties = {
  width: "26px", height: "26px", borderRadius: "var(--radius-md)",
  background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "11px", fontWeight: 700, color: "var(--color-text-second)", flexShrink: 0,
};
const ERROR_BADGE: React.CSSProperties = {
  padding: "2px 7px", borderRadius: "10px",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)",
  fontSize: "10px", fontWeight: 700, flexShrink: 0,
};

function FieldS({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        height: "28px", padding: "0 10px", fontSize: "11px", fontWeight: 600,
        borderRadius: "var(--radius-md)",
        border: active ? "1px solid var(--color-brand-blue)" : "1px solid transparent",
        background: active ? "var(--color-brand-blue)" : "transparent",
        color: active ? "#fff" : "var(--color-text-muted)",
        cursor: "pointer", whiteSpace: "nowrap",
      }}>
      {children}
    </button>
  );
}
