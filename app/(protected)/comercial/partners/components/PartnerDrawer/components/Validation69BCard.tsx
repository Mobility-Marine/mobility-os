// ════════════════════════════════════════════════════════════════════════
// Validation69BCard — Tarjeta de validación 69-B EFOS
// ════════════════════════════════════════════════════════════════════════
// El artículo 69-B del CFF identifica empresas que facturaron operaciones
// inexistentes (EFOS). Hacer negocios con un EFOS Definitivo es delito.
//
// MVP: validación manual mediante:
//   - Dropdown con los 6 estados del 69-B (no_verified → definitive)
//   - Botón "Verificar en portal SAT" → abre listado oficial en nueva pestaña
//   - Campo notas para observaciones internas
//   - URL de evidencia (PDF descargado del portal SAT)
//
// Futuro: integración con SW Sapien/Verifier API para validación
// automática programada.
// ════════════════════════════════════════════════════════════════════════
"use client";

import type { CSSProperties } from "react";
import type { Partner, Validation69BStatus } from "../types";
import { VALIDATION_69B_CONFIG } from "../types";
import { Field, FIELD_INPUT, FIELD_SELECT, FIELD_TEXTAREA } from "./Field";

// ── Props ─────────────────────────────────────────────────────────────
export type Validation69BCardProps = {
  partner: Partial<Partner>;
  onPatch: (patch: Partial<Partner>) => void;
};

// ── Estilos ───────────────────────────────────────────────────────────
const CARD: CSSProperties = {
  padding:       "14px 16px",
  borderRadius:  "var(--radius-md)",
  border:        "1px solid var(--color-border)",
  background:    "var(--color-bg-subtle)",
  display:       "flex",
  flexDirection: "column",
  gap:           "12px",
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

const RISK_BADGE: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  padding:        "4px 10px",
  borderRadius:   "var(--radius-sm, 4px)",
  fontSize:       "11px",
  fontWeight:     700,
  letterSpacing:  "0.3px",
};

const LINK_BUTTON: CSSProperties = {
  display:        "inline-flex",
  alignItems:     "center",
  gap:            "6px",
  height:         "30px",
  padding:        "0 12px",
  borderRadius:   "var(--radius-md)",
  fontSize:       "12px",
  fontWeight:     600,
  cursor:         "pointer",
  border:         "1px solid var(--color-border)",
  background:     "var(--color-bg-base)",
  color:          "var(--color-text-primary)",
  textDecoration: "none",
  outline:        "none",
};

const RISK_COLORS: Record<"none" | "low" | "medium" | "high", { bg: string; fg: string }> = {
  none:   { bg: "rgba(148, 163, 184, 0.15)", fg: "var(--color-text-muted)"    },
  low:    { bg: "rgba(34, 197, 94, 0.15)",   fg: "var(--color-success-text)"  },
  medium: { bg: "rgba(245, 158, 11, 0.15)",  fg: "var(--color-warning-text)"  },
  high:   { bg: "rgba(239, 68, 68, 0.15)",   fg: "var(--color-danger-text)"   },
};

// ── URL del portal SAT (listado completo de EFOS) ────────────────────
// El usuario puede consultar y descargar el listado oficial.
const SAT_PORTAL_URL =
  "https://portalsat.plataforma.sat.gob.mx/ConsultaListadoCompleto/";

// ── Componente ────────────────────────────────────────────────────────
export function Validation69BCard({ partner, onPatch }: Validation69BCardProps) {
  const status = (partner.validation_69b_status ?? "not_verified") as Validation69BStatus;
  const config = VALIDATION_69B_CONFIG[status];
  const riskColors = RISK_COLORS[config.risk];

  function handleStatusChange(next: Validation69BStatus) {
    onPatch({
      validation_69b_status: next,
      validation_69b_date:   new Date().toISOString(),
    });
  }

  return (
    <div style={CARD}>
      <div style={HEADER}>
        <div style={TITLE}>
          <span style={{ fontSize: "16px" }}>📋</span>
          Validación 69-B EFOS
          <span style={{ ...RISK_BADGE, ...riskColors }}>
            {config.label}
          </span>
        </div>

        
          <a href={SAT_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={LINK_BUTTON}
        >
          🔗 Verificar en portal SAT
        </a>
      </div>

      <div
        style={{
          fontSize:    "12px",
          color:       "var(--color-text-muted)",
          lineHeight:  1.5,
        }}
      >
        El artículo 69-B identifica empresas que facturaron operaciones inexistentes (EFOS).
        Consulta el portal SAT con el RFC <strong>{partner.rfc ?? "(sin RFC)"}</strong>,
        descarga el resultado y registra el estado abajo.
      </div>

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr",
          gap:                 "12px",
        }}
      >
        <Field label="Estado actual">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as Validation69BStatus)}
            style={FIELD_SELECT}
          >
            <option value="not_verified">No verificado</option>
            <option value="clean">Limpio (no aparece en lista)</option>
            <option value="alleged">Presunto EFOS</option>
            <option value="definitive">Definitivo EFOS — alto riesgo</option>
            <option value="detracted">Desvirtuado (logró desvirtuar la presunción)</option>
            <option value="favorable">Sentencia favorable</option>
          </select>
        </Field>

        <Field label="URL de evidencia (PDF del portal SAT)">
          <input
            type="url"
            value={partner.validation_69b_evidence_url ?? ""}
            onChange={(e) => onPatch({ validation_69b_evidence_url: e.target.value })}
            placeholder="https://..."
            style={FIELD_INPUT}
          />
        </Field>
      </div>

      <Field label="Notas internas sobre 69-B" hint="Observaciones, hallazgos del consulto, etc.">
        <textarea
          value={partner.validation_69b_notes ?? ""}
          onChange={(e) => onPatch({ validation_69b_notes: e.target.value })}
          placeholder="Ej. Consultado el 4 may 2026 — no aparece en la lista 69-B."
          style={FIELD_TEXTAREA}
          rows={2}
        />
      </Field>
    </div>
  );
}