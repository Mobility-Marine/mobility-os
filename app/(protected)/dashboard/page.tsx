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

    const { data, error } = await supabase
      .from("company_users")
      .select("company_id")
      .limit(1);

    if (error || !data || data.length === 0) {
      router.replace("/create-company");
      return;
    }

    setLoading(false);
  }

  if (loading)
    return <div style={{ padding: 32 }}>Inicializando Command Center…</div>;

  const now = new Date().toLocaleString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div style={container}>
      {/* GLOBAL STATUS BAR */}
      <div style={statusBar}>
        <div style={statusTitle}>Mobility OS — Command Center</div>

        <div style={statusItems}>
          <Status label="Estado" value="Operativo" color="#22c55e" />
          <Status label="Alertas" value="0" color="#eab308" />
          <Status label="Servicios activos" value="9" />
          <Status label="IA" value="Online" color="#38bdf8" />
          <Status label="Hora" value={now} />
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={mainGrid}>
        {/* PANEL PRINCIPAL */}
        <div style={mainPanel}>
          <PanelTitle>Situación operativa</PanelTitle>

          <BigMetric value="Alta" label="Actividad global" />

          <div style={metricsRow}>
            <MiniMetric label="Pendientes críticos" value="3" />
            <MiniMetric label="Incidencias" value="0" />
            <MiniMetric label="Servicios hoy" value="9" />
          </div>
        </div>

        {/* STREAM EN TIEMPO REAL */}
        <div style={activityPanel}>
          <PanelTitle>Actividad en tiempo real</PanelTitle>

          <Activity text="Servicio MX-921 iniciado" time="09:12" />
          <Activity text="Cotización enviada a ACME" time="09:07" />
          <Activity text="Factura F-201 generada" time="09:02" />
          <Activity text="Usuario Juan inició sesión" time="08:58" />
        </div>
      </div>

      {/* PANEL ESTRATÉGICO */}
      <div style={secondaryGrid}>
        <Card title="Comercial">
          <Stat label="Prospects nuevos" value="12" />
          <Stat label="Cotizaciones abiertas" value="8" />
          <Stat label="Pedidos activos" value="5" />
        </Card>

        <Card title="Logística">
          <Stat label="Servicios en curso" value="4" />
          <Stat label="Programados" value="5" />
          <Stat label="Retrasos" value="0" />
        </Card>

        <Card title="Finanzas">
          <Stat label="Ingresos del mes" value="$1.24M" />
          <Stat label="Por cobrar" value="$320K" />
          <Stat label="Pagos pendientes" value="6" />
        </Card>

        <Card title="Agenda">
          <Stat label="Eventos hoy" value="7" />
          <Stat label="Reuniones" value="3" />
          <Stat label="Próximo evento" value="10:30" />
        </Card>
      </div>
    </div>
  );
}

/* ===== COMPONENTES ===== */

function Status({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div style={statusItem}>
      <div style={statusLabel}>{label}</div>
      <div style={{ ...statusValue, color }}>{value}</div>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <div style={panelTitle}>{children}</div>;
}

function BigMetric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <div style={bigValue}>{value}</div>
      <div style={bigLabel}>{label}</div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={miniMetric}>
      <div style={miniValue}>{value}</div>
      <div style={miniLabel}>{label}</div>
    </div>
  );
}

function Activity({
  text,
  time,
}: {
  text: string;
  time: string;
}) {
  return (
    <div style={activityRow}>
      <span style={activityText}>{text}</span>
      <span style={activityTime}>{time}</span>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={card}>
      <div style={cardTitle}>{title}</div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
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

/* ===== ESTILOS TESLA OPS ===== */

const container = {
  padding: 28,
  display: "grid",
  gap: 22,
};

const statusBar = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 14,
  padding: "14px 18px",
};

const statusTitle = {
  fontWeight: 700,
  marginBottom: 10,
  fontSize: 15,
};

const statusItems = {
  display: "flex",
  gap: 24,
  flexWrap: "wrap",
};

const statusItem = {
  display: "flex",
  flexDirection: "column" as const,
};

const statusLabel = {
  fontSize: 11,
  color: "#9ca3af",
};

const statusValue = {
  fontWeight: 600,
  fontSize: 14,
  color: "#e5e7eb",
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr",
  gap: 20,
};

const mainPanel = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 18,
  padding: 22,
};

const activityPanel = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 18,
  padding: 22,
};

const panelTitle = {
  fontWeight: 700,
  marginBottom: 16,
  fontSize: 16,
};

const bigValue = {
  fontSize: 48,
  fontWeight: 800,
  lineHeight: 1,
};

const bigLabel = {
  color: "#9ca3af",
  marginTop: 4,
};

const metricsRow = {
  display: "flex",
  gap: 20,
  marginTop: 20,
};

const miniMetric = {
  display: "flex",
  flexDirection: "column" as const,
};

const miniValue = {
  fontWeight: 700,
  fontSize: 20,
};

const miniLabel = {
  color: "#9ca3af",
  fontSize: 12,
};

const activityRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #1f2937",
};

const activityText = {
  fontSize: 14,
};

const activityTime = {
  color: "#9ca3af",
  fontSize: 12,
};

const secondaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
};

const card = {
  background: "#0b0f14",
  border: "1px solid #1f2937",
  borderRadius: 16,
  padding: 18,
};

const cardTitle = {
  fontWeight: 700,
  marginBottom: 12,
};

const statRow = {
  display: "flex",
  justifyContent: "space-between",
};

const statLabel = {
  color: "#9ca3af",
};

const statValue = {
  fontWeight: 600,
};
