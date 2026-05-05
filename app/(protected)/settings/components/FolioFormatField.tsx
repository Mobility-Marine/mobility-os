"use client";

// ════════════════════════════════════════════════════════════════════════
// FOLIOFORMATFIELD — Componente reutilizable para configurar formatos
// ════════════════════════════════════════════════════════════════════════
// Patrón ERP-grade: cada documento del sistema (cotización, pedido,
// servicio, recepción, OC, conteo) tiene un formato configurable de folio.
// Este componente encapsula el patrón común:
//   - Input para el formato con tokens
//   - Input para el contador "próximo número"
//   - Vista previa en tiempo real
//   - Lista de tokens disponibles como chips clicables
//
// Uso típico desde un drawer:
//   <FolioFormatField
//     format={form.quote_number_format}
//     counter={form.quote_number_counter}
//     onChangeFormat={(v) => setForm({...form, quote_number_format: v})}
//     onChangeCounter={(v) => setForm({...form, quote_number_counter: v})}
//     fiscalRfc={settings?.fiscal_rfc}
//     supportedTokens={["AÑO", "MES", "NUM", "EMPRESA"]}
//     subtipoForPreview="CON"  // opcional, solo para servicios logísticos
//   />
// ════════════════════════════════════════════════════════════════════════

import { previewFolio } from "@/lib/folios/generators";

export type FolioFormatFieldProps = {
  /** Valor actual del formato (string con tokens) */
  format: string;
  /** Próximo contador (1..N) */
  counter: number;
  /** Callback al cambiar el formato */
  onChangeFormat: (v: string) => void;
  /** Callback al cambiar el contador */
  onChangeCounter: (v: number) => void;
  /** RFC fiscal de la empresa (para resolver token {EMPRESA}) */
  fiscalRfc?: string | null;
  /** Tokens que se mostrarán como chips disponibles */
  supportedTokens?: Array<"EMPRESA" | "SUBTIPO" | "CLIENTE" | "TIPO" | "AÑO" | "MES" | "NUM">;
  /** Si el documento usa subtipo (CON/LOG), pasarlo para previews precisos */
  subtipoForPreview?: "CON" | "LOG";
  /** Etiqueta del campo de formato. Default: "Formato del folio" */
  formatLabel?: string;
  /** Etiqueta del contador. Default: "Próximo número" */
  counterLabel?: string;
  /** Texto de ayuda debajo del preview */
  helpText?: string;
};

const TOKEN_DESCRIPTIONS: Record<string, string> = {
  EMPRESA: "3 letras del RFC fiscal (ej. MMA)",
  SUBTIPO: "CON o LOG (solo servicios logísticos)",
  CLIENTE: "3 letras del nombre del cliente (legacy)",
  TIPO:    "Código del tipo de servicio (legacy)",
  AÑO:     "Año en 4 dígitos (ej. 2026)",
  MES:     "Mes en 2 dígitos (01..12)",
  NUM:     "Número correlativo en 4 dígitos (0001..9999)",
};

export default function FolioFormatField({
  format,
  counter,
  onChangeFormat,
  onChangeCounter,
  fiscalRfc,
  supportedTokens = ["EMPRESA", "AÑO", "MES", "NUM"],
  subtipoForPreview,
  formatLabel  = "Formato del folio",
  counterLabel = "Próximo número",
  helpText,
}: FolioFormatFieldProps) {
  const preview = previewFolio(
    format || "",
    counter || 1,
    fiscalRfc ?? null,
    subtipoForPreview ? { SUBTIPO: subtipoForPreview } : {},
  );

  const insertToken = (token: string) => {
    onChangeFormat(format + `{${token}}`);
  };

  return (
    <div>
      {/* Campo formato */}
      <div style={{ marginBottom: "14px" }}>
        <label style={labelStyle}>{formatLabel}</label>
        <input
          type="text"
          value={format}
          onChange={(e) => onChangeFormat(e.target.value)}
          style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }}
          placeholder="COT-{AÑO}-{NUM}"
        />
      </div>

      {/* Tokens disponibles como chips */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ ...labelStyle, marginBottom: "8px" }}>Tokens disponibles</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {supportedTokens.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => insertToken(token)}
              title={TOKEN_DESCRIPTIONS[token]}
              style={tokenChipStyle}
            >
              {`{${token}}`}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--fg-muted)" }}>
          Click en un token para insertarlo. Pasa el cursor sobre cada uno para ver descripción.
        </div>
      </div>

      {/* Vista previa */}
      <div style={previewBoxStyle}>
        <div style={previewLabelStyle}>VISTA PREVIA</div>
        <div style={previewValueStyle}>{preview || "—"}</div>
      </div>

      {/* Próximo número */}
      <div style={{ marginTop: "14px" }}>
        <label style={labelStyle}>{counterLabel}</label>
        <input
          type="number"
          min={1}
          value={counter || 1}
          onChange={(e) => onChangeCounter(Number(e.target.value) || 1)}
          style={{ ...inputStyle, maxWidth: "180px" }}
        />
        {helpText && (
          <div style={{ marginTop: "6px", fontSize: "11px", color: "var(--fg-muted)" }}>
            {helpText}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Estilos compartidos ────────────────────────────────────────────────
const labelStyle = {
  display:       "block",
  fontSize:      "12px",
  fontWeight:    600,
  color:         "var(--fg-muted, #64748b)",
  letterSpacing: "0.02em",
  textTransform: "uppercase" as const,
  marginBottom:  "6px",
};

const inputStyle = {
  width:        "100%",
  padding:      "10px 12px",
  fontSize:     "14px",
  borderRadius: "8px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "var(--bg-input, #ffffff)",
  color:        "var(--fg, #0f172a)",
  fontFamily:   "inherit",
  outline:      "none",
  transition:   "border-color 120ms",
};

const tokenChipStyle = {
  padding:      "4px 10px",
  fontSize:     "12px",
  fontFamily:   "ui-monospace, 'SF Mono', Menlo, monospace",
  fontWeight:   500,
  borderRadius: "6px",
  border:       "1px solid var(--border, rgba(148,163,184,0.30))",
  background:   "var(--surface-soft, rgba(148,163,184,0.06))",
  color:        "var(--fg, #0f172a)",
  cursor:       "pointer",
  transition:   "background 120ms",
};

const previewBoxStyle = {
  padding:      "14px 16px",
  borderRadius: "10px",
  background:   "rgba(37,99,235,0.06)",
  border:       "1px dashed rgba(37,99,235,0.25)",
};

const previewLabelStyle = {
  fontSize:      "10px",
  fontWeight:    700,
  letterSpacing: "0.08em",
  color:         "#1d4ed8",
  textTransform: "uppercase" as const,
  marginBottom:  "4px",
};

const previewValueStyle = {
  fontSize:    "18px",
  fontFamily:  "ui-monospace, 'SF Mono', Menlo, monospace",
  fontWeight:  600,
  color:       "var(--fg, #0f172a)",
};