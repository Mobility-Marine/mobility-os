"use client";

// ============================================================
// 📡 PROSPECTS SIDEBAR — ELITE RADAR PANEL
// Unicorn Revenue OS Grade
// Inteligencia + navegación + creación
// ============================================================

import type { Prospect } from "../types/prospects.types";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  prospects: Prospect[];

  selected: Prospect | null;
  setSelected: (prospect: Prospect) => void;

  // ⭐ ELITE — abre drawer/modal externo
  onOpenCreate: () => void;
};

export default function ProspectsSidebar({
  search,
  setSearch,
  prospects,
  selected,
  setSelected,
  onOpenCreate,
}: Props) {
  // ==========================================================
  // CREACIÓN — ELITE
  // ==========================================================

  function handleCreate() {
    onOpenCreate();
  }

  // ==========================================================
  // FILTRADO LOCAL
  // ==========================================================

  const filtered = prospects.filter((p) => {
    const q = search.toLowerCase();

    return (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.company_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  // ==========================================================
  // MÉTRICAS RADAR
  // ==========================================================

  const active = filtered.filter(
    (p) => !["converted", "lost"].includes(p.stage || p.status || "")
  );

  const hot = filtered.filter(
    (p) => (p.estimated_value || 0) >= 50000
  );

  const noContact = filtered.filter(
    (p) => !p.email && !p.phone
  );

  const qualified = filtered.filter(
    (p) => p.stage === "qualified" || p.status === "qualified"
  );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={headerRow}>
        <div style={title}>PROSPECT RADAR</div>

       <button style={addButton} onClick={handleCreate}>
  <span style={{ fontSize: 16 }}>＋</span>
  Nuevo
</button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar prospecto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      {/* KPIs RADAR */}
      <div style={kpiBox}>
        <MiniKpi label="Activos" value={active.length} />
        <MiniKpi label="Alto valor" value={hot.length} />
        <MiniKpi label="Sin contacto" value={noContact.length} />
        <MiniKpi label="Calificados" value={qualified.length} />
      </div>

      {/* LISTA */}
      <div style={listWrap}>
        {filtered.length === 0 ? (
          <div style={emptyState}>No hay prospectos</div>
        ) : (
          <div style={listGrid}>
            {filtered.map((p) => {
              const isSelected = selected?.id === p.id;
              const hasValue = (p.estimated_value || 0) > 0;
              const hasContact = !!(p.email || p.phone);
              const stage = (p.stage || p.status || "new").toLowerCase();

              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    ...card,
                    ...(isSelected ? selectedCard : {}),
                  }}
                >
                  {/* FILA SUPERIOR */}
                  <div style={cardTopRow}>
                    <div style={name}>
                      {p.company_name || p.name || "Sin nombre"}
                    </div>

                    <span
                      style={{
                        ...stageBadge,
                        ...getStageBadgeStyle(stage),
                      }}
                    >
                      {stage.toUpperCase()}
                    </span>
                  </div>

                  {/* META */}
                  <div style={metaRow}>
                    {p.email || "Sin email"} · {p.phone || "Sin teléfono"}
                  </div>

                  {/* BADGES */}
                  <div style={badges}>
                    {hasValue && (
                      <span style={valueBadge}>
                        $
                        {Number(p.estimated_value).toLocaleString("es-MX")}
                      </span>
                    )}

                    {!hasContact && (
                      <span style={riskBadge}>
                        ⚠ Sin contacto
                      </span>
                    )}

                    {(stage === "proposal" ||
                      stage === "negotiation") && (
                      <span style={readyBadge}>
                        🚀 Revenue ready
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUBCOMPONENTES
// ============================================================

function MiniKpi({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={kpiCard}>
      <div style={kpiLabel}>{label}</div>
      <div style={kpiValue}>{value}</div>
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

function getStageBadgeStyle(stage: string): React.CSSProperties {
  switch (stage) {
    case "new":
      return {
        background: "#172554",
        color: "#bfdbfe",
        border: "1px solid #1d4ed8",
      };
    case "contacted":
      return {
        background: "#1e293b",
        color: "#cbd5e1",
        border: "1px solid #475569",
      };
    case "qualified":
      return {
        background: "#052e16",
        color: "#86efac",
        border: "1px solid #166534",
      };
    case "proposal":
      return {
        background: "#3b0764",
        color: "#e9d5ff",
        border: "1px solid #9333ea",
      };
    case "negotiation":
      return {
        background: "#422006",
        color: "#fdba74",
        border: "1px solid #ea580c",
      };
    case "converted":
      return {
        background: "#064e3b",
        color: "#a7f3d0",
        border: "1px solid #10b981",
      };
    case "lost":
      return {
        background: "#3f1d1d",
        color: "#fca5a5",
        border: "1px solid #7f1d1d",
      };
    default:
      return {
        background: "#1e293b",
        color: "#cbd5e1",
        border: "1px solid #334155",
      };
  }
}

// ============================================================
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 16,
  padding: 14,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  minHeight: 560,
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const title: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: 0.3,
};

const addButton: React.CSSProperties = {
  background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
  border: "1px solid rgba(59,130,246,0.45)",
  color: "#fff",

  padding: "6px 12px",
  borderRadius: 999,        // 🔥 pill SaaS

  fontWeight: 800,
  fontSize: 12,
  letterSpacing: 0.4,

  cursor: "pointer",

  boxShadow: "0 6px 18px rgba(37,99,235,0.35)",
  transition: "all .15s ease",

  display: "flex",
  alignItems: "center",
  gap: 6,
};

const searchInput: React.CSSProperties = {
  padding: 10,
  borderRadius: 10,
  border: "1px solid #1f2937",
  background: "#0b1220",
  color: "#fff",
  marginBottom: 12,
  outline: "none",
};

const kpiBox: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 8,
  marginBottom: 12,
};

const kpiCard: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 10,
  padding: 8,
  textAlign: "center",
};

const kpiLabel: React.CSSProperties = {
  fontSize: 11,
  color: "#94a3b8",
};

const kpiValue: React.CSSProperties = {
  fontWeight: 900,
  marginTop: 2,
};

const listWrap: React.CSSProperties = {
  overflowY: "auto",
  flex: 1,
};

const emptyState: React.CSSProperties = {
  color: "#94a3b8",
  textAlign: "center",
  marginTop: 56,
};

const listGrid: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  background: "#0b1220",
  border: "1px solid #1f2937",
  cursor: "pointer",
  display: "grid",
  gap: 10,
};

const selectedCard: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #3b82f6",
  boxShadow: "0 0 0 1px rgba(59,130,246,0.20) inset",
};

const cardTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 8,
};

const name: React.CSSProperties = {
  fontWeight: 800,
  lineHeight: 1.25,
};

const metaRow: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const badges: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const stageBadge: React.CSSProperties = {
  fontSize: 10,
  padding: "4px 8px",
  borderRadius: 999,
  fontWeight: 800,
};

const valueBadge: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#052e16",
  color: "#86efac",
  border: "1px solid #166534",
  fontWeight: 700,
};

const riskBadge: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#3f1d1d",
  color: "#fca5a5",
  border: "1px solid #7f1d1d",
  fontWeight: 700,
};

const readyBadge: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#1d4ed8",
  color: "#dbeafe",
  border: "1px solid #2563eb",
  fontWeight: 700,
};
