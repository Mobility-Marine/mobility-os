"use client";

import type { CartaPorteData, RegimenAduaneroLine } from "../../types/carta_porte.types";
import { newRegimenAduanero } from "../../types/carta_porte.defaults";

const REGIMENES = [
  { code: "IMD", label: "IMD — Importación definitiva" },
  { code: "EXD", label: "EXD — Exportación definitiva" },
  { code: "ITR", label: "ITR — Importación temporal de retorno" },
  { code: "ITE", label: "ITE — Importación temporal de exportación" },
  { code: "DFI", label: "DFI — Depósito fiscal industrial" },
  { code: "RFE", label: "RFE — Recinto fiscal estratégico" },
];

interface Props {
  data: CartaPorteData;
  setRegimenes: (next: RegimenAduaneroLine[] | undefined) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function RegimenAduaneroSection({ data, setRegimenes }: Props) {
  if (data.header.transp_internac !== "Sí") {
    return (
      <div style={{
        padding: "20px", textAlign: "center",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
          Régimen aduanero solo aplica para operaciones internacionales. Cambia el tipo de operación
          en el paso 3 si necesitas capturarlo.
        </div>
      </div>
    );
  }

  const regs = data.regimenes_aduaneros ?? [];

  const update = (id: string, patch: Partial<RegimenAduaneroLine>) => {
    setRegimenes(regs.map(r => r._temp_id === id ? { ...r, ...patch } : r));
  };

  const add = () => {
    const next = [...regs, newRegimenAduanero()];
    setRegimenes(next);
  };

  const remove = (id: string) => {
    const next = regs.filter(r => r._temp_id !== id);
    setRegimenes(next.length > 0 ? next : undefined);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={BANNER}>
        Régimen aduanero al que se sujeta la mercancía. Solo aplica para operaciones internacionales.
        Puedes capturar varios regímenes si la mercancía está mezclada.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Regímenes aduaneros · {regs.length}
        </div>
        <button type="button" onClick={add} style={BUTTON_GHOST}>+ Agregar régimen</button>
      </div>

      {regs.length === 0 ? (
        <div style={{
          padding: "20px", textAlign: "center",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)", border: "1px dashed var(--color-border)",
          fontSize: "12px", color: "var(--color-text-muted)",
        }}>
          Aún no hay regímenes capturados. Agrega al menos uno para esta operación internacional.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {regs.map(r => (
            <div key={r._temp_id} style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
              display: "flex", gap: "10px", alignItems: "flex-end",
            }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
                  Régimen aduanero
                </label>
                <select value={r.regimen_aduanero}
                  onChange={e => update(r._temp_id, { regimen_aduanero: e.target.value })}
                  style={INPUT}>
                  <option value="">Selecciona…</option>
                  {REGIMENES.map(re => <option key={re.code} value={re.code}>{re.label}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => remove(r._temp_id)} style={BUTTON_DANGER}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
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
  padding: "8px 12px", fontSize: "11px", fontWeight: 600, height: "36px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-danger-border)",
  background: "var(--color-danger-bg)", color: "var(--color-danger-text)", cursor: "pointer",
};
