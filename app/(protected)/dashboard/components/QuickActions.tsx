"use client";

import { useRouter } from "next/navigation";

const actions = [
  { label: "Nuevo prospecto",      hint: "Iniciar proceso comercial",      path: "/comercial/prospects" },
  { label: "Agendar evento",       hint: "Coordinar equipo o cliente",     path: "/agenda" },
  { label: "Nueva cotización",     hint: "Abrir flujo comercial",          path: "/comercial/cotizaciones" },
  { label: "Programar embarque",   hint: "Asignar operación logística",    path: "/logistica/embarques" },
  { label: "Ver CRM",              hint: "Gestión de cuentas",             path: "/comercial/crm" },
  { label: "Resumen ejecutivo IA", hint: "Análisis operativo instantáneo", path: "/dashboard" },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div style={{
      background: "var(--color-bg-base)",
      border: "1px solid var(--color-border-faint)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      boxShadow: "var(--shadow-sm)",
      display: "grid",
      gap: "14px",
      alignContent: "start",
    }}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        Acciones rápidas
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => router.push(action.path)}
            style={{
              textAlign: "left",
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-faint)",
              background: "var(--color-bg-subtle)",
              cursor: "pointer",
              display: "grid",
              gap: "2px",
              transition: "var(--transition-fast)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-hover)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-brand-blue)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg-subtle)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--color-border-faint)";
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
              {action.label}
            </span>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {action.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
