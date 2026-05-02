"use client";

// ═══════════════════════════════════════════════════════════════════════
// RegimenAduaneroSection — Sección 6 del drawer Carta Porte 3.1
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Solo aplica si transp_internac = "Sí". Para mercancía nacional muestra
// un empty state explicando que no aplica.
//
// El SAT permite múltiples regímenes en una misma operación cuando la
// mercancía tiene tratamiento mixto (parte importación definitiva,
// parte temporal, etc.). Por eso es un array.
// ═══════════════════════════════════════════════════════════════════════

import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type {
  CartaPorteData,
  RegimenAduaneroLine,
} from "../../types/carta_porte.types";
import { newRegimenAduanero } from "../../types/carta_porte.defaults";
import type { ValidationError } from "../../types/carta_porte.validations";

interface Props {
  data: CartaPorteData;
  setRegimenes: (next: RegimenAduaneroLine[] | undefined) => void;
  showValidation: boolean;
  errors: ValidationError[];
}

export function RegimenAduaneroSection({
  data,
  setRegimenes,
  showValidation,
  errors,
}: Props) {
  const { items: regimenes, loading } = useSATCatalog("regimen_aduanero");

  const isInternacional = data.header.transp_internac === "Sí";
  const lineas = data.regimenes_aduaneros ?? [];

  // ─── Operaciones ───
  const updateLinea = (tempId: string, regimen: string) => {
    setRegimenes(
      lineas.map(l => (l._temp_id === tempId ? { ...l, regimen_aduanero: regimen } : l))
    );
  };

  const addLinea = () => {
    const nueva = newRegimenAduanero();
    setRegimenes([...lineas, nueva]);
  };

  const removeLinea = (tempId: string) => {
    const next = lineas.filter(l => l._temp_id !== tempId);
    setRegimenes(next.length ? next : undefined);
  };

  // ─── Caso: operación nacional ───
  if (!isInternacional) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "320px",
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-success-bg)",
          border: "1px solid var(--color-success-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "14px",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success-text)" strokeWidth="1.8">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "var(--color-text-primary)",
          marginBottom: "6px",
        }}>
          Régimen aduanero no aplica
        </div>
        <div style={{
          fontSize: "12px",
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
          marginBottom: "12px",
        }}>
          Esta operación es{" "}
          <strong style={{ color: "var(--color-success-text)" }}>nacional</strong>{" "}
          (no cruza fronteras). Solo se requiere régimen aduanero cuando el traslado
          es internacional.
        </div>
        <div style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          opacity: 0.85,
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-faint)",
        }}>
          Para activarlo, ve a{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>Datos Generales</strong>{" "}
          y marca la operación como Internacional.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "780px" }}>
      {/* ── Banner ── */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-brand-orange-light)",
        border: "1px solid var(--color-brand-orange)",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-brand-orange)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          Indica el régimen aduanero bajo el que está la mercancía. Si es una operación
          mixta (ej: parte definitiva + parte temporal), puedes agregar varios regímenes.
        </div>
      </div>

      {/* ── Lista de regímenes ── */}
      <div>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}>
          <div>
            <div style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}>
              Regímenes aduaneros aplicables
            </div>
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              marginTop: "2px",
            }}>
              {lineas.length === 0
                ? "Mínimo 1 régimen"
                : `${lineas.length} ${lineas.length === 1 ? "registrado" : "registrados"}`}
            </div>
          </div>
          {showValidation && errors.length > 0 && (
            <span style={{
              padding: "2px 8px",
              borderRadius: "10px",
              background: "var(--color-danger-bg)",
              color: "var(--color-danger-text)",
              fontSize: "11px",
              fontWeight: 700,
            }}>
              {errors.length} {errors.length === 1 ? "error" : "errores"}
            </span>
          )}
        </div>

        {lineas.length === 0 ? (
          <EmptyState onAdd={addLinea} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {lineas.map((linea, idx) => {
              const selected = regimenes.find(r => r.code === linea.regimen_aduanero);
              return (
                <RegimenRow
                  key={linea._temp_id}
                  index={idx}
                  linea={linea}
                  regimenes={regimenes}
                  loading={loading}
                  description={selected?.label}
                  onUpdate={value => updateLinea(linea._temp_id, value)}
                  onRemove={() => removeLinea(linea._temp_id)}
                />
              );
            })}
            <DashedAdd onClick={addLinea} label="Agregar otro régimen" />
          </div>
        )}
      </div>

      {/* ── Guía de regímenes comunes ── */}
      <div style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        border: "1px solid var(--color-border-faint)",
      }}>
        <div style={{
          fontSize: "10px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "10px",
        }}>
          Regímenes más comunes (referencia rápida)
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "8px",
        }}>
          <RegimenHelpCard
            code="IMD"
            description="Importación definitiva — la mercancía permanece en el país sin retornar."
          />
          <RegimenHelpCard
            code="EXD"
            description="Exportación definitiva — la mercancía sale del país sin retornar."
          />
          <RegimenHelpCard
            code="ITR / ETR"
            description="Temporales para retornar al estado de origen sin transformación."
          />
          <RegimenHelpCard
            code="ITE / ETE"
            description="Temporales para elaboración, transformación o reparación (programas IMMEX)."
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      padding: "32px 24px",
      borderRadius: "var(--radius-md)",
      border: "1px dashed var(--color-border)",
      background: "var(--color-bg-base)",
      textAlign: "center",
    }}>
      <div style={{
        width: "44px",
        height: "44px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)",
        margin: "0 auto 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
          <path d="M14 3v4a1 1 0 001 1h4" />
          <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      </div>
      <div style={{
        fontSize: "13px",
        color: "var(--color-text-second)",
        marginBottom: "12px",
      }}>
        Sin régimen aduanero registrado
      </div>
      <button
        type="button"
        onClick={onAdd}
        style={{
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 600,
          borderRadius: "var(--radius-md)",
          background: "var(--color-brand-blue)",
          color: "#FFFFFF",
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Agregar primer régimen
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Row de un régimen aduanero
// ─────────────────────────────────────────────────────────────
function RegimenRow({
  index,
  linea,
  regimenes,
  loading,
  description,
  onUpdate,
  onRemove,
}: {
  index: number;
  linea: RegimenAduaneroLine;
  regimenes: { code: string; label: string }[];
  loading: boolean;
  description?: string;
  onUpdate: (value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-subtle)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: "10px",
        alignItems: "start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-md)",
          background: "var(--color-brand-orange-light)",
          border: "1px solid var(--color-brand-orange)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          color: "var(--color-brand-orange)",
          fontVariantNumeric: "tabular-nums",
          marginTop: "22px",
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ minWidth: 0 }}>
          <FieldS label="Régimen aduanero" required>
            <select
              value={linea.regimen_aduanero}
              onChange={e => onUpdate(e.target.value)}
              disabled={loading}
              style={INPUT}
            >
              <option value="">{loading ? "Cargando..." : "Selecciona régimen..."}</option>
              {regimenes.map(r => (
                <option key={r.code} value={r.code}>
                  {r.code} — {r.label}
                </option>
              ))}
            </select>
          </FieldS>
          {description && (
            <div style={{
              fontSize: "11px",
              color: "var(--color-text-muted)",
              marginTop: "6px",
              lineHeight: 1.5,
              padding: "6px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border-faint)",
            }}>
              {description}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Eliminar régimen"
          style={{
            padding: "8px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-danger-border)",
            background: "var(--color-danger-bg)",
            color: "var(--color-danger-text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "22px",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card de ayuda — régimen común
// ─────────────────────────────────────────────────────────────
function RegimenHelpCard({
  code,
  description,
}: {
  code: string;
  description: string;
}) {
  return (
    <div style={{
      padding: "10px 12px",
      borderRadius: "var(--radius-md)",
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{
        fontSize: "12px",
        fontWeight: 700,
        color: "var(--color-brand-orange)",
        fontFamily: "monospace",
        marginBottom: "4px",
        letterSpacing: "0.04em",
      }}>
        {code}
      </div>
      <div style={{
        fontSize: "11px",
        color: "var(--color-text-second)",
        lineHeight: 1.5,
      }}>
        {description}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI compartidos
// ─────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

function FieldS({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "11px",
        color: "var(--color-text-muted)",
        marginBottom: "5px",
        fontWeight: 500,
      }}>
        {label}
        {required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{
          fontSize: "10px",
          color: "var(--color-text-muted)",
          marginTop: "4px",
          lineHeight: 1.4,
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function DashedAdd({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "var(--radius-md)",
        border: "1px dashed var(--color-border)",
        background: "transparent",
        color: "var(--color-text-muted)",
        fontSize: "12px",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        transition: "var(--transition-fast)",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = "var(--color-brand-orange)";
        e.currentTarget.style.borderColor = "var(--color-brand-orange)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = "var(--color-text-muted)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      {label}
    </button>
  );
}
