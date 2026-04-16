"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AssetType, DepreciationMethod } from "../types/activos.types";
import {
  ASSET_TYPE_CONFIG, DEPRECIATION_METHOD_CONFIG,
  SAT_RATES, DEFAULT_LIFE_MONTHS,
} from "../types/activos.types";

type Props = {
  open:    boolean;
  saving:  boolean;
  onClose: () => void;
  onCreate:(payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)",
  marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px",
  display: "block",
};

export default function ActivosNuevoDrawer({ open, saving, onClose, onCreate }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const ac  = (t as any).activos ?? {};

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name:                "",
    description:         "",
    asset_type:          "computer" as AssetType,
    serial_number:       "",
    location:            "",
    acquisition_date:    new Date().toISOString().split("T")[0],
    acquisition_cost:    "",
    salvage_value:       "0",
    currency:            "MXN",
    depreciation_method: "straight_line" as DepreciationMethod,
    useful_life_months:  "36",
    depreciation_rate_annual: "0.30",
    notes:               "",
  });

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function onTypeChange(type: AssetType) {
    const rate    = SAT_RATES[type];
    const months  = DEFAULT_LIFE_MONTHS[type];
    const method  = type === "land" ? "no_depreciation" : "straight_line";
    setForm(p => ({
      ...p,
      asset_type:               type,
      depreciation_method:      method,
      useful_life_months:       String(months),
      depreciation_rate_annual: String(rate),
    }));
  }

  // Preview depreciación mensual
  const cost    = parseFloat(form.acquisition_cost) || 0;
  const salvage = parseFloat(form.salvage_value)     || 0;
  const months  = parseInt(form.useful_life_months)  || 1;
  const monthlyPreview = form.depreciation_method !== "no_depreciation"
    ? Math.max(0, (cost - salvage) / months) : 0;

  async function handleSubmit() {
    if (!form.name.trim())            { setError(es ? "El nombre es requerido" : "Name is required"); return; }
    if (!form.acquisition_cost || cost <= 0) { setError(es ? "El costo es requerido" : "Cost is required"); return; }
    setError(null);
    try {
      await onCreate({
        name:                    form.name.trim(),
        description:             form.description       || undefined,
        asset_type:              form.asset_type,
        serial_number:           form.serial_number     || undefined,
        location:                form.location          || undefined,
        acquisition_date:        form.acquisition_date,
        acquisition_cost:        cost,
        salvage_value:           salvage,
        currency:                form.currency,
        depreciation_method:     form.depreciation_method,
        useful_life_months:      months,
        depreciation_rate_annual:parseFloat(form.depreciation_rate_annual) || undefined,
        notes:                   form.notes             || undefined,
      });
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(580px,96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            🏛️ {ac.nuevoActivo ?? "Nuevo activo fijo"}
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* Tipo de activo */}
          <div>
            <label style={LABEL}>{ac.tipo ?? "Tipo de activo"} *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
              {(Object.entries(ASSET_TYPE_CONFIG) as [AssetType, any][]).map(([type, cfg]) => (
                <button key={type} onClick={() => onTypeChange(type)}
                  style={{ height: "54px", borderRadius: "var(--radius-md)", border: `2px solid ${form.asset_type === type ? cfg.color : "var(--color-border-faint)"}`, background: form.asset_type === type ? `${cfg.color}15` : "var(--color-bg-subtle)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                  <span style={{ fontSize: "18px" }}>{cfg.icon}</span>
                  <span style={{ fontSize: "8px", fontWeight: 600, color: form.asset_type === type ? cfg.color : "var(--color-text-muted)", textAlign: "center", lineHeight: 1.2 }}>{cfg.labelEs}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre y descripción */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={LABEL}>{ac.nombre ?? "Nombre"} *</label>
              <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder={es ? "Ej: Laptop Dell XPS 15" : "e.g. Dell XPS 15 Laptop"} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>{ac.serialNumber ?? "No. serie"}</label>
              <input value={form.serial_number} onChange={e => setF("serial_number", e.target.value)} placeholder="SN-001234" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>{ac.location ?? "Ubicación"}</label>
              <input value={form.location} onChange={e => setF("location", e.target.value)} placeholder={es ? "Oficina principal" : "Main office"} style={INPUT} />
            </div>
          </div>

          {/* Adquisición */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={LABEL}>{ac.fechaAdquisicion ?? "Fecha de adquisición"} *</label>
              <input type="date" value={form.acquisition_date} onChange={e => setF("acquisition_date", e.target.value)} style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>{ac.costo ?? "Costo"} *</label>
              <input type="number" min="0" value={form.acquisition_cost} onChange={e => setF("acquisition_cost", e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>{ac.valorResidual ?? "Valor residual"}</label>
              <input type="number" min="0" value={form.salvage_value} onChange={e => setF("salvage_value", e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
            <div>
              <label style={LABEL}>{es ? "Moneda" : "Currency"}</label>
              <select value={form.currency} onChange={e => setF("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Depreciación */}
          <div style={{ padding: "14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Configuración de depreciación" : "Depreciation settings"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={LABEL}>{ac.metodo ?? "Método"} *</label>
                <select value={form.depreciation_method} onChange={e => setF("depreciation_method", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                  {(Object.entries(DEPRECIATION_METHOD_CONFIG) as [DepreciationMethod, any][]).map(([k, v]) => (
                    <option key={k} value={k}>{v.labelEs} — {v.desc}</option>
                  ))}
                </select>
              </div>
              {form.depreciation_method !== "no_depreciation" && (
                <>
                  <div>
                    <label style={LABEL}>{ac.vidaUtil ?? "Vida útil (meses)"}</label>
                    <input type="number" min="1" max="600" value={form.useful_life_months} onChange={e => setF("useful_life_months", e.target.value)} style={INPUT} />
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                      = {(parseInt(form.useful_life_months) / 12).toFixed(1)} {es ? "años" : "years"}
                    </div>
                  </div>
                  <div>
                    <label style={LABEL}>{ac.tasaSAT ?? "Tasa SAT anual"}</label>
                    <input type="number" min="0" max="1" step="0.01" value={form.depreciation_rate_annual} onChange={e => setF("depreciation_rate_annual", e.target.value)} style={INPUT} />
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "3px" }}>
                      {(parseFloat(form.depreciation_rate_annual) * 100).toFixed(0)}% {es ? "anual según SAT" : "annual per SAT"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Preview depreciación */}
            {cost > 0 && form.depreciation_method !== "no_depreciation" && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--color-brand-blue)", fontWeight: 600 }}>
                  {ac.depreciacionMes ?? "Depreciación mensual estimada"}:
                </span>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                  {form.currency} ${monthlyPreview.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label style={LABEL}>{es ? "Notas" : "Notes"}</label>
            <textarea rows={2} value={form.notes} onChange={e => setF("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Creando activo…" : "Creating asset…") : (es ? "✓ Crear activo fijo" : "✓ Create fixed asset")}
          </button>
          <button onClick={onClose}
            style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
