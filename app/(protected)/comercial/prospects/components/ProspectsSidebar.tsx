"use client";

// ============================================================
// 📂 PROSPECTS SIDEBAR — Enterprise Radar Panel (FINAL)
// Vista estratégica + creación + control de selección
// Revenue OS Ready
// ============================================================

import type { Prospect } from "../types/prospects.types";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  prospects: Prospect[];

  selected: Prospect | null;
  setSelected: (prospect: Prospect) => void;

  // ⭐ NUEVO — CREACIÓN
  createProspect: (payload: {
    name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) => Promise<Prospect>;
};

export default function ProspectsSidebar({
  search,
  setSearch,
  prospects,
  selected,
  setSelected,
  createProspect,
}: Props) {

  // ==========================================================
  // CREACIÓN RÁPIDA
  // ==========================================================

  async function handleCreate() {
    const name = prompt("Nombre o empresa del prospecto");

    if (!name) return;

    try {
      const newProspect = await createProspect({
        company_name: name,
      });

      if (newProspect) {
        setSelected(newProspect);
      }
    } catch (err) {
      alert("No se pudo crear el prospecto");
    }
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
  // MÉTRICAS RÁPIDAS
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

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={headerRow}>
        <div style={title}>PROSPECTS</div>

        <button style={addButton} onClick={handleCreate}>
          + Nuevo
        </button>
      </div>

      {/* BUSCADOR */}
      <input
        placeholder="Buscar prospecto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchInput}
      />

      {/* KPIs RÁPIDOS */}
      <div style={kpiBox}>
        <MiniKpi label="Activos" value={active.length} />
        <MiniKpi label="Alto valor" value={hot.length} />
        <MiniKpi label="Sin contacto" value={noContact.length} />
      </div>

      {/* LISTA */}
      <div style={listWrap}>
        {filtered.length === 0 ? (
          <div style={emptyState}>
            No hay prospectos
          </div>
        ) : (
          <div style={listGrid}>
            {filtered.map((p) => {
              const isSelected = selected?.id === p.id;
              const hasValue = (p.estimated_value || 0) > 0;
              const hasContact = !!(p.email || p.phone);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    ...card,
                    ...(isSelected ? selectedCard : {}),
                  }}
                >
                  {/* NOMBRE */}
                  <div style={name}>
                    {p.company_name || p.name || "Sin nombre"}
                  </div>

                  {/* EMAIL */}
                  {p.email && (
                    <div style={email}>{p.email}</div>
                  )}

                  {/* BADGES */}
                  <div style={badges}>
                    <span style={badgeStage}>
                      {p.stage || p.status || "new"}
                    </span>

                    {hasValue && (
                      <span style={badgeValue}>
                        $
                        {Number(p.estimated_value).toLocaleString()}
                      </span>
                    )}

                    {!hasContact && (
                      <span style={badgeRisk}>
                        ⚠ sin contacto
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

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div style={kpiCard}>
      <div style={kpiLabel}>{label}</div>
      <div style={kpiValue}>{value}</div>
    </div>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const container: React.CSSProperties = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};

const title: React.CSSProperties = {
  fontWeight: 800,
};

const addButton: React.CSSProperties = {
  background: "#3b82f6",
  border: "none",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 700,
};

const searchInput: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: "1px solid #1f2937",
  background: "#0b1220",
  color: "#fff",
  marginBottom: 10,
};

const kpiBox: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 6,
  marginBottom: 10,
};

const kpiCard: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid #1f2937",
  borderRadius: 8,
  padding: 6,
  textAlign: "center",
};

const kpiLabel: React.CSSProperties = {
  fontSize: 10,
  color: "#94a3b8",
};

const kpiValue: React.CSSProperties = {
  fontWeight: 800,
};

const listWrap: React.CSSProperties = {
  overflowY: "auto",
  flex: 1,
};

const emptyState: React.CSSProperties = {
  color: "#94a3b8",
  textAlign: "center",
  marginTop: 40,
};

const listGrid: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: "#0b1220",
  border: "1px solid #1f2937",
  cursor: "pointer",
  display: "grid",
  gap: 8,
};

const selectedCard: React.CSSProperties = {
  background: "#111827",
  border: "1px solid #3b82f6",
};

const name: React.CSSProperties = {
  fontWeight: 800,
};

const email: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
};

const badges: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const badgeStage: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#1e293b",
  color: "#cbd5e1",
  border: "1px solid #334155",
};

const badgeValue: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#052e16",
  color: "#86efac",
  border: "1px solid #166534",
};

const badgeRisk: React.CSSProperties = {
  fontSize: 11,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#3f1d1d",
  color: "#fca5a5",
  border: "1px solid #7f1d1d",
};
