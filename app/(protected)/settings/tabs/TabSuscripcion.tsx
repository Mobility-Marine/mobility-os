"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";

const PLANS = [
  {
    id:    "basic",
    name:  "Básico",
    price: "$1,499 MXN/mes",
    users: "Hasta 5 usuarios",
    features: ["Todos los módulos", "Soporte por email", "1 empresa", "5 GB almacenamiento"],
    color: "var(--color-brand-blue)",
  },
  {
    id:    "professional",
    name:  "Profesional",
    price: "$3,499 MXN/mes",
    users: "Hasta 20 usuarios",
    features: ["Todo en Básico", "Soporte prioritario", "3 empresas", "25 GB almacenamiento", "API access", "Reportes avanzados"],
    color: "#a78bfa",
  },
  {
    id:    "enterprise",
    name:  "Enterprise",
    price: "Precio personalizado",
    users: "Usuarios ilimitados",
    features: ["Todo en Profesional", "SLA dedicado", "Empresas ilimitadas", "Almacenamiento ilimitado", "Integración PAC incluida", "Onboarding personalizado"],
    color: "#c9a227",
  },
];

export default function TabSuscripcion() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();

  const [plan,   setPlan]   = useState("basic");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (s) {
        setPlan(s.subscription_plan ?? "basic");
        setStatus(s.subscription_status ?? "active");
      }
    });
  }, [companyId]);

  const currentPlan = PLANS.find((p) => p.id === plan) ?? PLANS[0];

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabSuscripcion ?? "Suscripción"}
      </div>

      {/* PLAN ACTUAL */}
      <div style={{
        background: "var(--color-bg-base)", border: `2px solid ${currentPlan.color}40`,
        borderRadius: "var(--radius-lg)", padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            Plan actual
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: currentPlan.color, marginBottom: "4px" }}>
            {currentPlan.name}
          </div>
          <div style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>{currentPlan.users}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-primary)" }}>{currentPlan.price}</div>
          <span style={{
            fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "var(--radius-full)",
            background: status === "active" ? "var(--color-success-bg)" : "var(--color-danger-bg)",
            color: status === "active" ? "var(--color-success-text)" : "var(--color-danger-text)",
            border: status === "active" ? "1px solid var(--color-success-border)" : "1px solid var(--color-danger-border)",
            textTransform: "uppercase",
          }}>
            {status === "active" ? "Activa" : "Inactiva"}
          </span>
        </div>
      </div>

      {/* PLANES DISPONIBLES */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
          Planes disponibles
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
          {PLANS.map((p) => {
            const isCurrent = p.id === plan;
            return (
              <div key={p.id} style={{
                padding: "16px", borderRadius: "var(--radius-lg)",
                background: isCurrent ? `${p.color}10` : "var(--color-bg-subtle)",
                border: `2px solid ${isCurrent ? p.color : "var(--color-border-faint)"}`,
              }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: p.color, marginBottom: "4px" }}>{p.name}</div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "8px" }}>{p.price}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "10px" }}>{p.users}</div>
                <div style={{ display: "grid", gap: "4px" }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", gap: "6px", fontSize: "11px", color: "var(--color-text-second)" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="3" style={{ flexShrink: 0, marginTop: "1px" }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
                {!isCurrent && (
                  <button style={{
                    width: "100%", height: "32px", marginTop: "12px", borderRadius: "var(--radius-md)",
                    background: p.color, color: "#fff", border: "none",
                    fontSize: "11px", fontWeight: 700, cursor: "pointer",
                  }}>
                    {p.id === "enterprise" ? "Contactar ventas" : "Cambiar plan"}
                  </button>
                )}
                {isCurrent && (
                  <div style={{ marginTop: "12px", textAlign: "center", fontSize: "10px", fontWeight: 700, color: p.color, textTransform: "uppercase" }}>
                    Plan actual
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* INFO MODELO */}
      <div style={{ padding: "14px 18px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.7 }}>
        <strong>Mobility OS — Sistema integral por suscripción.</strong> Todos los planes incluyen acceso completo a todos los módulos.
        La diferencia está en el número de usuarios, almacenamiento y soporte. Sin costo por módulo individual.
      </div>
    </div>
  );
}
