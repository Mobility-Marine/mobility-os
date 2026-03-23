"use client";

type Props = any;

export default function AccountsSidebar(props: Props) {
  const {
    search,
    setSearch,
    filteredAccounts,
    selected,
    setSelected,
    radarMap,
    revenueMap,
    actionMap,
    executiveTopAccounts,
    commandCenter,
    globalCommandCenter,
    handleImportFile,
    exportAccountsToCsv,
    miniButton,
    chipHot,
    chipCritical,
    chipMoney,
    chipQuote,
    chipRisk,
    CommandList,
  } = props;
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
      <div style={{ fontWeight: 800, marginBottom: 8 }}>CUENTAS</div>

      <input
        placeholder="Buscar cuenta..."
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

      {/* IMPORT / EXPORT */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          style={miniButton}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".csv";
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            };
            input.click();
          }}
        >
          Importar
        </button>

        <button
          style={miniButton}
          onClick={() => exportAccountsToCsv(false)}
        >
          Exportar
        </button>
      </div>

      {/* PRIORIDAD EJECUTIVA */}
      {executiveTopAccounts.length > 0 && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: "#0b1220",
            border: "1px solid #1f2937",
            display: "grid",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 800, color: "#f97316", fontSize: 13 }}>
            PRIORIDAD EJECUTIVA GLOBAL
          </div>

          {executiveTopAccounts.map(({ account }: any, index: number) => (
            <div
              key={account.id}
              onClick={() => setSelected(account)}
              style={{
                padding: 10,
                borderRadius: 8,
                background: "#020617",
                border: "1px solid #1f2937",
                cursor: "pointer",
              }}
            >
              #{index + 1} {account.name}
            </div>
          ))}
        </div>
      )}

      {/* COMMAND CENTER */}
      {commandCenter && (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          <CommandList
            title="Críticas"
            color="#ef4444"
            accounts={commandCenter.criticalAccounts}
            onSelect={setSelected}
          />
          <CommandList
            title="Urgentes"
            color="#f97316"
            accounts={commandCenter.urgentActions}
            onSelect={setSelected}
          />
        </div>
      )}

{/* ========================================================= */}
{/* ===== GLOBAL COMMAND CENTER — CLIENTE REAL ===== */}
{/* ========================================================= */}

{globalCommandCenter && (
  <div
    style={{
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      background: "#0b1220",
      border: "1px solid #1f2937",
      display: "grid",
      gap: 8,
    }}
  >
    <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: 13 }}>
      🌐 PANEL GLOBAL DE CLIENTES
    </div>

    {globalCommandCenter.criticalRiskClients?.length > 0 && (
      <div style={{ fontSize: 12, color: "#ef4444" }}>
        ⚠ {globalCommandCenter.criticalRiskClients.length} en riesgo
      </div>
    )}

    {globalCommandCenter.quotePendingClients?.length > 0 && (
      <div style={{ fontSize: 12, color: "#f59e0b" }}>
        📄 {globalCommandCenter.quotePendingClients.length} cotizaciones sin cierre
      </div>
    )}

    {globalCommandCenter.noPipelineClients?.length > 0 && (
      <div style={{ fontSize: 12, color: "#94a3b8" }}>
        💤 {globalCommandCenter.noPipelineClients.length} sin pipeline
      </div>
    )}

    {globalCommandCenter.strategicClients?.length > 0 && (
      <div style={{ fontSize: 12, color: "#10b981" }}>
        💎 {globalCommandCenter.strategicClients.length} estratégicos
      </div>
    )}
  </div>
)}
      
      {/* LISTADO */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ display: "grid", gap: 10 }}>
          {filteredAccounts.map((a: any) => {
            const r = radarMap[a.id];
            const rev = revenueMap[a.id];
            const act = actionMap[a.id];

            return (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: selected?.id === a.id ? "#111827" : "#0b1220",
                  border:
                    selected?.id === a.id
                      ? "1px solid #3b82f6"
                      : "1px solid #1f2937",
                  cursor: "pointer",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 800 }}>{a.name}</div>

                {act && (
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>
                    👉 {act.action}
                  </div>
                )}

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r?.temperature === "CALIENTE" && (
                    <span style={chipHot}>🔥 CALIENTE</span>
                  )}

                  {r?.urgency === "CRITICA" && (
                    <span style={chipCritical}>⚠️ CRÍTICA</span>
                  )}

                  {rev?.tier === "HIGH" && (
                    <span style={chipMoney}>💰 HIGH</span>
                  )}

                  {rev?.tier === "STRATEGIC" && (
                    <span style={chipMoney}>💎 STRATEGIC</span>
                  )}

                  {r?.hasQuote && !r?.hasOrder && (
                    <span style={chipQuote}>📄 COTIZACIÓN</span>
                  )}

                  {!r?.hasContacts && (
                    <span style={chipRisk}>👤 SIN CONTACTO</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
