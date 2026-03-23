"use client";

type Props = {
  selected: any;
};

export default function ProspectCopilot({ selected }: Props) {
  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontWeight: 800 }}>COPILOT PROSPECTING</div>

      {!selected ? (
        <div style={{ color: "#94a3b8" }}>
          Selecciona un prospecto para ver recomendaciones.
        </div>
      ) : (
        <>
          <div
            style={{
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Recomendación</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {selected.estimated_value
                ? "Avanzar a propuesta comercial"
                : "Calificar prospecto y levantar necesidad"}
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
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Siguiente paso</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {selected.email || selected.phone
                ? "Programar seguimiento"
                : "Conseguir datos de contacto"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
