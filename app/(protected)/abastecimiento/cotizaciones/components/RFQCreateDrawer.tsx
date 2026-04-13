"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { RFQ }       from "../types/rfq.types";

type Props = { open: boolean; onClose: () => void; onCreate: (data: Partial<RFQ>) => Promise<RFQ | undefined> };

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function RFQCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t } = useTranslation();
  const tp    = (t.procurement as any) ?? {};

  const [saving,    setSaving]   = useState(false);
  const [error,     setError]    = useState<string | null>(null);
  const [title,     setTitle]    = useState("");
  const [deadline,  setDeadline] = useState("");
  const [currency,  setCurrency] = useState("MXN");
  const [notes,     setNotes]    = useState("");

  async function handleCreate() {
    if (!title.trim()) { setError("El título es requerido"); return; }
    setSaving(true); setError(null);
    try {
      await onCreate({ title: title.trim(), deadline: deadline || undefined, currency, notes: notes || undefined });
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setTitle(""); setDeadline(""); setCurrency("MXN"); setNotes(""); setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(440px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tp.newRfq ?? "Nueva solicitud de cotización"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tp.rfqsDesc ?? "Comparativo de precios entre proveedores"}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.rfqTitle ?? "Título"} *</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué necesitas cotizar?" style={INPUT} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.rfqDeadline ?? "Fecha límite"}</div>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Moneda</div>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {["MXN","USD","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Notas</div>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Especificaciones adicionales, condiciones…" style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.5 }} />
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
            Los ítems a cotizar y los proveedores invitados se agregan desde el workspace de la solicitud.
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving || !title.trim()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: title.trim() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: title.trim() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving || !title.trim() ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tp.newRfq ?? "Crear solicitud")}
          </button>
        </div>
      </div>
    </>
  );
}
