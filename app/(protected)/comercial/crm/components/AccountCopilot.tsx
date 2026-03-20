"use client";

// ===== COMPONENTE: PANEL DERECHO — COPILOT IA =====
// ===== RESPONSABILIDAD =====
// 1) Mostrar estado vacío cuando no hay cuenta seleccionada
// 2) Mostrar recomendaciones del AI Director
// 3) Mostrar alertas, oportunidades y riesgos

type Props = any;

export default function AccountCopilot(props: Props) {
  const { selected, director } = props;

  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 14,
        overflowY: "auto",
      }}
    >
      {/* ===== HEADER ===== */}
      <div style={{ fontWeight: 800, color: "#38bdf8" }}>
        COPILOT IA
      </div>

      {/* ===== ESTADO VACÍO ===== */}
      {!selected && (
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            color: "#94a3b8",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            CRM listo para operar 🚀
          </div>

          <div style={{ fontSize: 14 }}>
            No hay cuentas seleccionadas.<br />
            Crea o importa clientes desde el panel izquierdo.
          </div>

          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Tip: Puedes importar cientos de cuentas desde Excel.
          </div>
        </div>
      )}

      {/* ===== CONTENIDO CON CUENTA ===== */}
      {director && (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div>
            Urgencia: <strong>{director.urgency}</strong>
          </div>

          <div>
            Temperatura:{" "}
            <strong>{director.accountTemperature}</strong>
          </div>

          <div>{director.recommendedAction}</div>

          {/* Alertas */}
          {director.alerts?.length > 0 && (
            <div>
              <strong>Alertas</strong>
              {director.alerts.map((a: string, i: number) => (
                <div key={i}>• {a}</div>
              ))}
            </div>
          )}

          {/* Oportunidades */}
          {director.opportunitiesDetected?.length > 0 && (
            <div>
              <strong>Oportunidades</strong>
              {director.opportunitiesDetected.map(
                (o: string, i: number) => (
                  <div key={i}>• {o}</div>
                )
              )}
            </div>
          )}

          {/* Riesgos */}
          {director.risksDetected?.length > 0 && (
            <div>
              <strong>Riesgos</strong>
              {director.risksDetected.map(
                (r: string, i: number) => (
                  <div key={i}>• {r}</div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
