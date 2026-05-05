// ════════════════════════════════════════════════════════════════════════
// SATValidationCard — Tarjeta de validación SAT vía Facturapi
// ════════════════════════════════════════════════════════════════════════
// Muestra el estado actual de validación SAT del partner y permite
// dispararla manualmente con el botón "Validar con SAT".
//
// Estados visuales:
//   - not_verified → badge gris + botón "Validar con SAT"
//   - validating   → spinner "Validando..."
//   - valid        → badge verde + fecha + botón "Re-validar"
//   - invalid      → badge rojo + mensaje de error + botón "Re-validar"
//
// La validación llama a /api/sat/validate-customer que internamente usa
// Facturapi customers.create para verificar RFC + régimen + CP contra el
// padrón SAT.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Partner, ValidationSATStatus } from "../types";

// ── Props ─────────────────────────────────────────────────────────────
export type SATValidationCardProps = {
  partner:    Partial<Partner>;
  companyId:  string;
  onPatch:    (patch: Partial<Partner>) => void;
};

// ── Estilos ───────────────────────────────────────────────────────────
const CARD: CSSProperties = {
  padding:       "14px 16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "flex",
  flexDirection: "column",
  gap:           "10px",
};

const HEADER: CSSProperties = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            "12px",
};

const TITLE: CSSProperties = {
  display:    "flex",
  alignItems: "center",
  gap:        "8px",
  fontSize:   "13px",
  fontWeight: 700,
  color:      "var(--color-text-primary)",
};

const BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  justifyContent: "center",
  height:         "30px",
  padding:        "0 12px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "12px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px solid var(--color-brand-blue, #3b82f6)",
  background:     "var(--color-brand-blue, #3b82f6)",
  color:          "#fff",
  outline:        "none",
};

const HINT: CSSProperties = {
  fontSize:    "12px",
  color:       "var(--color-text-muted)",
  lineHeight:  1.5,
};

// ── Helper: badge según el estado ─────────────────────────────────────
function StatusBadge({ status }: { status: ValidationSATStatus }) {
  const cfg: Record<ValidationSATStatus, { label: string; bg: string; fg: string }> = {
    not_verified: { label: "No validado",   bg: "rgba(148, 163, 184, 0.15)", fg: "var(--color-text-muted)"    },
    valid:        { label: "✓ Validado",   bg: "rgba(34, 197, 94, 0.15)",   fg: "var(--color-success-text)"  },
    invalid:      { label: "✗ Inválido",   bg: "rgba(239, 68, 68, 0.15)",   fg: "var(--color-danger-text)"   },
  };
  const c = cfg[status];
  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        padding:       "4px 10px",
        borderRadius:  "var(--radius-sm, 4px)",
        background:    c.bg,
        color:         c.fg,
        fontSize:      "11px",
        fontWeight:    700,
        letterSpacing: "0.3px",
      }}
    >
      {c.label}
    </span>
  );
}

// ── Helper: formatear fecha ───────────────────────────────────────────
function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

// ── Componente ────────────────────────────────────────────────────────
export function SATValidationCard({ partner, companyId, onPatch }: SATValidationCardProps) {
  const [validating, setValidating] = useState(false);
  const [feedback,   setFeedback]   = useState<string | null>(null);

  const status = (partner.validation_sat_status ?? "not_verified") as ValidationSATStatus;

  // Datos mínimos requeridos para validar
  const canValidate =
    Boolean(partner.rfc) &&
    Boolean(partner.legal_name) &&
    Boolean(partner.tax_regime) &&
    Boolean(partner.zip_code) &&
    /^\d{5}$/.test(partner.zip_code ?? "");

  async function handleValidate() {
    if (!companyId || !canValidate) return;

    setValidating(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sat/validate-customer", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          rfc:        partner.rfc,
          taxRegime:  partner.tax_regime,
          zipCode:    partner.zip_code,
          legalName:  partner.legal_name,
          email:      partner.billing_email ?? partner.email,
          partnerId:  partner.id,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?:         boolean;
        status?:     "valid" | "invalid" | "error";
        error?:      string;
        customerId?: string;
      };

      const nowIso = new Date().toISOString();

      if (data.ok && data.status === "valid") {
        onPatch({
          validation_sat_status: "valid",
          validation_sat_date:   nowIso,
          validation_sat_error:  undefined,
          facturapi_customer_id: data.customerId,
        });
        setFeedback("✓ Datos fiscales validados correctamente con el padrón SAT.");
      } else {
        const err = data.error ?? "Error desconocido al validar con SAT.";
        onPatch({
          validation_sat_status: "invalid",
          validation_sat_date:   nowIso,
          validation_sat_error:  err,
        });
        setFeedback(`✗ ${err}`);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setFeedback(`✗ Error de red: ${errMsg}`);
    } finally {
      setValidating(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div style={CARD}>
      <div style={HEADER}>
        <div style={TITLE}>
          <span style={{ fontSize: "16px" }}>🛡️</span>
          Validación SAT (padrón fiscal)
          <StatusBadge status={status} />
        </div>

        <button
          type="button"
          onClick={handleValidate}
          disabled={!canValidate || validating || !companyId}
          style={{
            ...BUTTON,
            opacity: !canValidate || validating || !companyId ? 0.5 : 1,
            cursor:  !canValidate || validating || !companyId ? "not-allowed" : "pointer",
          }}
          title={!canValidate ? "Completa RFC, razón social, régimen y CP fiscal antes de validar" : undefined}
        >
          {validating ? "Validando..." : status === "valid" ? "Re-validar" : "Validar con SAT"}
        </button>
      </div>

      {/* Mensaje según estado */}
      {status === "valid" && partner.validation_sat_date && (
        <div style={{ ...HINT, color: "var(--color-success-text)" }}>
          Última validación exitosa: <strong>{formatDate(partner.validation_sat_date)}</strong>
          {partner.facturapi_customer_id && (
            <span style={{ marginLeft: "8px", opacity: 0.7 }}>
              · Facturapi ID: <code style={{ fontSize: "10px" }}>{partner.facturapi_customer_id}</code>
            </span>
          )}
        </div>
      )}

      {status === "invalid" && partner.validation_sat_error && (
        <div style={{ ...HINT, color: "var(--color-danger-text)" }}>
          ⚠️ {partner.validation_sat_error}
        </div>
      )}

      {status === "not_verified" && !feedback && (
        <div style={HINT}>
          Esta validación verifica que el RFC, régimen fiscal y código postal
          coincidan con el padrón del SAT vía Facturapi. Es necesaria antes de
          poder emitir CFDI a este partner.
        </div>
      )}

      {feedback && status !== "not_verified" && (
        <div
          style={{
            ...HINT,
            color: feedback.startsWith("✓") ? "var(--color-success-text)" : "var(--color-danger-text)",
          }}
        >
          {feedback}
        </div>
      )}

      {!canValidate && status === "not_verified" && (
        <div style={{ ...HINT, fontStyle: "italic" }}>
          Completa RFC, razón social, régimen fiscal y código postal para habilitar la validación.
        </div>
      )}
    </div>
  );
}