"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { CFDIDocument } from "../types/facturacion.types";
import { CANCEL_MOTIVES } from "../types/facturacion.types";

type Props = {
  cfdi:    CFDIDocument;
  saving:  boolean;
  onCancel:(motive: string, substitution?: string) => Promise<void>;
  onClose: () => void;
};

export default function CFDICancelModal({ cfdi, saving, onCancel, onClose }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  const [motive,       setMotive]       = useState("02");
  const [substitution, setSubstitution] = useState("");
  const [error,        setError]        = useState<string | null>(null);

  async function handleCancel() {
    if (motive === "01" && !substitution.trim()) {
      setError(es ? "El motivo 01 requiere el UUID del CFDI sustituto." : "Motive 01 requires the substitution CFDI UUID.");
      return;
    }
    setError(null);
    try {
      await onCancel(motive, substitution || undefined);
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  const INPUT: React.CSSProperties = {
    width: "100%", height: "36px", padding: "0 10px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 500 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(520px, 90vw)", background: "var(--color-bg-base)", borderRadius: "var(--radius-xl)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 501, padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-danger-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger-text)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{es ? "Cancelar CFDI" : "Cancel CFDI"}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "1px" }}>
                {cfdi.serie ?? ""}{cfdi.folio ?? ""} · {cfdi.receiver_name} · ${fmt(cfdi.total)}
              </div>
            </div>
          </div>
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
            {es
              ? "La cancelación se solicita al SAT. El receptor tiene 72 horas para aceptarla o rechazarla. Una vez cancelado no puede revertirse."
              : "Cancellation is requested to the SAT. The receiver has 72 hours to accept or reject it. Once cancelled it cannot be undone."}
          </div>
        </div>

        {/* Motivo */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Motivo de cancelación *" : "Cancellation motive *"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {CANCEL_MOTIVES.map((m) => (
              <label key={m.key} style={{ display: "flex", gap: "10px", padding: "10px 12px", borderRadius: "var(--radius-md)", background: motive === m.key ? "var(--color-danger-bg)" : "var(--color-bg-subtle)", border: `2px solid ${motive === m.key ? "var(--color-danger-border)" : "var(--color-border-faint)"}`, cursor: "pointer", alignItems: "flex-start" }}>
                <input type="radio" value={m.key} checked={motive === m.key} onChange={() => setMotive(m.key)} style={{ marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: motive === m.key ? "var(--color-danger-text)" : "var(--color-text-primary)" }}>
                    {m.key} — {m.label}
                  </div>
                  {m.key === "01" && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{es ? "Requiere UUID del CFDI que sustituye." : "Requires UUID of the substituting CFDI."}</div>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* UUID sustitución (solo motivo 01) */}
        {motive === "01" && (
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>UUID {es ? "del CFDI sustituto *" : "of substituting CFDI *"}</div>
            <input value={substitution} onChange={(e) => setSubstitution(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" style={{ ...INPUT, fontFamily: "monospace", fontSize: "11px" }} />
          </div>
        )}

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
            {error}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleCancel} disabled={saving}
            style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Cancelando ante SAT…" : "Cancelling with SAT…") : (es ? "Confirmar cancelación" : "Confirm cancellation")}
          </button>
          <button onClick={onClose} style={{ height: "40px", padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Close"}
          </button>
        </div>
      </div>
    </>
  );
}
