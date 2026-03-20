"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type {
  CrmAccount,
  CrmDocument,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  TimelineItem,
  CrmContact,
  AccountRevenue,
} from "../types/crm.types/crm.types";

 export const panelCard: React.CSSProperties = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: "#0f172a",
  border: "1px solid #1f2937",
  display: "grid",
  gap: 8,
};

export const panelCardTitle: React.CSSProperties = {
  fontWeight: 800,
};

export const rowCard: React.CSSProperties = {
  marginTop: 10,
  padding: 10,
  borderRadius: 8,
  background: "#0b1220",
  border: "1px solid #1f2937",
};

export const inputStyle: React.CSSProperties = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#0b1220",
  color: "#fff",
};

export const primaryButton: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

export const miniButton: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#0b1220",
  color: "#fff",
  cursor: "pointer",
};

// =========================================================
// ===== 🔥 CRM UNICORNIO — CHIPS TÁCTICOS DE CUENTAS =====
// ===== (Panel izquierdo — radar comercial) =====
// =========================================================

export const chipHot: React.CSSProperties = {
  background: "#ef4444",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

export const chipCritical: React.CSSProperties = {
  background: "#dc2626",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

export const chipMoney: React.CSSProperties = {
  background: "#16a34a",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

export const chipQuote: React.CSSProperties = {
  background: "#f59e0b",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#111",
};

export const chipRisk: React.CSSProperties = {
  background: "#64748b",
  padding: "2px 6px",
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 800,
  color: "#fff",
};

export const tableHead: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  borderBottom: "1px solid #1f2937",
  color: "#cbd5e1",
};

export const tableCell: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #1f2937",
  color: "#e5e7eb",
};

// ===== INICIO COMPONENT COMMAND LIST =====
export function CommandList({
  title,
  color,
  accounts,
  onSelect,
}: {
  title: string;
  color: string;
  accounts: CrmAccount[];
  onSelect: (a: CrmAccount) => void;
}) {
  if (accounts.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontWeight: 700, color }}>
        {title} ({accounts.length})
      </div>

      {accounts.slice(0, 5).map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect(a)}
          style={{
            padding: 10,
            borderRadius: 8,
            background: "#0b1220",
            border: `1px solid ${color}`,
            cursor: "pointer",
          }}
        >
          {a.name}
        </div>
      ))}
    </div>
  );
}
// ===== FIN COMPONENT COMMAND LIST =====

// ===== INICIO COMPONENT DOCUMENT ROW =====
export function DocumentRow({ doc }: { doc: CrmDocument }) {
   const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const { data } = supabase.storage
      .from("crm-documents")
      .getPublicUrl(doc.file_path);

    setUrl(data.publicUrl);
  }, [doc.file_path]);

  return (
    <div
      style={{
        padding: 10,
        borderBottom: "1px solid #1f2937",
      }}
    >
      <strong>{doc.name}</strong>

      {url && (
        <div>
          <a href={url} target="_blank" rel="noreferrer">
            Ver documento
          </a>
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT DOCUMENT ROW =====

// ===== INICIO COMPONENT ACTIVITY ROW =====
export function ActivityRow({ activity }: { activity: CrmActivity }) {
  return (
    <div
      style={{
        padding: 10,
        borderBottom: "1px solid #1f2937",
      }}
    >
      <strong>{activity.title}</strong>

      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        Tipo: {activity.type}
      </div>

      {activity.scheduled_at && (
        <div style={{ fontSize: 12 }}>
          Fecha: {new Date(activity.scheduled_at).toLocaleString("es-MX")}
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT ACTIVITY ROW =====

// ===== INICIO COMPONENT TIMELINE ROW =====
export function TimelineRow({ item }: { item: TimelineItem }) {
  const colorMap: Record<string, string> = {
    activity: "#38bdf8",
    document: "#a78bfa",
    opportunity: "#34d399",
    quote: "#fbbf24",
    order: "#f87171",
  };

  const color = colorMap[item.type] || "#94a3b8";

  return (
    <div
      style={{
        padding: 12,
        borderBottom: "1px solid #1f2937",
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontWeight: 600, color }}>{item.title}</div>

      {item.description && (
        <div style={{ fontSize: 12 }}>{item.description}</div>
      )}

      <div style={{ fontSize: 11, color: "#94a3b8" }}>
        {new Date(item.date).toLocaleString("es-MX")}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT TIMELINE ROW =====

// ===== INICIO COMPONENT REVENUE CARD =====
export function RevenueCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: "#020617",
        border: `1px solid ${color}`,
        display: "grid",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        {label}
      </div>

      <div
        style={{
          fontWeight: 800,
          fontSize: 18,
          color,
        }}
      >
        ${value.toLocaleString("es-MX")}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT REVENUE CARD =====

// ===== INICIO COMPONENT COMMERCIAL HEALTH =====
export function CommercialHealthPanel({
  opportunities,
  quotes,
  orders,
  activities,
  timeline,
  contacts,
}: {
  opportunities: CrmOpportunity[];
  quotes: CrmQuote[];
  orders: CrmOrder[];
  activities: CrmActivity[];
  timeline: TimelineItem[];
  contacts: CrmContact[];
}) {
  let score = 0;

  if (contacts.length > 0) score += 10;
  if (activities.length > 0) score += 10;
  if (timeline.length > 3) score += 10;

  if (opportunities.length > 0) score += 20;
  if (quotes.length > 0) score += 25;
  if (orders.length > 0) score += 25;

  // Momentum
  let momentum = "ESTABLE";

  if (orders.length > 0) momentum = "EN CRECIMIENTO";
  else if (quotes.length > 0) momentum = "CERCANA AL CIERRE";
  else if (opportunities.length > 0) momentum = "EN PROSPECCIÓN";
  else if (activities.length === 0) momentum = "ABANDONADA";

  // Nivel salud
  let level = "BAJA";
  let color = "#ef4444";

  if (score >= 70) {
    level = "ALTA";
    color = "#22c55e";
  } else if (score >= 40) {
    level = "MEDIA";
    color = "#f59e0b";
  }

  // Recomendación
  let recommendation = "Reactivar relación comercial.";

  if (orders.length > 0)
    recommendation = "Mantener cliente activo y detectar upsell.";
  else if (quotes.length > 0)
    recommendation = "Dar seguimiento a cotización.";
  else if (opportunities.length > 0)
    recommendation = "Convertir oportunidad en propuesta.";
  else if (contacts.length === 0)
    recommendation = "Identificar contacto clave.";
  else if (activities.length === 0)
    recommendation = "Programar interacción.";

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        background: "#020617",
        border: `1px solid ${color}`,
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontWeight: 800, color }}>
        SALUD COMERCIAL
      </div>

      <div>
        Nivel: <strong>{level}</strong>
      </div>

      <div>
        Momentum: <strong>{momentum}</strong>
      </div>

      <div style={{ color: "#cbd5e1" }}>
        {recommendation}
      </div>
    </div>
  );
}
// ===== FIN COMPONENT COMMERCIAL HEALTH =====

// ===== INICIO COMPONENT RISK OPPORTUNITY =====
export function RiskOpportunityPanel({
  opportunities,
  quotes,
  orders,
  activities,
  timeline,
  contacts,
  revenue,
}: {
  opportunities: CrmOpportunity[];
  quotes: CrmQuote[];
  orders: CrmOrder[];
  activities: CrmActivity[];
  timeline: TimelineItem[];
  contacts: CrmContact[];
  revenue?: AccountRevenue;
}) {
  const hasSales = orders.length > 0;
  const hasPipeline = opportunities.length > 0 || quotes.length > 0;
  const inactive = activities.length === 0;
  const noContacts = contacts.length === 0;
  const lowHistory = timeline.length < 2;

  const highValue =
    revenue?.tier === "STRATEGIC" || revenue?.tier === "HIGH";

  let risk: string | null = null;
  let opportunity: string | null = null;
  let sleeper: string | null = null;

  // 🔴 Riesgo de churn
  if (!hasSales && inactive && noContacts) {
    risk = "Cuenta en alto riesgo de pérdida";
  } else if (inactive && lowHistory) {
    risk = "Cuenta sin actividad reciente";
  }

  // 🟢 Oportunidad
  if (hasSales && hasPipeline) {
    opportunity = "Potencial de expansión o upsell";
  } else if (!hasSales && hasPipeline) {
    opportunity = "Cercana a conversión";
  }

  // 🟡 Dormida valiosa
  if (highValue && !hasPipeline && inactive) {
    sleeper = "Cuenta valiosa sin seguimiento";
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        background: "#020617",
        border: "1px solid #1f2937",
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ fontWeight: 800, color: "#a78bfa" }}>
        RADAR ESTRATÉGICO IA
      </div>

      {risk && (
        <div style={{ color: "#ef4444" }}>
          🔴 {risk}
        </div>
      )}

      {opportunity && (
        <div style={{ color: "#22c55e" }}>
          🟢 {opportunity}
        </div>
      )}

      {sleeper && (
        <div style={{ color: "#f59e0b" }}>
          🟡 {sleeper}
        </div>
      )}

      {!risk && !opportunity && !sleeper && (
        <div style={{ color: "#94a3b8" }}>
          Sin alertas estratégicas.
        </div>
      )}
    </div>
  );
}
// ===== FIN COMPONENT RISK OPPORTUNITY =====
