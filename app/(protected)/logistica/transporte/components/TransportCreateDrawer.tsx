"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { TransportUnit, UnitType } from "../types/transport.types";
import { UNIT_TYPE_LABELS } from "../types/transport.types";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (data: Partial<TransportUnit>) => Promise<TransportUnit | undefined>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function TransportCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};

  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [name,     setName]     = useState("");
  const [unitType, setUnitType] = useState<UnitType>("camion_3_5t");
  const [brand,    setBrand]    = useState("");
  const [model,    setModel]    = useState("");
  const [year,     setYear]     = useState("");
  const [plates,   setPlates]   = useState("");
  const [driver,   setDriver]   = useState("");

  const UNIT_TYPES = Object.keys(UNIT_TYPE_LABELS) as UnitType[];

  function getTypeLabel(k: UnitType) {
    return tl[UNIT_TYPE_LABELS[k]?.replace("logistics.", "") ?? ""] ?? k;
  }

  async function handleCreate() {
    if (!name.trim()) { setError("El nombre es requerido"); return; }
    setSaving(true); setError(null);
    try {
      await onCreate({
        name: name.trim(), unit_type: unitType,
        brand:  brand  || undefined,
        model:  model  || undefined,
        year:   year   ? parseInt(year) : undefined,
        plates: plates || undefined,
        assigned_driver: driver || undefined,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setName(""); setUnitType("camion_3_5t"); setBrand(""); setModel("");
    setYear(""); setPlates(""); setDriver(""); setError(null); onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(420px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tl.newUnit ?? "Nueva unidad"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tl.transportDesc ?? "Catálogo de flota propia"}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitName ?? "Nombre / Identificador"} *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Unidad 01, Trailer Norte…" style={INPUT} />
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitType ?? "Tipo de unidad"} *</div>
            <select value={unitType} onChange={(e) => setUnitType(e.target.value as UnitType)} style={{ ...INPUT, cursor: "pointer" }}>
              {UNIT_TYPES.map((k) => <option key={k} value={k}>{getTypeLabel(k)}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitBrand ?? "Marca"}</div>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Kenworth, Freightliner…" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitModel ?? "Modelo"}</div>
              <input value={model} onChange={(e) => setModel(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitYear ?? "Año"}</div>
              <input type="number" min="2000" max="2030" value={year} onChange={(e) => setYear(e.target.value)} placeholder={new Date().getFullYear().toString()} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitPlates ?? "Placas"}</div>
              <input value={plates} onChange={(e) => setPlates(e.target.value.toUpperCase())} placeholder="ABC-1234" style={{ ...INPUT, textTransform: "uppercase" }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.unitAssignedDriver ?? "Operador asignado"}</div>
            <input value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Nombre del operador…" style={INPUT} />
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "11px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
            Documentación (seguro, verificación, VIN) se puede agregar después en el workspace de la unidad.
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving || !name.trim()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: name.trim() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: name.trim() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving || !name.trim() ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tl.newUnit ?? "Registrar unidad")}
          </button>
        </div>
      </div>
    </>
  );
}
