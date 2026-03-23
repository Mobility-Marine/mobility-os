"use client";

type Props = {
  selected: any;
};

export default function ProspectWorkspace({ selected }: Props) {
  if (!selected) {
    return (
      <div
        style={{
          background: "#020617",
          border: "1px solid #1f2937",
          borderRadius: 12,
          padding: 20,
          color: "#94a3b8",
        }}
      >
        Selecciona un prospecto para ver su detalle.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 20,
        display: "grid",
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>
          {selected.company_name || selected.name || "Sin nombre"}
        </div>
        <div style={{ color: "#94a3b8", marginTop: 6 }}>
          {selected.email || "Sin email"} · {selected.phone || "Sin teléfono"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0,1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Etapa</div>
          <div style={{ fontWeight: 700 }}>{selected.stage || selected.status || "new"}</div>
        </div>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Origen</div>
          <div style={{ fontWeight: 700 }}>
            {selected.lead_source || selected.sourceNormalized || "manual"}
          </div>
        </div>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Valor estimado</div>
          <div style={{ fontWeight: 700 }}>
            {selected.estimated_value
              ? `$${Number(selected.estimated_value).toLocaleString()}`
              : "Sin estimación"}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: 10,
          padding: 14,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Notas</div>
        <div style={{ color: "#cbd5e1" }}>
          {selected.notes || "Sin notas registradas."}
        </div>
      </div>
    </div>
  );
}
