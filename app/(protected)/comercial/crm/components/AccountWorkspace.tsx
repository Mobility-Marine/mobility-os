"use client";

// ===== COMPONENTE: PANEL CENTRAL DEL CRM =====
// ===== RESPONSABILIDAD =====
// 1) Mostrar estado vacío cuando no hay cuenta seleccionada
// 2) Mostrar header ejecutivo de la cuenta
// 3) Mostrar quick actions
// 4) Mostrar contexto, insights y salud comercial
// 5) Mostrar historial del cliente

type Props = any;

export default function AccountWorkspace(props: Props) {
  // ===== PROPS RECIBIDOS DESDE page.tsx =====
  const {
    selected,
    priorityMap,
    radarMap,
    revenueMap,
    actionMap,
    insights,
    opportunities,
    quotes,
    orders,
    activities,
    timeline,
    contacts,
    createActivity,
    createContact,
    uploadDocument,
    primaryButton,
    miniButton,
    panelCard,
    panelCardTitle,
    TimelineRow,
    CommercialHealthPanel,
    RiskOpportunityPanel,
  } = props;

  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        overflowY: "auto",
      }}
    >
      {/* ===== ESTADO VACÍO DEL WORKSPACE ===== */}
      {!selected && (
        <div
          style={{
            height: "100%",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            color: "#94a3b8",
          }}
        >
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              CRM listo para operar 🚀
            </div>

            <div style={{ marginTop: 10 }}>
              Selecciona o crea una cuenta desde el panel izquierdo.
            </div>
          </div>
        </div>
      )}

      {/* ===== WORKSPACE CON CUENTA SELECCIONADA ===== */}
      {selected && (
        <>
          {/* ===== HEADER EJECUTIVO DE CUENTA ===== */}
          <div
            style={{
              padding: 18,
              borderRadius: 14,
              background: "#0b1220",
              border: "1px solid #1f2937",
              display: "grid",
              gap: 10,
            }}
          >
            {/* Nombre */}
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {selected.name}
            </div>

            {/* Datos base */}
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              {selected.industry || "Industria no definida"} •{" "}
              {selected.city || "-"}, {selected.country || "-"} •{" "}
              {selected.status}
            </div>

            {/* Indicadores ejecutivos */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {priorityMap[selected.id] && (
                <span
                  style={{
                    background:
                      priorityMap[selected.id].label === "CRITICA"
                        ? "#dc2626"
                        : priorityMap[selected.id].label === "ALTA"
                        ? "#f97316"
                        : priorityMap[selected.id].label === "MEDIA"
                        ? "#eab308"
                        : "#64748b",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  PRIORIDAD {priorityMap[selected.id].label}
                </span>
              )}

              {radarMap[selected.id] && (
                <span style={{ color: "#f59e0b", fontSize: 12 }}>
                  🌡 {radarMap[selected.id].temperature}
                </span>
              )}

              {radarMap[selected.id] && (
                <span style={{ color: "#ef4444", fontSize: 12 }}>
                  ⚠️ {radarMap[selected.id].urgency}
                </span>
              )}

              {revenueMap[selected.id] && (
                <span style={{ color: "#22c55e", fontSize: 12 }}>
                  💰 {revenueMap[selected.id].tier}
                </span>
              )}
            </div>

            {/* Acción principal recomendada */}
            {actionMap[selected.id] && (
              <div style={{ fontSize: 14 }}>
                👉 <strong>{actionMap[selected.id].action}</strong>
              </div>
            )}
          </div>

          {/* ===== QUICK ACTIONS BAR ===== */}
          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              background: "#0b1220",
              border: "1px solid #1f2937",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button style={primaryButton} onClick={createActivity}>
              ➕ Actividad
            </button>

            <button style={primaryButton} onClick={createContact}>
              👤 Contacto
            </button>

            <button
              style={primaryButton}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDocument(file);
                };
                input.click();
              }}
            >
              📎 Documento
            </button>

            <button style={miniButton}>🎯 Oportunidad</button>
            <button style={miniButton}>📄 Cotización</button>
          </div>

          {/* ===== BLOQUE A — CONTEXTO ESTRATÉGICO ===== */}
          <div
            style={{
              marginTop: 22,
              fontWeight: 800,
              fontSize: 14,
              color: "#60a5fa",
            }}
          >
            CONTEXTO ESTRATÉGICO
          </div>

          {/* ===== RESUMEN DEL CLIENTE ===== */}
          <div style={panelCard}>
            <div style={panelCardTitle}>Resumen del cliente</div>

            <div>Industria: {selected.industry || "-"}</div>
            <div>
              Ubicación: {selected.city || "-"}, {selected.country || "-"}
            </div>
            <div>Estado: {selected.status}</div>
            {selected.notes && <div>Notas: {selected.notes}</div>}
          </div>

          {/* ===== INSIGHTS DEL CRM ===== */}
          {insights && (
            <div style={panelCard}>
              <div style={{ ...panelCardTitle, color: "#60a5fa" }}>
                CRM AI DIRECTOR
              </div>

              <div>
                Health score: <strong>{insights.healthScore}/100</strong>
              </div>

              <div>
                Prioridad: <strong>{insights.priority}</strong>
              </div>

              <div>
                Riesgo: <strong>{insights.churnRisk}</strong>
              </div>

              <div>Next best action: {insights.nextBestAction}</div>

              <div style={{ color: "#cbd5e1" }}>
                {insights.executiveSummary}
              </div>
            </div>
          )}

          {/* ===== SALUD COMERCIAL ===== */}
          <CommercialHealthPanel
            opportunities={opportunities}
            quotes={quotes}
            orders={orders}
            activities={activities}
            timeline={timeline}
            contacts={contacts}
          />

          {/* ===== RADAR DE RIESGO / OPORTUNIDAD ===== */}
          <RiskOpportunityPanel
            opportunities={opportunities}
            quotes={quotes}
            orders={orders}
            activities={activities}
            timeline={timeline}
            contacts={contacts}
            revenue={revenueMap[selected.id]}
          />

          {/* ===== BLOQUE B — HISTORIAL DEL CLIENTE ===== */}
          <div
            style={{
              marginTop: 28,
              fontWeight: 800,
              fontSize: 14,
              color: "#fbbf24",
            }}
          >
            HISTORIAL DEL CLIENTE
          </div>

          {/* ===== TIMELINE ===== */}
          <div style={{ marginTop: 28 }}>
            <h3>Historial del cliente</h3>

            {timeline.length === 0 && (
              <div style={{ color: "#94a3b8" }}>
                No hay historial disponible.
              </div>
            )}

            {timeline.map((t: any) => (
              <TimelineRow key={`${t.type}-${t.id}`} item={t} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
