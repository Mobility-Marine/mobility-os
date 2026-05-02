"use client";

import { useState } from "react";
import type { CartaPorteData, CartaPorteFigura } from "../../types/carta_porte.types";
import { newFigura } from "../../types/carta_porte.defaults";

const TIPOS_FIGURA = [
  { code: "01", label: "Operador", desc: "Persona que conduce el vehículo" },
  { code: "02", label: "Propietario", desc: "Dueño del vehículo o transporte" },
  { code: "03", label: "Arrendatario", desc: "Quien alquila el vehículo o transporte" },
  { code: "04", label: "Notificado", desc: "Persona a notificar a la entrega" },
];

interface Props {
  data: CartaPorteData;
  setFiguras: (next: CartaPorteFigura[]) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function FigurasSection({ data, setFiguras, showValidation, errors }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(data.figuras[0]?._temp_id ?? null);

  const updateFig = (id: string, patch: Partial<CartaPorteFigura>) => {
    setFiguras(data.figuras.map(f => f._temp_id === id ? { ...f, ...patch } : f));
  };

  const updateDom = (id: string, patch: Partial<NonNullable<CartaPorteFigura["domicilio"]>>) => {
    setFiguras(data.figuras.map(f =>
      f._temp_id === id ? { ...f, domicilio: { ...(f.domicilio ?? { codigo_postal: "", estado: "", pais: "MEX" }), ...patch } } : f
    ));
  };

  const addFigura = (tipo: string) => {
    const f = newFigura(tipo as any);
    setFiguras([...data.figuras, f]);
    setExpandedId(f._temp_id);
  };

  const removeFig = (id: string) => {
    if (data.figuras.length <= 1) return;
    setFiguras(data.figuras.filter(f => f._temp_id !== id));
  };

  const togglePartesTransporte = (id: string, ubicId: string) => {
    setFiguras(data.figuras.map(f => {
      if (f._temp_id !== id) return f;
      const current = f.partes_transporte ?? [];
      const next = current.includes(ubicId) ? current.filter(p => p !== ubicId) : [...current, ubicId];
      return { ...f, partes_transporte: next.length > 0 ? next : undefined };
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div style={BANNER}>
        Figuras del transporte: operador (chofer), propietario, arrendatario o notificado.
        Mínimo: 1 operador (tipo 01) si hay autotransporte.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Figuras · {data.figuras.length}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {TIPOS_FIGURA.map(t => (
            <button key={t.code} type="button" onClick={() => addFigura(t.code)} style={BUTTON_GHOST}>
              + {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.figuras.map((f, idx) => {
          const errCount = showValidation
            ? errors.filter(e => e.field.includes(`figuras[${idx}]`)).length
            : 0;
          const isExpanded = expandedId === f._temp_id;
          const tipoLabel = TIPOS_FIGURA.find(t => t.code === f.tipo_figura)?.label ?? f.tipo_figura;

          return (
            <div key={f._temp_id} style={{
              borderRadius: "var(--radius-md)", overflow: "hidden",
              background: "var(--color-bg-subtle)",
              border: isExpanded ? "1px solid var(--color-brand-blue)" : (errCount > 0 ? "1px solid #dc2626" : "1px solid var(--color-border-faint)"),
            }}>
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : f._temp_id)}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", gap: "10px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{
                  padding: "3px 8px", borderRadius: "6px",
                  background: "rgba(168, 85, 247, 0.15)", color: "#a855f7",
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
                }}>
                  {f.tipo_figura} · {tipoLabel.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {f.nombre_figura || f.rfc_figura || "Sin datos"}
                  </div>
                  {f.num_licencia && (
                    <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px", fontFamily: "monospace" }}>
                      Lic: {f.num_licencia}
                    </div>
                  )}
                </div>
                {errCount > 0 && !isExpanded && <span style={ERROR_BADGE}>{errCount}</span>}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                    <FieldS label="Tipo de figura" required>
                      <select value={f.tipo_figura}
                        onChange={e => updateFig(f._temp_id, { tipo_figura: e.target.value as any })}
                        style={INPUT}>
                        {TIPOS_FIGURA.map(t => <option key={t.code} value={t.code}>{t.code} — {t.label}</option>)}
                      </select>
                    </FieldS>
                    <FieldS label="RFC">
                      <input type="text" value={f.rfc_figura ?? ""}
                        onChange={e => updateFig(f._temp_id, { rfc_figura: e.target.value.toUpperCase() || undefined })}
                        maxLength={13}
                        style={{ ...INPUT, fontFamily: "monospace" }} />
                    </FieldS>
                    <FieldS label="Nombre completo">
                      <input type="text" value={f.nombre_figura ?? ""}
                        onChange={e => updateFig(f._temp_id, { nombre_figura: e.target.value || undefined })}
                        style={INPUT} />
                    </FieldS>
                    {f.tipo_figura === "01" && (
                      <FieldS label="Núm. licencia (operador)" required>
                        <input type="text" value={f.num_licencia ?? ""}
                          onChange={e => updateFig(f._temp_id, { num_licencia: e.target.value || undefined })}
                          style={{ ...INPUT, fontFamily: "monospace" }} />
                      </FieldS>
                    )}
                  </div>

                  {/* Partes transporte (solo 02 y 03) */}
                  {(f.tipo_figura === "02" || f.tipo_figura === "03") && data.ubicaciones.length > 0 && (
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
                        Ubicaciones donde participa
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {data.ubicaciones.map((u, ui) => (
                          <label key={u._temp_id} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "var(--color-text-second)" }}>
                            <input type="checkbox"
                              checked={(f.partes_transporte ?? []).includes(u._temp_id)}
                              onChange={() => togglePartesTransporte(f._temp_id, u._temp_id)} />
                            <span>{u.tipo_ubicacion} {ui + 1} — {u.nombre_remitente_destinatario || u.rfc_remitente_destinatario || "Sin nombre"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.figuras.length > 1 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
                      <button type="button" onClick={() => removeFig(f._temp_id)} style={BUTTON_DANGER}>
                        Eliminar figura
                      </button>
                    </div>
                  )}
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
const ERROR_BADGE: React.CSSProperties = {
  padding: "2px 7px", borderRadius: "10px",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)",
  fontSize: "10px", fontWeight: 700, flexShrink: 0,
};

function FieldS({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
    </div>
  );
}
