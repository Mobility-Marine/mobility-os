"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { CFDI_TYPE_GROUPS } from "../types/facturacion.types";
import type { CFDITypeOption } from "../types/facturacion.types";

type Props = { onSelect: (opt: CFDITypeOption) => void };

export default function CFDISelector({ onSelect }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", marginBottom: "4px" }}>
          {es ? "¿Qué tipo de CFDI deseas emitir?" : "What type of CFDI do you want to issue?"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
          {es
            ? "Selecciona el comprobante fiscal que necesitas generar. Cada tipo tiene requisitos específicos del SAT."
            : "Select the fiscal receipt you need to generate. Each type has specific SAT requirements."}
        </div>
      </div>

      {CFDI_TYPE_GROUPS.map((group) => (
        <div key={group.group}>
          {/* Separador de grupo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>
              {es ? group.groupEs : group.groupEn}
            </div>
            <div style={{ flex: 1, height: "1px", background: "var(--color-border-faint)" }} />
          </div>

          {/* Cards del grupo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" }}>
            {group.items.map((opt) => (
              <button
                key={opt.id}
                disabled={opt.disabled}
                onClick={() => !opt.disabled && onSelect(opt)}
                style={{
                  padding: "16px 18px",
                  borderRadius: "var(--radius-lg)",
                  border: `1px solid ${opt.disabled ? "var(--color-border-faint)" : "var(--color-border)"}`,
                  background: opt.disabled ? "var(--color-bg-subtle)" : "var(--color-bg-base)",
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                  textAlign: "left",
                  opacity: opt.disabled ? 0.55 : 1,
                  transition: "all 0.15s",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!opt.disabled) { e.currentTarget.style.borderColor = "var(--color-brand-blue)"; e.currentTarget.style.background = "var(--color-info-bg)"; }}}
                onMouseLeave={(e) => { if (!opt.disabled) { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.background = "var(--color-bg-base)"; }}}
              >
                {/* Badge */}
                {opt.badge && (
                  <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", color: "var(--color-warning-text)", border: "1px solid var(--color-warning-border)" }}>
                    {opt.badge}
                  </span>
                )}

                {/* Icono */}
                <div style={{ width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: opt.disabled ? "var(--color-bg-subtle)" : "var(--color-info-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={opt.disabled ? "var(--color-text-muted)" : "var(--color-brand-blue)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {opt.icon.split(" M").map((d, i) => <path key={i} d={(i === 0 ? "" : "M") + d} />)}
                  </svg>
                </div>

                {/* Texto */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: opt.disabled ? "var(--color-text-muted)" : "var(--color-text-primary)", marginBottom: "3px" }}>
                    {es ? opt.labelEs : opt.labelEn}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                    {opt.disabled && opt.disabledMsg ? opt.disabledMsg : (es ? opt.descEs : opt.descEn)}
                  </div>
                </div>

                {/* Tipo badge */}
                {!opt.disabled && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                      Tipo {opt.type}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
