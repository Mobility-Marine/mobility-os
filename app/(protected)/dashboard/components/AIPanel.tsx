"use client";

import { useRouter } from "next/navigation";

interface AIPanelProps {
  companyState?: any;
}

const suggestions = [
  { label: "Ver pendientes críticos",       path: "/comercial/prospects" },
  { label: "Crear evento de seguimiento",   path: "/agenda" },
  { label: "Mostrar cuentas por cobrar",    path: "/finanzas/cxc" },
  { label: "Revisar servicios en tránsito", path: "/logistica/embarques" },
];

export default function AIPanel({ companyState }: AIPanelProps) {
  const router = useRouter();

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-xl)",
      padding: "22px",
      boxShadow: "var(--shadow-md)",
      display: "grid",
      gap: "16px",
      alignContent: "start",
    }}>
      <div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-brand-blue-light)",
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--color-brand-blue)",
          marginBottom: "8px",
        }}>
          IA Activa
        </div>
        <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Mobility AI
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.5 }}>
          Asistente operativo proactivo listo para consultar, detectar y ejecutar.
        </div>
      </div>

      <div style={{
        padding: "14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        background: "var(--color-bg-subtle)",
        fontSize: "13px",
        color: "var(--color-text-second)",
        fontWeight: 500,
        lineHeight: 1.5,
      }}>
        ¿Qué está en riesgo hoy y a quién debo asignarlo?
      </div>

      <div>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          Sugerencias
        </div>
        <div style={{ display: "grid", gap: "8px" }}>
          {suggestions.map((s) => (
            <button
              key={s.path}
              onClick={() => router.push(s.path)}
              style={{
                textAlign: "left",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-faint)",
                background: "var(--color-bg-subtle)",
                color: "var(--color-text-second)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-hover)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-brand-blue)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-brand-blue)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-subtle)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-faint)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-second)";
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        padding: "14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-info-border)",
        background: "var(--color-info-bg)",
        display: "grid",
        gap: "6px",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-info-text)" }}>
          Insight IA
        </div>
        <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--color-text-second)" }}>
          {companyState?.executive_summary ?? "Si no se generan nuevas cotizaciones hoy, la proyección semanal podría caer frente al ritmo esperado."}
        </div>
      </div>
    </div>
  );
}
