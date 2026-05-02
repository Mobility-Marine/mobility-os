"use client";

import { useState } from "react";
import type { CartaPorteData, CartaPorteUbicacion } from "../../types/carta_porte.types";
import { newUbicacion } from "../../types/carta_porte.defaults";

const ESTADOS_MEX = [
  "AGU","BCN","BCS","CAM","CHH","CHP","CMX","COA","COL","DUR","GRO","GUA","HID","JAL","MEX",
  "MIC","MOR","NAY","NLE","OAX","PUE","QUE","ROO","SIN","SLP","SON","TAB","TAM","TLA","VER","YUC","ZAC"
];

const PAISES = [
  { code: "MEX", label: "México" }, { code: "USA", label: "Estados Unidos" },
  { code: "CAN", label: "Canadá" }, { code: "GTM", label: "Guatemala" },
  { code: "BLZ", label: "Belice" }, { code: "ESP", label: "España" },
  { code: "CHN", label: "China" },  { code: "JPN", label: "Japón" },
];

interface Props {
  data: CartaPorteData;
  setUbicaciones: (next: CartaPorteUbicacion[]) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function UbicacionesSection({ data, setUbicaciones, showValidation, errors }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(data.ubicaciones[0]?._temp_id ?? null);

  const updateUbicacion = (id: string, patch: Partial<CartaPorteUbicacion>) => {
    setUbicaciones(data.ubicaciones.map(u => u._temp_id === id ? { ...u, ...patch } : u));
  };

  const updateDomicilio = (id: string, patch: Partial<CartaPorteUbicacion["domicilio"]>) => {
    setUbicaciones(data.ubicaciones.map(u =>
      u._temp_id === id ? { ...u, domicilio: { ...u.domicilio, ...patch } } : u
    ));
  };

  const addUbicacion = (tipo: "Origen" | "Destino") => {
    const nueva = newUbicacion(tipo);
    setUbicaciones([...data.ubicaciones, nueva]);
    setExpandedId(nueva._temp_id);
  };

  const removeUbicacion = (id: string) => {
    if (data.ubicaciones.length <= 2) return;
    setUbicaciones(data.ubicaciones.filter(u => u._temp_id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "820px" }}>

      <div style={BANNER}>
        Captura todas las ubicaciones del traslado. Mínimo: 1 origen + 1 destino. Pueden ser múltiples.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Ubicaciones · {data.ubicaciones.length}
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button type="button" onClick={() => addUbicacion("Origen")} style={BUTTON_GHOST}>
            + Origen
          </button>
          <button type="button" onClick={() => addUbicacion("Destino")} style={BUTTON_GHOST}>
            + Destino
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {data.ubicaciones.map((u, idx) => {
          const errCount = showValidation
            ? errors.filter(e => e.field.includes(`ubicaciones[${idx}]`)).length
            : 0;
          const isExpanded = expandedId === u._temp_id;

          return (
            <div key={u._temp_id} style={{
              borderRadius: "var(--radius-md)", overflow: "hidden",
              background: "var(--color-bg-subtle)",
              border: isExpanded ? "1px solid var(--color-brand-blue)" : (errCount > 0 ? "1px solid #dc2626" : "1px solid var(--color-border-faint)"),
            }}>
              <button type="button" onClick={() => setExpandedId(isExpanded ? null : u._temp_id)}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", gap: "10px",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{
                  padding: "3px 8px", borderRadius: "6px",
                  background: u.tipo_ubicacion === "Origen" ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.15)",
                  color: u.tipo_ubicacion === "Origen" ? "#16a34a" : "var(--color-brand-blue)",
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
                }}>
                  {u.tipo_ubicacion.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.nombre_remitente_destinatario || u.rfc_remitente_destinatario || "Sin datos"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {[u.domicilio.municipio, u.domicilio.estado, u.domicilio.codigo_postal].filter(Boolean).join(", ") || "Sin dirección"}
                  </div>
                </div>
                {errCount > 0 && !isExpanded && (
                  <span style={ERROR_BADGE}>{errCount} {errCount === 1 ? "error" : "errores"}</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: "var(--color-text-muted)", flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isExpanded && (
                <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                    <FieldS label={`RFC ${u.tipo_ubicacion === "Origen" ? "remitente" : "destinatario"}`} required>
                      <input type="text"
                        value={u.rfc_remitente_destinatario}
                        onChange={e => updateUbicacion(u._temp_id, { rfc_remitente_destinatario: e.target.value.toUpperCase() })}
                        maxLength={13} placeholder="ABC850101XXX"
                        style={{ ...INPUT, fontFamily: "monospace" }}
                      />
                    </FieldS>

                    <FieldS label="Nombre / Razón social">
                      <input type="text"
                        value={u.nombre_remitente_destinatario ?? ""}
                        onChange={e => updateUbicacion(u._temp_id, { nombre_remitente_destinatario: e.target.value || undefined })}
                        style={INPUT}
                      />
                    </FieldS>

                    <FieldS label="Fecha y hora salida/llegada" required>
                      <input type="datetime-local"
                        value={u.fecha_hora_salida_llegada ?? ""}
                        onChange={e => updateUbicacion(u._temp_id, { fecha_hora_salida_llegada: e.target.value })}
                        style={INPUT}
                      />
                    </FieldS>

                    {u.tipo_ubicacion === "Destino" && (
                      <FieldS label="Distancia desde origen (km)">
                        <input type="number" min="0" step="0.01"
                          value={u.distancia_recorrida ?? ""}
                          onChange={e => updateUbicacion(u._temp_id, { distancia_recorrida: parseFloat(e.target.value) || undefined })}
                          style={{ ...INPUT, textAlign: "right" }}
                        />
                      </FieldS>
                    )}
                  </div>

                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px" }}>
                    Domicilio
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
                    <FieldS label="Calle">
                      <input type="text" value={u.domicilio.calle ?? ""}
                        onChange={e => updateDomicilio(u._temp_id, { calle: e.target.value || undefined })}
                        style={INPUT} />
                    </FieldS>
                    <FieldS label="Núm. exterior">
                      <input type="text" value={u.domicilio.numero_exterior ?? ""}
                        onChange={e => updateDomicilio(u._temp_id, { numero_exterior: e.target.value || undefined })}
                        style={INPUT} />
                    </FieldS>
                    <FieldS label="Núm. interior">
                      <input type="text" value={u.domicilio.numero_interior ?? ""}
                        onChange={e => updateDomicilio(u._temp_id, { numero_interior: e.target.value || undefined })}
                        style={INPUT} />
                    </FieldS>
                    <FieldS label="Colonia">
                      <input type="text" value={u.domicilio.colonia ?? ""}
                        onChange={e => updateDomicilio(u._temp_id, { colonia: e.target.value || undefined })}
                        style={INPUT} />
                    </FieldS>
                    <FieldS label="Municipio">
                      <input type="text" value={u.domicilio.municipio ?? ""}
                        onChange={e => updateDomicilio(u._temp_id, { municipio: e.target.value || undefined })}
                        style={INPUT} />
                    </FieldS>
                    <FieldS label="Estado" required>
                      {u.domicilio.pais === "MEX" ? (
                        <select value={u.domicilio.estado}
                          onChange={e => updateDomicilio(u._temp_id, { estado: e.target.value })}
                          style={INPUT}>
                          <option value="">Selecciona…</option>
                          {ESTADOS_MEX.map(est => <option key={est} value={est}>{est}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={u.domicilio.estado}
                          onChange={e => updateDomicilio(u._temp_id, { estado: e.target.value })}
                          style={INPUT} />
                      )}
                    </FieldS>
                    <FieldS label="País" required>
                      <select value={u.domicilio.pais}
                        onChange={e => updateDomicilio(u._temp_id, { pais: e.target.value })}
                        style={INPUT}>
                        {PAISES.map(p => <option key={p.code} value={p.code}>{p.code} — {p.label}</option>)}
                      </select>
                    </FieldS>
                    <FieldS label="Código postal" required>
                      <input type="text" value={u.domicilio.codigo_postal}
                        onChange={e => updateDomicilio(u._temp_id, { codigo_postal: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                        maxLength={5}
                        style={{ ...INPUT, fontFamily: "monospace" }} />
                    </FieldS>
                  </div>

                  {data.ubicaciones.length > 2 && (
                    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
                      <button type="button" onClick={() => removeUbicacion(u._temp_id)} style={BUTTON_DANGER}>
                        Eliminar ubicación
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
