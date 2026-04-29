"use client";
import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AccountReceivable } from "../types/cxc.types";

type Props = {
  open:    boolean;
  items:   AccountReceivable[];      // Todas las AR del controller
  onClose: () => void;
  onSelect:(ar: AccountReceivable) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function CxCSelectInvoiceModal({ open, items, onClose, onSelect }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [search, setSearch] = useState("");

  // Solo facturas con balance pendiente, ordenadas por fecha más antigua
  const pending = useMemo(() => {
    return items
      .filter(ar => ar.balance > 0.01 && ar.status !== "paid")
      .filter(ar => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (ar.client_name?.toLowerCase().includes(q) ||
                ar.client_rfc?.toLowerCase().includes(q) ||
                ar.document_number?.toLowerCase().includes(q));
      })
      .sort((a, b) => a.document_date.localeCompare(b.document_date));
  }, [items, search]);

  function handleClose() {
    setSearch("");
    onClose();
  }

  function handleSelect(ar: AccountReceivable) {
    setSearch("");
    onSelect(ar);
  }

  if (!open) return null;

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(640px, 92vw)", maxHeight: "80vh", background: "var(--color-bg-base)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
                {es ? "Seleccionar factura para registrar pago" : "Select invoice to register payment"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {pending.length} {es ? "facturas pendientes de cobro" : "invoices pending collection"}
              </div>
            </div>
            <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Search */}
          <div style={{ marginTop: "14px", position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              placeholder={es ? "Buscar por cliente, RFC o folio…" : "Search by client, RFC or folio…"}
              style={{
                width: "100%", height: "40px", paddingLeft: "36px", paddingRight: "12px",
                borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
                fontSize: "13px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {pending.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                {es ? "No hay facturas pendientes de cobro" : "No invoices pending collection"}
              </div>
              {search && (
                <div style={{ fontSize: "11px" }}>
                  {es ? `Sin resultados para "${search}"` : `No results for "${search}"`}
                </div>
              )}
            </div>
          ) : (
            pending.map(ar => {
              const daysOld = Math.floor((new Date().getTime() - new Date(ar.document_date).getTime()) / 86400000);
              const isOverdue = daysOld > 30;
              return (
                <button key={ar.id} onClick={() => handleSelect(ar)}
                  style={{ width: "100%", display: "grid", gridTemplateColumns: "100px 1fr 130px 80px", gap: "12px", padding: "12px 22px", borderBottom: "1px solid var(--color-border-faint)", background: "transparent", border: "none", borderTop: "none", borderLeft: "none", borderRight: "none", borderBottomColor: "var(--color-border-faint)", cursor: "pointer", textAlign: "left", alignItems: "center", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg-subtle)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)" }}>
                    {ar.document_number || "—"}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ar.client_name}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {new Date(ar.document_date).toLocaleDateString(es ? "es-MX" : "en-US")} · {daysOld}d
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                      {ar.currency} ${fmt(ar.balance)}
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>
                      {es ? "saldo" : "balance"}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: isOverdue ? "var(--color-danger-bg)" : "var(--color-success-bg)", color: isOverdue ? "var(--color-danger-text)" : "var(--color-success-text)" }}>
                      {isOverdue ? (es ? "Vencida" : "Overdue") : (es ? "Vigente" : "Current")}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
