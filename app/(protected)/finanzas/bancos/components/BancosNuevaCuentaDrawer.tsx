"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { BankAccountType } from "../types/bancos.types";
import { ACCOUNT_TYPE_CONFIG, BANK_NAMES } from "../types/bancos.types";

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

const COLORS = ["#1d4ed8","#059669","#7c3aed","#d97706","#dc2626","#0891b2","#475569"];

export default function BancosNuevaCuentaDrawer({ open, saving, onClose, onCreate }: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const bnk = (t as any).bancos ?? {};

  const [form, setForm] = useState({
    name:            "",
    bank_name:       "",
    account_type:    "checking" as BankAccountType,
    account_number:  "",
    clabe:           "",
    currency:        "MXN",
    opening_balance: "",
    color:           "#1d4ed8",
    notes:           "",
  });
  const [error, setError] = useState<string | null>(null);

  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit() {
    if (!form.name.trim())     { setError(es ? "El nombre es requerido" : "Name required"); return; }
    if (!form.bank_name.trim()){ setError(es ? "El banco es requerido"  : "Bank required"); return; }
    setError(null);
    try {
      await onCreate({
        name:            form.name.trim(),
        bank_name:       form.bank_name.trim(),
        account_type:    form.account_type,
        account_number:  form.account_number || undefined,
        clabe:           form.clabe          || undefined,
        currency:        form.currency,
        opening_balance: parseFloat(form.opening_balance) || 0,
        color:           form.color,
        notes:           form.notes || undefined,
      });
      setForm({ name: "", bank_name: "", account_type: "checking", account_number: "", clabe: "", currency: "MXN", opening_balance: "", color: "#1d4ed8", notes: "" });
      onClose();
    } catch (e: any) { setError(e.message); }
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 500 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(500px,96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", zIndex: 501, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>
            🏦 {bnk.addAccount ?? "Nueva cuenta bancaria"}
          </div>
          <button onClick={onClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>
          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}

          {/* Tipo de cuenta */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Tipo de cuenta *</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "6px" }}>
              {(Object.entries(ACCOUNT_TYPE_CONFIG) as [BankAccountType, any][]).map(([type, cfg]) => (
                <button key={type} onClick={() => setF("account_type", type)}
                  style={{ height: "52px", borderRadius: "var(--radius-md)", border: `2px solid ${form.account_type === type ? cfg.color : "var(--color-border-faint)"}`, background: form.account_type === type ? `${cfg.color}15` : "var(--color-bg-subtle)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                  <span style={{ fontSize: "18px" }}>{cfg.icon}</span>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: form.account_type === type ? cfg.color : "var(--color-text-muted)" }}>{cfg.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Banco */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Banco *</div>
            <select value={form.bank_name} onChange={e => setF("bank_name", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">— Seleccionar banco —</option>
              {BANK_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Nombre y datos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Nombre de la cuenta *</div>
              <input value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Ej: BBVA Operaciones" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Últimos 4 dígitos</div>
              <input value={form.account_number} onChange={e => setF("account_number", e.target.value)} placeholder="0000" maxLength={4} style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Moneda</div>
              <select value={form.currency} onChange={e => setF("currency", e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {["MXN","USD","EUR"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>CLABE interbancaria</div>
              <input value={form.clabe} onChange={e => setF("clabe", e.target.value)} placeholder="18 dígitos" maxLength={18} style={INPUT} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Saldo inicial</div>
              <input type="number" min="0" value={form.opening_balance} onChange={e => setF("opening_balance", e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
          </div>

          {/* Color */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Color identificador</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setF("color", c)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: `3px solid ${form.color === c ? "white" : c}`, outline: form.color === c ? `2px solid ${c}` : "none", cursor: "pointer" }} />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
            <textarea rows={2} value={form.notes} onChange={e => setF("notes", e.target.value)} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px" }}>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Guardando…" : "Saving…") : (es ? "Crear cuenta" : "Create account")}
          </button>
          <button onClick={onClose} style={{ height: "40px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "13px", cursor: "pointer" }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
        </div>
      </div>
    </>
  );
}
