"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCompany();
  }, []);

  async function checkCompany() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.replace("/login");
      return;
    }

    // RLS filtra automáticamente
    const { data, error } = await supabase
      .from("company_users")
      .select("company_id")
      .limit(1);

    if (error) {
      console.error(error);
      router.replace("/create-company");
      return;
    }

    if (!data || data.length === 0) {
      router.replace("/create-company");
    } else {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 32 }}>Cargando...</div>;

  const now = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={container}>
      {/* Header */}
      <div>
        <h1 style={title}>Centro de control</h1>
        <p style={subtitle}>Resumen operativo — {now}</p>
      </div>

      {/* GRID PRINCIPAL */}
      <div style={grid}>
        <Card title="Estado general">
          <Stat label="Actividad hoy" value="Alta" />
          <Stat label="Alertas críticas" value="0" />
          <Stat label="Pendientes urgentes" value="3" />
        </Card>

        <Card title="Comercial">
          <Stat label="Prospects nuevos" value="12" />
          <Stat label="Cotizaciones abiertas" value="8" />
          <Stat label="Pedidos activos" value="5" />
        </Card>

        <Card title="Operación">
          <Stat label="Servicios hoy" value="9" />
          <Stat label="En curso" value="4" />
          <Stat label="Incidencias" value="0" />
        </Card>

        <Card title="Finanzas">
          <Stat label="Ingresos del mes" value="$1,240,000" />
          <Stat label="Por cobrar" value="$320,000" />
          <Stat label="Pagos pendientes" value="6" />
        </Card>

        <Card title="Agenda">
          <Stat label="Eventos hoy" value="7" />
          <Stat label="Próximo evento" value="10:30" />
          <Stat label="Reuniones" value="3" />
        </Card>

        <Card title="Sistema">
          <Stat label="Usuarios activos" value="18" />
          <Stat label="Módulos habilitados" value="6" />
          <Stat label="Estado IA" value="Operativa" />
        </Card>
      </div>
    </div>
  );
}

/* ================= COMPONENTES ================= */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={card}>
      <h2 style={cardTitle}>{title}</h2>
      <div style={cardContent}>{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={statRow}>
      <span style={statLabel}>{label}</span>
      <span style={statValue}>{value}</span>
    </div>
  );
}

/* ================= ESTILOS ================= */

const UI = {
  bgCard: "#0b0f14",
  border: "#1f2937",
  textSoft: "#9ca3af",
};

const container: React.CSSProperties = {
  padding: 32,
  display: "grid",
  gap: 24,
  maxWidth: 1200,
};

const title: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 750,
  letterSpacing: "-0.03em",
  margin: 0,
};

const subtitle: React.CSSProperties = {
  marginTop: 8,
  color: UI.textSoft,
  fontSize: 15,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 20,
};

const card: React.CSSProperties = {
  background: UI.bgCard,
  borderRadius: 16,
  border: `1px solid ${UI.border}`,
  padding: 20,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 650,
  marginBottom: 16,
};

const cardContent: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const statRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const statLabel: React.CSSProperties = {
  color: UI.textSoft,
  fontSize: 14,
};

const statValue: React.CSSProperties = {
  fontWeight: 650,
  fontSize: 15,
};
