"use client";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  prospects: any[];
  selected: any;
  setSelected: (prospect: any) => void;
};

export default function ProspectsSidebar({
  search,
  setSearch,
  prospects,
  selected,
  setSelected,
}: Props) {
  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>PROSPECTS</div>

      <input
        placeholder="Buscar prospecto..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: 8,
          borderRadius: 8,
          border: "1px solid #1f2937",
          background: "#0b1220",
          color: "#fff",
          marginBottom: 10,
        }}
      />

      <div style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {prospects.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: 14,
                borderRadius: 12,
                background: selected?.id === p.id ? "#111827" : "#0b1220",
                border:
                  selected?.id === p.id
                    ? "1px solid #3b82f6"
                    : "1px solid #1f2937",
                cursor: "pointer",
                display: "grid",
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {p.company_name || p.name || "Sin nombre"}
              </div>

              {p.email && (
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.email}</div>
              )}

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "#1e293b",
                    color: "#cbd5e1",
                    border: "1px solid #334155",
                  }}
                >
                  {p.stage || p.status || "new"}
                </span>

                {p.estimated_value ? (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background: "#052e16",
                      color: "#86efac",
                      border: "1px solid #166534",
                    }}
                  >
                    ${Number(p.estimated_value).toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
