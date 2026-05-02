"use client";

// ═══════════════════════════════════════════════════════════════════════
// AutotransporteForm — Datos del transporte por carretera
// Catálogos SAT vía useSATCatalog (oficiales completos)
// Estilos: inline + CSS variables
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { Autotransporte, Remolque } from "../../types/carta_porte.types";

interface Props {
  data: Autotransporte;
  setData: (next: Autotransporte) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function AutotransporteForm({ data, setData }: Props) {
  const { items: permisos,  loading: loadingPermisos }  = useSATCatalog("tipo_permiso_sct");
  const { items: configs,   loading: loadingConfigs }   = useSATCatalog("config_autotransporte");
  const { items: subtipos,  loading: loadingSubtipos }  = useSATCatalog("subtipo_remolque");

  const update       = (patch: Partial<Autotransporte>) => setData({ ...data, ...patch });
  const updateIdent  = (patch: Partial<Autotransporte["identificacion_vehicular"]>) =>
    setData({ ...data, identificacion_vehicular: { ...data.identificacion_vehicular, ...patch } });
  const updateSeguros = (patch: Partial<Autotransporte["seguros"]>) =>
    setData({ ...data, seguros: { ...data.seguros, ...patch } });

  const addRemolque = () => {
    const nuevo: Remolque = { subtipo_rem: "", placa: "" };
    update({ remolques: [...(data.remolques ?? []), nuevo] });
  };
  const updateRemolque = (idx: number, patch: Partial<Remolque>) => {
    const list = [...(data.remolques ?? [])];
    list[idx] = { ...list[idx], ...patch };
    update({ remolques: list });
  };
  const removeRemolque = (idx: number) => {
    update({ remolques: (data.remolques ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Permiso SCT */}
      <Section title="Permiso SCT" subtitle="Permiso de la Secretaría de Comunicaciones y Transportes">
        <Grid>
          <FieldS label="Tipo de permiso SCT" required>
            <select value={data.perm_sct}
              onChange={e => update({ perm_sct: e.target.value })}
              disabled={loadingPermisos}
              style={INPUT}>
              <option value="">{loadingPermisos ? "Cargando..." : "Selecciona..."}</option>
              {permisos.map(p => (
                <option key={p.code} value={p.code}>{p.code} — {p.label}</option>
              ))}
            </select>
          </FieldS>
          <FieldS label="Número de permiso SCT" required>
            <input type="text" value={data.num_permiso_sct}
              onChange={e => update({ num_permiso_sct: e.target.value })}
              placeholder="Ej: A-12345/2024"
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Identificación vehicular */}
      <Section title="Identificación del vehículo motriz">
        <FieldS label="Configuración vehicular" required hint="Tipo de unidad: camión, tractocamión, articulado, etc.">
          <select value={data.identificacion_vehicular.config_vehicular}
            onChange={e => updateIdent({ config_vehicular: e.target.value })}
            disabled={loadingConfigs}
            style={INPUT}>
            <option value="">{loadingConfigs ? "Cargando..." : "Selecciona configuración..."}</option>
            {configs.map(c => (
              <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
            ))}
          </select>
        </FieldS>

        <Grid>
          <FieldS label="Placa del vehículo motriz" required>
            <input type="text" value={data.identificacion_vehicular.placa_vm}
              onChange={e => updateIdent({ placa_vm: e.target.value.toUpperCase() })}
              placeholder="ABC-123-D"
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Año modelo" required>
            <input type="number" min="1900" max="2100"
              value={data.identificacion_vehicular.anio_modelo_vm}
              onChange={e => updateIdent({ anio_modelo_vm: parseInt(e.target.value, 10) || new Date().getFullYear() })}
              style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }} />
          </FieldS>
          <FieldS label="Peso bruto vehicular (toneladas)" required hint="Capacidad máxima de carga">
            <input type="number" min="0" step="0.001"
              value={data.identificacion_vehicular.peso_bruto_vehicular || ""}
              onChange={e => updateIdent({ peso_bruto_vehicular: parseFloat(e.target.value) || 0 })}
              placeholder="0.000"
              style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Seguros */}
      <Section title="Seguros">
        <Grid>
          <FieldS label="Aseguradora resp. civil" required>
            <input type="text" value={data.seguros.asegura_resp_civil}
              onChange={e => updateSeguros({ asegura_resp_civil: e.target.value })}
              placeholder="Ej: GNP Seguros"
              style={INPUT} />
          </FieldS>
          <FieldS label="Póliza resp. civil" required>
            <input type="text" value={data.seguros.poliza_resp_civil}
              onChange={e => updateSeguros({ poliza_resp_civil: e.target.value })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Aseguradora medio ambiente" hint="Solo si transportas materiales peligrosos">
            <input type="text" value={data.seguros.asegura_med_ambiente ?? ""}
              onChange={e => updateSeguros({ asegura_med_ambiente: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Póliza medio ambiente">
            <input type="text" value={data.seguros.poliza_med_ambiente ?? ""}
              onChange={e => updateSeguros({ poliza_med_ambiente: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Aseguradora carga">
            <input type="text" value={data.seguros.asegura_carga ?? ""}
              onChange={e => updateSeguros({ asegura_carga: e.target.value || undefined })}
              style={INPUT} />
          </FieldS>
          <FieldS label="Póliza carga">
            <input type="text" value={data.seguros.poliza_carga ?? ""}
              onChange={e => updateSeguros({ poliza_carga: e.target.value || undefined })}
              style={{ ...INPUT, fontFamily: "monospace" }} />
          </FieldS>
          <FieldS label="Prima del seguro">
            <input type="number" min="0" step="0.01"
              value={data.seguros.prima_seguro ?? ""}
              onChange={e => updateSeguros({ prima_seguro: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="0.00"
              style={{ ...INPUT, textAlign: "right", fontVariantNumeric: "tabular-nums" }} />
          </FieldS>
        </Grid>
      </Section>

      {/* Remolques */}
      <Section title="Remolques (opcional, hasta 2)" subtitle="Remolques o semirremolques que arrastra la unidad motriz">
        {(data.remolques ?? []).length === 0 ? (
          <button type="button" onClick={addRemolque} style={DASHED_BUTTON}>
            + Agregar remolque
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {(data.remolques ?? []).map((r, idx) => (
              <div key={idx} style={{
                padding: "12px", borderRadius: "var(--radius-md)",
                background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
              }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  Remolque #{idx + 1}
                </div>
                <Grid>
                  <FieldS label="Subtipo de remolque" required>
                    <select value={r.subtipo_rem}
                      onChange={e => updateRemolque(idx, { subtipo_rem: e.target.value })}
                      disabled={loadingSubtipos}
                      style={INPUT}>
                      <option value="">{loadingSubtipos ? "Cargando..." : "Selecciona..."}</option>
                      {subtipos.map(s => (
                        <option key={s.code} value={s.code}>{s.code} — {s.label}</option>
                      ))}
                    </select>
                  </FieldS>
                  <FieldS label="Placa" required>
                    <input type="text" value={r.placa}
                      onChange={e => updateRemolque(idx, { placa: e.target.value.toUpperCase() })}
                      placeholder="ABC-123-D"
                      style={{ ...INPUT, fontFamily: "monospace" }} />
                  </FieldS>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button type="button" onClick={() => removeRemolque(idx)} style={BUTTON_DANGER}>
                      Eliminar
                    </button>
                  </div>
                </Grid>
              </div>
            ))}
            {(data.remolques?.length ?? 0) < 2 && (
              <button type="button" onClick={addRemolque} style={DASHED_BUTTON}>
                + Agregar otro remolque
              </button>
            )}
          </div>
        )}
      </Section>
    </div>
  );
}

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const DASHED_BUTTON: React.CSSProperties = {
  width: "100%", padding: "10px",
  borderRadius: "var(--radius-md)",
  border: "1px dashed var(--color-border)",
  background: "transparent", color: "var(--color-text-muted)",
  fontSize: "12px", fontWeight: 600, cursor: "pointer",
};
const BUTTON_DANGER: React.CSSProperties = {
  padding: "8px 12px", fontSize: "11px", fontWeight: 600, height: "36px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)", cursor: "pointer",
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>{children}</div>;
}

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
