"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { ReceptionItem, QCStatus, ItemCondition } from "../types/recepciones.types";
import { QC_STATUS_CONFIG, ITEM_CONDITION_CONFIG } from "../types/recepciones.types";

type Props = {
  items:        ReceptionItem[];
  saving:       boolean;
  onUpdateItem: (itemId: string, payload: Partial<ReceptionItem>) => Promise<void>;
};

export default function RecepcionItems({ items, saving, onUpdateItem }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft]     = useState<Partial<ReceptionItem>>({});

  function startEdit(item: ReceptionItem) {
    setEditing(item.id);
    setDraft({
      quantity_received:   item.quantity_received,
      quantity_accepted:   item.quantity_accepted,
      quantity_rejected:   item.quantity_rejected,
      quantity_quarantine: item.quantity_quarantine,
      qc_status:           item.qc_status,
      condition:           item.condition,
      qc_notes:            item.qc_notes ?? "",
    });
  }

  async function saveEdit(itemId: string) {
    await onUpdateItem(itemId, draft);
    setEditing(null);
    setDraft({});
  }

  const INPUT: React.CSSProperties = {
    height: "28px", padding: "0 6px", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
    color: "var(--color-text-primary)", fontSize: "11px", outline: "none",
    width: "60px", textAlign: "center",
  };

  // Totales
  const totalExpected   = items.reduce((s, i) => s + Number(i.quantity_expected),   0);
  const totalAccepted   = items.reduce((s, i) => s + Number(i.quantity_accepted),   0);
  const totalRejected   = items.reduce((s, i) => s + Number(i.quantity_rejected),   0);
  const totalQuarantine = items.reduce((s, i) => s + Number(i.quantity_quarantine), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Resumen de cantidades */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {[
          { l: es ? "Esperado"    : "Expected",    v: totalExpected,   c: "var(--color-text-muted)"   },
          { l: es ? "Aceptado"    : "Accepted",    v: totalAccepted,   c: "var(--color-success-text)" },
          { l: es ? "Rechazado"   : "Rejected",    v: totalRejected,   c: "var(--color-danger-text)"  },
          { l: es ? "Cuarentena"  : "Quarantine",  v: totalQuarantine, c: "#a78bfa"                  },
        ].map((s) => (
          <div key={s.l} style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: 800, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {/* Head */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 70px 70px 70px 90px 90px auto", gap: "6px", padding: "8px 12px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>{es ? "Descripción" : "Description"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Esperado" : "Expected"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Aceptado" : "Accepted"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Rechazado" : "Rejected"}</span>
          <span style={{ textAlign: "center" }}>{es ? "Cuarentena" : "Quarantine"}</span>
          <span>QC</span>
          <span>{es ? "Condición" : "Condition"}</span>
          <span></span>
        </div>

        {items.map((item, i) => {
          const isEditing = editing === item.id;
          const qcc = QC_STATUS_CONFIG[item.qc_status];
          const ccc = ITEM_CONDITION_CONFIG[item.condition];
          return (
            <div key={item.id} style={{ borderBottom: i < items.length - 1 ? "1px solid var(--color-border-faint)" : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 70px 70px 70px 70px 90px 90px auto", gap: "6px", padding: "10px 12px", alignItems: "center" }}>
                {/* Descripción */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{item.description}</div>
                  {item.sku && <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>SKU: {item.sku}</div>}
                </div>
                {/* Esperado */}
                <div style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>{item.quantity_expected}</div>
                {/* Aceptado */}
                {isEditing ? (
                  <input type="number" min="0" value={draft.quantity_accepted ?? 0}
                    onChange={(e) => setDraft((p) => ({ ...p, quantity_accepted: Number(e.target.value) }))}
                    style={INPUT}
                  />
                ) : (
                  <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>{item.quantity_accepted}</div>
                )}
                {/* Rechazado */}
                {isEditing ? (
                  <input type="number" min="0" value={draft.quantity_rejected ?? 0}
                    onChange={(e) => setDraft((p) => ({ ...p, quantity_rejected: Number(e.target.value) }))}
                    style={{ ...INPUT, borderColor: Number(draft.quantity_rejected) > 0 ? "var(--color-danger-border)" : undefined }}
                  />
                ) : (
                  <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: item.quantity_rejected > 0 ? "var(--color-danger-text)" : "var(--color-text-muted)" }}>{item.quantity_rejected}</div>
                )}
                {/* Cuarentena */}
                {isEditing ? (
                  <input type="number" min="0" value={draft.quantity_quarantine ?? 0}
                    onChange={(e) => setDraft((p) => ({ ...p, quantity_quarantine: Number(e.target.value) }))}
                    style={{ ...INPUT, borderColor: Number(draft.quantity_quarantine) > 0 ? "#a78bfa" : undefined }}
                  />
                ) : (
                  <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 700, color: item.quantity_quarantine > 0 ? "#a78bfa" : "var(--color-text-muted)" }}>{item.quantity_quarantine}</div>
                )}
                {/* QC */}
                {isEditing ? (
                  <select value={draft.qc_status ?? "pending"} onChange={(e) => setDraft((p) => ({ ...p, qc_status: e.target.value as QCStatus }))} style={{ ...INPUT, width: "80px", textAlign: "left" }}>
                    {(["pending","approved","partial","rejected","quarantine"] as QCStatus[]).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", color: qcc.color, background: qcc.bg, border: `1px solid ${qcc.border}` }}>
                    {es ? qcc.labelEs : qcc.labelEn}
                  </span>
                )}
                {/* Condición */}
                {isEditing ? (
                  <select value={draft.condition ?? "good"} onChange={(e) => setDraft((p) => ({ ...p, condition: e.target.value as ItemCondition }))} style={{ ...INPUT, width: "90px", textAlign: "left" }}>
                    {(["good","damaged","wrong_item","incomplete"] as ItemCondition[]).map((c) => (
                      <option key={c} value={c}>{es ? ITEM_CONDITION_CONFIG[c].labelEs : ITEM_CONDITION_CONFIG[c].labelEn}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: "10px", fontWeight: 600, color: ccc.color }}>
                    {es ? ccc.labelEs : ccc.labelEn}
                  </span>
                )}
                {/* Acciones */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(item.id)} disabled={saving} style={{ height: "26px", padding: "0 8px", borderRadius: "var(--radius-sm)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}>
                        ✓
                      </button>
                      <button onClick={() => { setEditing(null); setDraft({}); }} style={{ height: "26px", padding: "0 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "10px", cursor: "pointer" }}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(item)} style={{ height: "26px", padding: "0 8px", borderRadius: "var(--radius-sm)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", border: "1px solid var(--color-border-faint)", fontSize: "10px", cursor: "pointer" }}>
                      {es ? "Editar" : "Edit"}
                    </button>
                  )}
                </div>
              </div>
              {/* Notas QC */}
              {isEditing && (
                <div style={{ padding: "0 12px 10px", marginTop: "-4px" }}>
                  <input
                    value={draft.qc_notes ?? ""}
                    onChange={(e) => setDraft((p) => ({ ...p, qc_notes: e.target.value }))}
                    placeholder={es ? "Notas de QC (opcional)…" : "QC notes (optional)…"}
                    style={{ ...INPUT, width: "100%", textAlign: "left", height: "28px" }}
                  />
                </div>
              )}
              {!isEditing && item.qc_notes && (
                <div style={{ padding: "0 12px 8px", marginTop: "-4px" }}>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", fontStyle: "italic" }}>{item.qc_notes}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
