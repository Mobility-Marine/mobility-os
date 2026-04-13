"use client";
import { useState } from "react";
import { useTranslation }  from "@/lib/i18n/useTranslation";
import type { Requisition, RequisitionPriority } from "../types/requisition.types";
import { PRIORITY_CONFIG } from "../types/requisition.types";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (data: Partial<Requisition>) => Promise<Requisition | undefined>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function RequisitionCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t }  = useTranslation();
  const tp     = (t.procurement as any) ?? {};

  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [title,       setTitle]       = useState("");
  const [priority,    setPriority]    = useState<RequisitionPriority>("normal");
  const [neededBy,    setNeededBy]    = useState("");
  const [department,  setDepartment]  = useState("");
  const [justification, setJustification] = useState("");

  const PRIORITIES = (["low","normal","high","urgent"] as RequisitionPriority[]);

  function getPriorityLabel(p: RequisitionPriority) {
    const cfg = PRIORITY_CONFIG[p];
    return tp[cfg.labelKey.replace("procurement.", "")] ?? p;
  }

  async function handleCreate() {
    if (!title.trim()) { setError("El título es requerido"); return; }
    setSaving(true); setError(null);
    try {
      await onCreate({
        title:         title.trim(),
        priority,
        needed_by:     neededBy     || undefined,
        department:    department   || undefined,
        justification: justification || undefined,
        requires_approval: true,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setTitle(""); setPriority("normal"); setNeededBy("");
    setDepartment(""); setJustification(""); setError(null);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(460px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tp.newRequisition ?? "Nueva requisición"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tp.requisitionsDesc ?? "Solicitud interna de compra"}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.requisitionTitle ?? "Título"} *</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="¿Qué necesitas comprar?" style={INPUT} />
          </div>

          {/* Prioridad */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Prioridad</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {PRIORITIES.map((p) => {
                const cfg   = PRIORITY_CONFIG[p];
                const label = getPriorityLabel(p);
                const isSelected = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, height: "36px", borderRadius: "var(--radius-md)", cursor: "pointer", fontSize: "12px", fontWeight: isSelected ? 700 : 500, background: isSelected ? cfg.bg : "var(--color-bg-subtle)", border: `2px solid ${isSelected ? cfg.border : "var(--color-border-faint)"}`, color: isSelected ? cfg.color : "var(--color-text-muted)", transition: "var(--transition-fast)" }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.neededBy ?? "Fecha requerida"}</div>
              <input type="date" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.department ?? "Área"}</div>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Operaciones, Admin…" style={INPUT} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tp.justification ?? "Justificación"}</div>
            <textarea rows={4} value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="¿Por qué se necesita esta compra?" style={{ ...INPUT, height: "auto", padding: "10px", resize: "vertical", lineHeight: 1.5 }} />
          </div>

          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-brand-blue)", lineHeight: 1.6 }}>
            Los ítems específicos (qué comprar, cantidad, precio estimado) se agregan después desde el workspace de la requisición.
          </div>

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>
          )}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving || !title.trim()} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: title.trim() ? "var(--color-brand-blue)" : "var(--color-bg-subtle)", color: title.trim() ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving || !title.trim() ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tp.newRequisition ?? "Crear requisición")}
          </button>
        </div>
      </div>
    </>
  );
}
