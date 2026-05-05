// ════════════════════════════════════════════════════════════════════════
// TabBanking — Tab 6 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Lista de cuentas bancarias del partner. Los campos sensibles (CLABE,
// número de cuenta, IBAN) se enmascaran por defecto y solo se revelan
// con el botón 👁 (toggle).
//
// La encriptación ocurre en el servidor (endpoint /api/partner-banking)
// con AES-256-GCM. El cliente nunca toca las claves de cifrado.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { PartnerBanking } from "../services/partner-banking.service";
import { Field, FIELD_INPUT, FIELD_SELECT, SectionTitle } from "../components/Field";

// ── Props ─────────────────────────────────────────────────────────────
export type TabBankingProps = {
  banking:  PartnerBanking[];
  onChange: (banking: PartnerBanking[]) => void;
};

// ── Estilos reutilizables ─────────────────────────────────────────────
const ROW: CSSProperties = {
  position:      "relative",
  padding:       "16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "flex",
  flexDirection: "column",
  gap:           "12px",
};

const ROW_HEADER: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "12px",
};

const DEFAULT_BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "4px",
  padding:        "3px 8px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "10px",
  fontWeight:     700,
  letterSpacing:  "0.4px",
  textTransform:  "uppercase",
  background:     "rgba(34, 197, 94, 0.15)",
  color:          "var(--color-success-text)",
};

const ICON_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  width:          "28px",
  height:         "28px",
  borderRadius:   "var(--radius-sm, 4px)",
  border:         "1px solid var(--color-border)",
  background:     "transparent",
  color:          "var(--color-text-muted)",
  cursor:         "pointer",
  fontSize:       "14px",
  outline:        "none",
};

const ADD_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  height:         "34px",
  padding:        "0 14px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "13px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px dashed var(--color-brand-blue, #3b82f6)",
  background:     "transparent",
  color:          "var(--color-brand-blue, #3b82f6)",
  outline:        "none",
  alignSelf:      "flex-start",
};

const EMPTY_STATE: CSSProperties = {
  padding:       "32px 20px",
  textAlign:     "center",
  border:        "1px dashed var(--color-border)",
  borderRadius:  "var(--radius-md)",
  color:         "var(--color-text-muted)",
  fontSize:      "13px",
  lineHeight:    1.6,
};

const SECURITY_NOTICE: CSSProperties = {
  padding:       "10px 14px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid rgba(59, 130, 246, 0.25)",
  background:    "rgba(59, 130, 246, 0.08)",
  color:         "var(--color-text-primary)",
  fontSize:      "12px",
  lineHeight:    1.55,
  display:       "flex",
  alignItems:    "flex-start",
  gap:           "8px",
};

// ── Catálogo bancos comunes en MX (autocompletar opcional) ───────────
const COMMON_BANKS = [
  "BBVA", "Santander", "Banamex (Citi)", "Banorte", "HSBC", "Scotiabank",
  "Inbursa", "Banco del Bajío", "Banregio", "Afirme", "Mifel",
  "Multiva", "Banco Azteca", "BanCoppel", "STP", "NU México", "Klar",
  "Hey Banco", "Banco Sabadell",
];

const ACCOUNT_TYPES = [
  { code: "checking",  label: "Cheques" },
  { code: "savings",   label: "Ahorros" },
  { code: "deposit",   label: "Depósito a la vista" },
  { code: "payroll",   label: "Nómina" },
  { code: "other",     label: "Otra" },
];

const CURRENCIES = ["MXN", "USD", "EUR", "CAD"];

// ── Helper: enmascarar string (mostrar últimos 4 dígitos) ────────────
function mask(value: string | null | undefined): string {
  if (!value) return "—";
  const v = value.trim();
  if (v.length <= 4) return "••••";
  return "•".repeat(Math.max(4, v.length - 4)) + v.slice(-4);
}

// ── Helper: UUID local ───────────────────────────────────────────────
function genLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Componente ────────────────────────────────────────────────────────
export function TabBanking({ banking, onChange }: TabBankingProps) {
  // Estado local: qué cuentas tienen los sensibles revelados
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const visible = banking.filter((b) => !b._isDeleted);

  // ── Handlers ──────────────────────────────────────────────────────
  function handleAdd() {
    const newB: PartnerBanking = {
      _localId:       genLocalId(),
      _isDirty:       true,
      bank_name:      "",
      account_holder: "",
      currency:       "MXN",
      account_type:   "checking",
      is_default:     banking.length === 0,
      is_active:      true,
    };
    onChange([...banking, newB]);
  }

  function handlePatch(idxVisible: number, patch: Partial<PartnerBanking>) {
    const target = visible[idxVisible];
    const realIdx = banking.indexOf(target);
    if (realIdx < 0) return;

    const next = [...banking];
    next[realIdx] = { ...target, ...patch, _isDirty: true };

    if (patch.is_default === true) {
      next.forEach((b, i) => {
        if (i !== realIdx && b.is_default && !b._isDeleted) {
          next[i] = { ...b, is_default: false, _isDirty: true };
        }
      });
    }
    onChange(next);
  }

  function handleDelete(idxVisible: number) {
    const target = visible[idxVisible];
    const realIdx = banking.indexOf(target);
    if (realIdx < 0) return;

    const next = [...banking];
    if (target.id) {
      next[realIdx] = { ...target, _isDeleted: true };
    } else {
      next.splice(realIdx, 1);
    }
    onChange(next);
  }

  function toggleReveal(key: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <SectionTitle>Datos bancarios del partner</SectionTitle>

      <div style={SECURITY_NOTICE}>
        <span style={{ fontSize: "16px" }}>🔒</span>
        <div>
          <strong>Encriptación AES-256-GCM:</strong> Los números de cuenta, CLABE e IBAN se
          encriptan en el servidor antes de guardarse. Nunca se exponen al frontend ni viajan
          en texto plano fuera de tu sesión activa. Los demás campos (banco, beneficiario,
          alias, notas) sí son visibles.
        </div>
      </div>

      {visible.length === 0 && (
        <div style={EMPTY_STATE}>
          🏦 No hay cuentas bancarias registradas.
          <br />
          Agrega al menos una para procesar pagos al partner.
        </div>
      )}

      {visible.map((b, i) => {
        const key = b.id ?? b._localId ?? String(i);
        const isRevealed = revealed.has(key);

        return (
          <div key={key} style={ROW}>
            <div style={ROW_HEADER}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "16px" }}>🏦</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {b.alias || b.bank_name || "(sin nombre)"}
                </span>
                {b.is_default && <span style={DEFAULT_BADGE}>⭐ Default</span>}
                {b.currency && (
                  <span
                    style={{
                      fontSize:     "10px",
                      fontWeight:   600,
                      padding:      "3px 6px",
                      borderRadius: "var(--radius-sm, 4px)",
                      background:   "rgba(148, 163, 184, 0.15)",
                      color:        "var(--color-text-muted)",
                    }}
                  >
                    {b.currency}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => toggleReveal(key)}
                  style={ICON_BUTTON}
                  title={isRevealed ? "Ocultar datos sensibles" : "Mostrar datos sensibles"}
                  aria-label="Toggle datos sensibles"
                >
                  {isRevealed ? "🙈" : "👁"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(i)}
                  style={ICON_BUTTON}
                  title="Eliminar cuenta"
                  aria-label="Eliminar cuenta"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap:                 "12px",
              }}
            >
              <Field label="Banco" required span={2}>
                <input
                  type="text"
                  value={b.bank_name ?? ""}
                  onChange={(e) => handlePatch(i, { bank_name: e.target.value })}
                  placeholder="Ej. BBVA"
                  list="common-banks-datalist"
                  style={FIELD_INPUT}
                />
              </Field>

              <Field label="Beneficiario" required span={2}>
                <input
                  type="text"
                  value={b.account_holder ?? ""}
                  onChange={(e) => handlePatch(i, { account_holder: e.target.value })}
                  placeholder="Nombre tal como aparece en el banco"
                  style={FIELD_INPUT}
                />
              </Field>

              <Field label="Tipo de cuenta">
                <select
                  value={b.account_type ?? "checking"}
                  onChange={(e) => handlePatch(i, { account_type: e.target.value })}
                  style={FIELD_SELECT}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Moneda">
                <select
                  value={b.currency ?? "MXN"}
                  onChange={(e) => handlePatch(i, { currency: e.target.value })}
                  style={FIELD_SELECT}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Alias (interno)" span={2}>
                <input
                  type="text"
                  value={b.alias ?? ""}
                  onChange={(e) => handlePatch(i, { alias: e.target.value })}
                  placeholder="Ej. Cuenta principal MXN"
                  style={FIELD_INPUT}
                />
              </Field>

              <Field
                label="CLABE (18 dígitos)"
                span={2}
                hint={isRevealed ? "Texto en claro — visible solo a ti." : "Encriptado en BD."}
              >
                {isRevealed ? (
                  <input
                    type="text"
                    value={b.clabe ?? ""}
                    onChange={(e) => handlePatch(i, { clabe: e.target.value.replace(/\D/g, "").slice(0, 18) })}
                    placeholder="000000000000000000"
                    maxLength={18}
                    style={{ ...FIELD_INPUT, fontFamily: "monospace" }}
                  />
                ) : (
                  <div
                    style={{
                      ...FIELD_INPUT,
                      display:        "flex",
                      alignItems:     "center",
                      fontFamily:     "monospace",
                      color:          "var(--color-text-muted)",
                      letterSpacing:  "0.5px",
                    }}
                  >
                    {mask(b.clabe)}
                  </div>
                )}
              </Field>

              <Field
                label="Número de cuenta"
                span={2}
                hint={isRevealed ? "Texto en claro." : "Encriptado en BD."}
              >
                {isRevealed ? (
                  <input
                    type="text"
                    value={b.account_number ?? ""}
                    onChange={(e) => handlePatch(i, { account_number: e.target.value })}
                    placeholder="Número de cuenta"
                    style={{ ...FIELD_INPUT, fontFamily: "monospace" }}
                  />
                ) : (
                  <div
                    style={{
                      ...FIELD_INPUT,
                      display:    "flex",
                      alignItems: "center",
                      fontFamily: "monospace",
                      color:      "var(--color-text-muted)",
                    }}
                  >
                    {mask(b.account_number)}
                  </div>
                )}
              </Field>

              <Field label="IBAN (cuentas internacionales)" span={2} hint="Solo si aplica.">
                {isRevealed ? (
                  <input
                    type="text"
                    value={b.iban ?? ""}
                    onChange={(e) => handlePatch(i, { iban: e.target.value.toUpperCase() })}
                    placeholder="MX00 0000 0000..."
                    style={{ ...FIELD_INPUT, fontFamily: "monospace" }}
                  />
                ) : (
                  <div
                    style={{
                      ...FIELD_INPUT,
                      display:    "flex",
                      alignItems: "center",
                      fontFamily: "monospace",
                      color:      "var(--color-text-muted)",
                    }}
                  >
                    {mask(b.iban)}
                  </div>
                )}
              </Field>

              <Field label="Código SWIFT/BIC" hint="Para transferencias internacionales.">
                <input
                  type="text"
                  value={b.swift_code ?? ""}
                  onChange={(e) => handlePatch(i, { swift_code: e.target.value.toUpperCase() })}
                  placeholder="BBVAMXMM"
                  maxLength={11}
                  style={{ ...FIELD_INPUT, fontFamily: "monospace" }}
                />
              </Field>

              <Field label="Default">
                <label
                  style={{
                    display:    "inline-flex",
                    alignItems: "center",
                    gap:        "8px",
                    height:     "36px",
                    cursor:     "pointer",
                    fontSize:   "13px",
                    color:      "var(--color-text-primary)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={b.is_default ?? false}
                    onChange={(e) => handlePatch(i, { is_default: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-brand-blue, #3b82f6)" }}
                  />
                  Cuenta predeterminada
                </label>
              </Field>

              <Field label="Notas" span={4}>
                <input
                  type="text"
                  value={b.notes ?? ""}
                  onChange={(e) => handlePatch(i, { notes: e.target.value })}
                  placeholder="Observaciones, condiciones, etc."
                  style={FIELD_INPUT}
                />
              </Field>
            </div>
          </div>
        );
      })}

      <button type="button" onClick={handleAdd} style={ADD_BUTTON}>
        ➕ Agregar cuenta bancaria
      </button>

      <datalist id="common-banks-datalist">
        {COMMON_BANKS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
    </div>
  );
}