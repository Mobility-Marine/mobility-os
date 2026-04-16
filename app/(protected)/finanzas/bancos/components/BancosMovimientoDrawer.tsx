"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BankAccount, BankTransactionType, BankTransactionCategory } from "../types/bancos.types";
import { TX_TYPE_CONFIG, TX_CATEGORY_CONFIG } from "../types/bancos.types";

type Props = {
  open:     boolean;
  saving:   boolean;
  accounts: BankAccount[];
  onClose:  () => void;
  onCreate: (payload: any) => Promise<void>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function BancosMovimientoDrawer({ open, saving, accounts, onClose, onCreate }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const bnk = (t as any).bancos ?? {};

  const [form, setForm] = useState({
    bank_account_id:  "",
    type:             "expense" as BankTransactionType,
    category:         "other"   as BankTransactionCategory,
    concept:          "",
    reference:        "",
    transaction_date: new Date().toISOString().split("T")[0],
    amount:           "",
    currency:         "MXN",
    exchange_rate:    "1",
    transfer_to_id:   "",
    notes:            "",
  });
  const [error, setError] = useState<string | null>(null);

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit() {
    if (!form.bank_account_id) { setError(es ? "Selecciona una cuenta" : "Select an account"); return; }
    if (!form.concept.trim())  { setError(es ? "El concepto es requerido" : "Concept required"); return; }
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0){ setError(es ? "Ingresa un monto válido" : "Enter valid amount"); return; }
    if (form.type === "transfer_out" && !form.transfer_to_id) {
      setError(es ? "Selecciona la cuenta destino" : "Select destination account"); return;
    }
    setError(null);
    try {
      await onCreate({
        bank_account_id:  form.bank_account_id,
        type:             form.type,
        category:         form.category,
        concept:          form.concept.trim(),
        reference:        form.reference  || undefined,
        transaction_date: form.transaction_date,
        amount,
        currency:         form.currency,
        exchange_rate:    parseFloat(form.exchange_rate) || 1,
        transfer_to_id:   form.type === "transfer_out" ? form.transfer_to_id : undefined,
        notes:            form.notes || undefined,
      });
      setForm({ bank_account_id: "", type: "expense", category: "other", concept: "", reference: "", transaction_date: new Date().toISOString().split("T")[0], amount: "", currency: "MXN", exchange_rate: "1", transfer_to_id: "", notes: "" });
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  if (!open) return null;

  const isTransfer = form.type === "transfer_out";
  const selectedAcc = accounts.find(a => a.id === form.bank_account_id);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(500px,96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            {bnk.addTransaction ?? "+ Movimiento manual"}
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}

          {/* Tipo */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Tipo de movimiento *</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6px" }}>
              {(Object.entries(TX_TYPE_CONFIG) as [BankTransactionType, any][]).map(([type, cfg]) => (
                <button key={type} onClick={() => setF("type", type)}
                  style={{ height: "42px", borderRadius: "var(--radius-md)", border: `2px solid ${form.type === type ? cfg.color : "var(--color-border-faint)"}`, background: form.type === type ? `${cfg.color}15` : "var(--color-bg-subtle)", cursor: "pointer", fontSize: "10px", fontWeight: 600, color: form.type === type ? cfg.color : "var(--color-text-muted)" }}>
                  {cfg.sign === 1 ? "↑" : "↓"} {cfg.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Cuenta origen */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>
              {isTransfer ? "Cuenta origen *" : "Cuenta *"}
            </div>
            <select value={form.bank_account_id} onChange={e => {
              const acc = accounts.find(a => a.id === e.target.value);
              setForm(p => ({ ...p, bank_account_id: e.target.value, currency: acc?.currency ?? "MXN" }));
            }} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">— Seleccionar cuenta —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} · {a.bank_name} · {a.currency} ${a.current_balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</option>
              ))}
            </select>
          </div>

          {/* Cuenta destino (solo transferencias) */}
          {isTransfer && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Cuenta destino *</div>
              <select value={form.transfer_to_id} onChange={e => setF("transfer_to_id", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">— Seleccionar cuenta destino —</option>
                {accounts.filter(a => a.id !== form.bank_account_id).map(a => (
                  <option key={a.id} value={a.id}>{a.name} · {a.bank_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Categoría */}
          {!isTransfer && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Categoría</div>
              <select value={form.category} onChange={e => setF("category", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {(Object.entries(TX_CATEGORY_CONFIG) as [BankTransactionCategory, any][]).filter(([k]) => k !== "transfer").map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Datos del movimiento */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Concepto *</div>
              <input value={form.concept} onChange={e => setF("concept", e.target.value)} placeholder="Descripción del movimiento" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Fecha *</div>
              <input type="date" value={form.transaction_date} onChange={e => setF("transaction_date", e.target.value)} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Referencia / Folio</div>
              <input value={form.reference} onChange={e => setF("reference", e.target.value)} placeholder="SPEI-001, CHQ-123…" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Monto *</div>
              <input type="number" min="0" value={form.amount} onChange={e => setF("amount", e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
              <select value={form.currency} onChange={e => setF("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Saldo actual de la cuenta seleccionada */}
          {selectedAcc && (
            <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Saldo actual {selectedAcc.name}</span>
              <span style={{ fontWeight: 800, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {selectedAcc.currency} ${selectedAcc.current_balance.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
            <textarea rows={2} value={form.notes} onChange={e => setF("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-success-text)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? "✓ Registrar movimiento" : "✓ Save transaction")}
          </button>
          <button onClick={onClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
