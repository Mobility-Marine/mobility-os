"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { Reception, UpdateReceptionPayload, ReceptionItem, UpdateReceptionItemPayload } from "../types/recepciones.types";
import { RECEPTION_STATUS_CONFIG, QC_STATUS_CONFIG } from "../types/recepciones.types";
import RecepcionItems from "./RecepcionItems";

type Props = {
  reception:    Reception;
  saving:       boolean;
  onUpdate:     (id: string, payload: UpdateReceptionPayload) => Promise<void>;
  onUpdateItem: (itemId: string, payload: UpdateReceptionItemPayload, receptionId: string) => Promise<void>;
  onComplete:   (id: string) => Promise<void>;
  onClose:      () => void;
};

type Tab = "items" | "docs" | "info";

export default function RecepcionWorkspace({ reception, saving, onUpdate, onUpdateItem, onComplete, onClose }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [tab, setTab]           = useState<Tab>("items");
  const [confirming, setConf]   = useState(false);
  const [editingDocs, setEditD] = useState(false);
  const [docForm, setDocForm]   = useState({
    supplier_invoice:  reception.supplier_invoice  ?? "",
    supplier_remission:reception.supplier_remission ?? "",
    supplier_ref:      reception.supplier_ref       ?? "",
    notes:             reception.notes              ?? "",
    internal_notes:    reception.internal_notes     ?? "",
    qc_notes:          reception.qc_notes           ?? "",
  });

  const sc  = RECEPTION_STATUS_CONFIG[reception.status];
  const qcc = QC_STATUS_CONFIG[reception.qc_status];
  const isOpen = ["draft", "in_progress"].includes(reception.status);

  const INPUT: React.CSSProperties = {
    width: "100%", height: "34px", padding: "0 10px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
    fontSize: "12px", outline: "none", boxSizing: "border-box",
  };

  async function handleSaveDocs() {
    await onUpdate(reception.id, {
      supplier_invoice:  docForm.supplier_invoice  || undefined,
      supplier_remission:docForm.supplier_remission || undefined,
      supplier_ref:      docForm.supplier_ref       || undefined,
      notes:             docForm.notes              || undefined,
      internal_notes:    docForm.internal_notes     || undefined,
      qc_notes:          docForm.qc_notes           || undefined,
    } as any);
    setEditD(false);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "items", label: es ? "Ítems"      : "Items"    },
    { key: "docs",  label: es ? "Documentos" : "Documents"},
    { key: "info",  label: es ? "Información": "Info"     },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "0" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {reception.reception_number}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                {es ? sc.labelEs : sc.labelEn}
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: qcc.color, background: qcc.bg, border: `1px solid ${qcc.border}` }}>
                QC: {es ? qcc.labelEs : qcc.labelEn}
              </span>
              {reception.has_discrepancies && (
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)", color: "var(--color-danger-text)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)" }}>
                  {es ? "Con diferencias" : "Has discrepancies"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Acción: Completar */}
        {isOpen && (
          <div>
            {!confirming ? (
              <button onClick={() => setConf(true)} style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                {es ? "Completar recepción" : "Complete reception"}
              </button>
            ) : (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <div style={{ fontSize: "11px", color: "var(--color-warning-text)" }}>
                  {es ? "¿Confirmar?" : "Confirm?"}
                </div>
                <button onClick={async () => { await onComplete(reception.id); setConf(false); }} disabled={saving} style={{ height: "30px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                  {es ? "Sí, completar" : "Yes, complete"}
                </button>
                <button onClick={() => setConf(false)} style={{ height: "30px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", fontSize: "11px", cursor: "pointer" }}>
                  {es ? "Cancelar" : "Cancel"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "16px", borderBottom: "1px solid var(--color-border-faint)", paddingBottom: "1px" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            height: "32px", padding: "0 14px", borderRadius: "var(--radius-md) var(--radius-md) 0 0",
            background: tab === t.key ? "var(--color-bg-base)" : "transparent",
            border: tab === t.key ? "1px solid var(--color-border-faint)" : "none",
            borderBottom: tab === t.key ? "1px solid var(--color-bg-base)" : "none",
            color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
            fontSize: "12px", fontWeight: tab === t.key ? 700 : 400,
            cursor: "pointer", marginBottom: tab === t.key ? "-1px" : "0",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: ÍTEMS */}
      {tab === "items" && (
        <RecepcionItems
          items={reception.items ?? []}
          saving={saving}
          onUpdateItem={(itemId, payload) => onUpdateItem(itemId, payload, reception.id)}
        />
      )}

      {/* TAB: DOCUMENTOS */}
      {tab === "docs" && (
        <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Documentos del proveedor" : "Supplier documents"}
            </div>
            {isOpen && !editingDocs && (
              <button onClick={() => setEditD(true)} style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
                {es ? "Editar" : "Edit"}
              </button>
            )}
          </div>

          {editingDocs ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                { k: "supplier_invoice",   l: es ? "Factura proveedor"   : "Supplier invoice"  },
                { k: "supplier_remission", l: es ? "Remisión"            : "Remission"         },
                { k: "supplier_ref",       l: es ? "Referencia adicional": "Additional ref"    },
              ].map((f) => (
                <div key={f.k}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.l}</div>
                  <input value={(docForm as any)[f.k]} onChange={(e) => setDocForm((p) => ({ ...p, [f.k]: e.target.value }))} style={INPUT} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas QC" : "QC Notes"}</div>
                <textarea rows={2} value={docForm.qc_notes} onChange={(e) => setDocForm((p) => ({ ...p, qc_notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{es ? "Notas internas" : "Internal notes"}</div>
                <textarea rows={2} value={docForm.internal_notes} onChange={(e) => setDocForm((p) => ({ ...p, internal_notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleSaveDocs} disabled={saving} style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  {saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar" : "Save")}
                </button>
                <button onClick={() => setEditD(false)} style={{ height: "34px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
                  {es ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {[
                { l: es ? "Factura proveedor"    : "Supplier invoice",  v: reception.supplier_invoice   },
                { l: es ? "Remisión"             : "Remission",         v: reception.supplier_remission },
                { l: es ? "Referencia adicional" : "Additional ref",    v: reception.supplier_ref       },
                { l: "QC",                                               v: reception.qc_notes           },
                { l: es ? "Notas internas"       : "Internal notes",    v: reception.internal_notes     },
              ].map((r) => (
                <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>{r.l}</span>
                  <span style={{ color: r.v ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>{r.v || "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: INFORMACIÓN */}
      {tab === "info" && (
        <div style={{ display: "grid", gap: "8px" }}>
          {[
            { l: es ? "Número"           : "Number",         v: reception.reception_number },
            { l: es ? "Orden de Compra"  : "Purchase Order", v: reception.purchase_order?.po_number },
            { l: es ? "Proveedor"        : "Supplier",       v: reception.supplier?.name },
            { l: es ? "Fecha recepción"  : "Received date",  v: reception.received_date ? new Date(reception.received_date).toLocaleDateString(es ? "es-MX" : "en-US") : undefined },
            { l: es ? "Almacén"          : "Warehouse",      v: reception.warehouse },
            { l: es ? "Creado"           : "Created",        v: new Date(reception.created_at).toLocaleDateString(es ? "es-MX" : "en-US") },
          ].map((r) => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "12px" }}>
              <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>{r.l}</span>
              <span style={{ color: r.v ? "var(--color-text-primary)" : "var(--color-text-muted)", fontWeight: r.v ? 600 : 400 }}>{r.v || "—"}</span>
            </div>
          ))}
          {reception.notes && (
            <div style={{ padding: "10px 12px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--color-brand-blue)" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Notas" : "Notes"}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.6 }}>{reception.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
