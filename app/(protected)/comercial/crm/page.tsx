"use client";

// ===== INICIO IMPORTS =====
import { useEffect, useMemo, useState } from "react";

import AccountsSidebar from "./components/AccountsSidebar";
import AccountWorkspace from "./components/AccountWorkspace";
import AccountCopilot from "./components/AccountCopilot";

// ===== TYPES =====
import type {
  CrmAccount,
  CrmDocument,
  CrmActivity,
  CrmOpportunity,
  CrmQuote,
  CrmOrder,
  TimelineItem,
  CrmAccountInsights,
  CustomerAlert,
  AiDirectorAdvice,
  CrmContact,
  AccountRadar,
  AccountRevenue,
  AccountPriority,
  AccountAction,
  CommandCenterData
} from "./types/crm.types";

// ===== ANALYTICS ENGINE =====
import {
  calculateAccountPriority,
  calculateAccountAction,
  calculateCommandCenter,
  calculateDirectorAdvice
} from "./services/crm.analytics";

// ===== UI =====
import {
  panelCard,
  panelCardTitle,
  inputStyle,
  miniButton,
  primaryButton,
  chipHot,
  chipCritical,
  chipMoney,
  chipQuote,
  chipRisk,
  tableHead,
  tableCell,
  CommandList,
  TimelineRow,
  CommercialHealthPanel,
  RiskOpportunityPanel
} from "./components/ui/CRMSharedUI";
// ===== INTELLIGENCE =====
import {
  buildAccountInsights,
  buildCustomerAlerts
} from "./services/crm.intelligence";
// ===== CONTROLLER =====
import { useCRMController } from "./services/crm.controller";
// ===== FIN IMPORTS =====

export default function CRMPage() {

  // ===== INICIO STATE =====

  const crm = useCRMController();

const {
  loading,
  accounts,
  selected,
  setSelected,
  documents,
  activities,
  contacts,
  opportunities,
  quotes,
  orders,
  timeline,

  createAccount,
  createContact,
  createActivity,
  uploadDocument
} = crm;
  
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityType, setNewActivityType] = useState("call");
  const [newActivityDate, setNewActivityDate] = useState("");

  const [insights, setInsights] = useState<CrmAccountInsights | null>(null);
  const [director, setDirector] = useState<AiDirectorAdvice | null>(null);
  const [alerts, setAlerts] = useState<CustomerAlert[]>([]);

  const [radarMap, setRadarMap] = useState<Record<string, AccountRadar>>({});
  const [revenueMap, setRevenueMap] = useState<Record<string, AccountRevenue>>(
    {}
  );
  const [priorityMap, setPriorityMap] = useState<
    Record<string, AccountPriority>
  >({});
  const [actionMap, setActionMap] = useState<Record<string, AccountAction>>({});
  const [commandCenter, setCommandCenter] =
    useState<CommandCenterData | null>(null);

  const [search, setSearch] = useState("");
  // ===== ACCOUNT CREATION MODAL =====
const [showCreateAccount, setShowCreateAccount] = useState(false);

const [newAccount, setNewAccount] = useState({
  name: "",
  legal_name: "",
  industry: "",
  country: "",
  city: "",
  status: "active",
  notes: "",
});

// ===== INICIO STATE IMPORTADOR =====
const [showImportModal, setShowImportModal] = useState(false);
const [importing, setImporting] = useState(false);
const [importRows, setImportRows] = useState<
  Array<{
    name: string;
    legal_name: string;
    industry: string;
    country: string;
    city: string;
    status: string;
    notes: string;
    _rowNumber: number;
    _warnings: string[];
  }>
>([]);

const [importMode, setImportMode] = useState<"insert" | "upsert">("insert");
// ===== FIN STATE IMPORTADOR =====
  
  // ===== FIN STATE =====

  // ===== INICIO FILTERED ACCOUNTS =====
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return [...accounts].sort(
        (a, b) =>
          (priorityMap[b.id]?.score || 0) - (priorityMap[a.id]?.score || 0)
      );
    }

    return [...accounts]
      .filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.legal_name?.toLowerCase().includes(q) ||
          a.industry?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q) ||
          a.country?.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          (priorityMap[b.id]?.score || 0) - (priorityMap[a.id]?.score || 0)
      );
  }, [accounts, priorityMap, search]);
  // ===== FIN FILTERED ACCOUNTS =====

// ===== INICIO EXECUTIVE TOP ACCOUNTS =====
const executiveTopAccounts = useMemo(() => {
  return [...accounts]
    .map((account) => {
      const priority = priorityMap[account.id];
      const revenue = revenueMap[account.id];
      const radar = radarMap[account.id];
      const action = actionMap[account.id];

      let executiveScore = 0;

      executiveScore += priority?.score || 0;

      if (revenue?.tier === "STRATEGIC") executiveScore += 30;
      else if (revenue?.tier === "HIGH") executiveScore += 20;
      else if (revenue?.tier === "MEDIUM") executiveScore += 10;

      if (radar?.urgency === "CRITICA") executiveScore += 25;
      else if (radar?.urgency === "ALTA") executiveScore += 15;
      else if (radar?.urgency === "MEDIA") executiveScore += 8;

      if (action?.urgency === "CRITICA") executiveScore += 20;
      else if (action?.urgency === "ALTA") executiveScore += 12;
      else if (action?.urgency === "MEDIA") executiveScore += 6;

      return {
        account,
        executiveScore,
      };
    })
    .sort((a, b) => b.executiveScore - a.executiveScore)
    .slice(0, 3);
}, [accounts, priorityMap, revenueMap, radarMap, actionMap]);
// ===== FIN EXECUTIVE TOP ACCOUNTS =====

// ===== INTELIGENCIA MIGRADA AL CONTROLLER =====

  // ===== INICIO RECALCULAR INSIGHTS =====
  useEffect(() => {
  if (!selected) return;

  const insights = buildAccountInsights(selected, {
    contacts,
    activities,
    documents,
    opportunities,
    quotes,
    orders,
    timeline
  });

  setInsights(insights);

}, [
  selected,
  contacts,
  activities,
  documents,
  opportunities,
  quotes,
  orders,
  timeline
]);
  // ===== FIN RECALCULAR INSIGHTS =====

  // ===== INICIO RECALCULAR DIRECTOR IA =====
useEffect(() => {
  if (!selected) return;

  const advice = calculateDirectorAdvice(
    selected,
    opportunities,
    quotes,
    orders,
    contacts.length,
    activities.length > 0,
    timeline.length
  );

  setDirector(advice);

}, [
  selected,
  opportunities,
  quotes,
  orders,
  contacts,
  activities,
  timeline
]);
  // ===== FIN RECALCULAR DIRECTOR IA =====

  // ===== INICIO CALCULO PRIORIDAD =====
useEffect(() => {
  accounts.forEach((acc) => buildAccountPriority(acc));
}, [accounts, radarMap, revenueMap, activities]);
// ===== FIN CALCULO PRIORIDAD =====

  // ===== INICIO RECALCULAR COMMAND CENTER =====
  useEffect(() => {
    if (accounts.length === 0) return;
    buildCommandCenter();
  }, [accounts, radarMap, revenueMap, priorityMap, actionMap]);
  // ===== FIN RECALCULAR COMMAND CENTER =====

  // ===== INICIO RECALCULAR CUSTOMER ALERTS =====
 useEffect(() => {
  if (!selected) return;

  const alerts = buildCustomerAlerts(
    insights,
    activities,
    contacts,
    opportunities,
    quotes,
    orders
  );

  setAlerts(alerts);

}, [
  selected,
  insights,
  activities,
  contacts,
  opportunities,
  quotes,
  orders
]);

 // ===== CALCULO — Radar (legacy) =====
// TODO: mover cálculo al analytics/controller
function buildAccountRadar(_: CrmAccount) {
  // intentionally empty
}

 // ===== CALCULO — Revenue (legacy) =====
// TODO: mover cálculo al analytics/controller
function buildAccountRevenue(_: CrmAccount) {
  // intentionally empty
}
  
  function buildAccountPriority(account: CrmAccount) {
  const id = account.id;

  const priority = calculateAccountPriority(
    radarMap[id],
    revenueMap[id],
    activities
  );

  setPriorityMap((prev) => ({
    ...prev,
    [id]: { ...priority, accountId: id },
  }));
}

  function buildAccountAction(account: CrmAccount) {
  const id = account.id;

  const action = calculateAccountAction(
    radarMap[id],
    revenueMap[id],
    priorityMap[id]
  );

  setActionMap((prev) => ({
    ...prev,
    [id]: { ...action, accountId: id },
  }));
}

  function buildCommandCenter() {
  const data = calculateCommandCenter(
    accounts,
    radarMap,
    revenueMap,
    priorityMap,
    actionMap
  );

  setCommandCenter(data);
}

  // ===== INICIO FUNCIONES IMPORTADOR =====
function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

  function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  const normalized = headers.map(normalizeHeader);
  const aliasSet = aliases.map(normalizeHeader);
  return normalized.findIndex((h) => aliasSet.includes(h));
}

async function handleImportFile(file: File) {
  // tenant manejado por el controller

  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    alert("El archivo no contiene datos.");
    return;
  }

  const headers = parseCsvLine(lines[0]);

  const idx = {
    name: findHeaderIndex(headers, ["name", "nombre", "empresa", "account"]),
    legal_name: findHeaderIndex(headers, [
      "legal_name",
      "razon_social",
      "razón_social",
      "legalname",
    ]),
    industry: findHeaderIndex(headers, ["industry", "industria", "sector"]),
    country: findHeaderIndex(headers, ["country", "pais", "país"]),
    city: findHeaderIndex(headers, ["city", "ciudad"]),
    status: findHeaderIndex(headers, ["status", "estado"]),
    notes: findHeaderIndex(headers, ["notes", "notas", "comentarios"]),
  };

  if (idx.name === -1) {
    alert(
      'No encontré la columna de nombre. Usa una de estas: "name", "nombre", "empresa", "account".'
    );
    return;
  }

  const seenKeys = new Set<string>();

  const rows = lines.slice(1).map((line, i) => {
    const cols = parseCsvLine(line);

    const row = {
      name: cols[idx.name] || "",
      legal_name: idx.legal_name >= 0 ? cols[idx.legal_name] || "" : "",
      industry: idx.industry >= 0 ? cols[idx.industry] || "" : "",
      country: idx.country >= 0 ? cols[idx.country] || "" : "",
      city: idx.city >= 0 ? cols[idx.city] || "" : "",
      status: idx.status >= 0 ? cols[idx.status] || "active" : "active",
      notes: idx.notes >= 0 ? cols[idx.notes] || "" : "",
      _rowNumber: i + 2,
      _warnings: [] as string[],
    };

    const uniqueKey = `${row.name}`.trim().toLowerCase() ||
      `${row.legal_name}`.trim().toLowerCase();

    if (!row.name.trim()) {
      row._warnings.push("Fila sin nombre");
    }

    if (uniqueKey) {
      if (seenKeys.has(uniqueKey)) {
        row._warnings.push("Duplicada dentro del archivo");
      } else {
        seenKeys.add(uniqueKey);
      }
    }

    if (!row.status.trim()) {
      row.status = "active";
    }

    return row;
  });

  const validRows = rows.filter((r) => r.name.trim());

  if (validRows.length === 0) {
    alert("No se encontraron filas válidas para importar.");
    return;
  }

  setImportRows(validRows);
  setShowImportModal(true);
}

// ===== ACTION — Import Accounts =====
// TODO: migrar al controller
function confirmImportRows() {
  throw new Error("Importación no migrada al controller");
}
  
  // ===== INICIO FUNCION EXPORTADOR =====
function exportAccountsToCsv(onlyFiltered = false) {
  const list = onlyFiltered ? filteredAccounts : accounts;

  if (!list || list.length === 0) {
    alert("No hay cuentas para exportar.");
    return;
  }

  const headers = [
    "name",
    "legal_name",
    "industry",
    "country",
    "city",
    "status",
    "notes",
  ];

  const escape = (value: any) => {
    if (value == null) return "";
    const str = String(value);
    if (str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    if (str.includes(",") || str.includes("\n")) {
      return `"${str}"`;
    }
    return str;
  };

  const rows = list.map((a) =>
    [
      escape(a.name),
      escape(a.legal_name),
      escape(a.industry),
      escape(a.country),
      escape(a.city),
      escape(a.status),
      escape(a.notes),
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;

  const date = new Date().toISOString().slice(0, 10);

  link.download = onlyFiltered
    ? `crm-cuentas-filtradas-${date}.csv`
    : `crm-cuentas-${date}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
// ===== FIN FUNCION EXPORTADOR =====

  // ===== INICIO RENDER =====
  if (loading) return <div style={{ padding: 40 }}>Cargando CRM...</div>;

  return (
    <div
      style={{
        height: "calc(100vh - 40px)",
        display: "grid",
        gridTemplateColumns: "320px minmax(0, 1fr) 340px",
        gap: 16,
        padding: 16,
        background: "#020617",
      }}
    >
      {/* ========================================================= */}
      {/* ===== PANEL IZQUIERDO — RADAR DE CUENTAS ===== */}
      {/* ========================================================= */}

<AccountsSidebar
  search={search}
  setSearch={setSearch}
  filteredAccounts={filteredAccounts}
  selected={selected}
  setSelected={setSelected}
  radarMap={radarMap}
  revenueMap={revenueMap}
  actionMap={actionMap}
  executiveTopAccounts={executiveTopAccounts}
  commandCenter={commandCenter}
  handleImportFile={handleImportFile}
  exportAccountsToCsv={exportAccountsToCsv}
  miniButton={miniButton}
  chipHot={chipHot}
  chipCritical={chipCritical}
  chipMoney={chipMoney}
  chipQuote={chipQuote}
  chipRisk={chipRisk}
  CommandList={CommandList}
/>
      
{/* ========================================================= */}
{/* ===== PANEL CENTRAL — WORKSPACE DEL CLIENTE ===== */}
{/* ========================================================= */}
<AccountWorkspace
  selected={selected}
  priorityMap={priorityMap}
  radarMap={radarMap}
  revenueMap={revenueMap}
  actionMap={actionMap}
  insights={insights}
  opportunities={opportunities}
  quotes={quotes}
  orders={orders}
  activities={activities}
  timeline={timeline}
  contacts={contacts}
  createActivity={createActivity}
  createContact={createContact}
  uploadDocument={uploadDocument}
  primaryButton={primaryButton}
  miniButton={miniButton}
  panelCard={panelCard}
  panelCardTitle={panelCardTitle}
  TimelineRow={TimelineRow}
  CommercialHealthPanel={CommercialHealthPanel}
  RiskOpportunityPanel={RiskOpportunityPanel}
/>

      {/* ========================================================= */}
      {/* ===== PANEL DERECHO — COPILOT IA ===== */}
      {/* ========================================================= */}
      
      <AccountCopilot
  selected={selected}
  director={director}
/>

{/* ========================================================= */}
{/* ===== MODAL CREAR CUENTA — UNICORN WIZARD ===== */}
{/* ========================================================= */}
{showCreateAccount && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "grid",
      placeItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: 520,
        maxWidth: "95vw",
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 22,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800 }}>
        Nueva cuenta
      </div>

      {/* ===== CAMPOS ===== */}
      <input
        placeholder="Nombre comercial *"
        value={newAccount.name}
        onChange={(e) =>
          setNewAccount({ ...newAccount, name: e.target.value })
        }
        style={inputStyle}
      />

      <input
        placeholder="Razón social"
        value={newAccount.legal_name}
        onChange={(e) =>
          setNewAccount({
            ...newAccount,
            legal_name: e.target.value,
          })
        }
        style={inputStyle}
      />

      <input
        placeholder="Industria"
        value={newAccount.industry}
        onChange={(e) =>
          setNewAccount({
            ...newAccount,
            industry: e.target.value,
          })
        }
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <input
          placeholder="Ciudad"
          value={newAccount.city}
          onChange={(e) =>
            setNewAccount({ ...newAccount, city: e.target.value })
          }
          style={{ ...inputStyle, flex: 1 }}
        />

        <input
          placeholder="País"
          value={newAccount.country}
          onChange={(e) =>
            setNewAccount({
              ...newAccount,
              country: e.target.value,
            })
          }
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      <textarea
        placeholder="Notas estratégicas"
        value={newAccount.notes}
        onChange={(e) =>
          setNewAccount({
            ...newAccount,
            notes: e.target.value,
          })
        }
        style={{
          ...inputStyle,
          minHeight: 80,
          resize: "vertical",
        }}
      />

      {/* ===== BOTONES ===== */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={miniButton}
          onClick={() => setShowCreateAccount(false)}
        >
          Cancelar
        </button>

        <button
          style={primaryButton}
        onClick={async () => {
  if (!newAccount.name) return;

  await createAccount(newAccount);

  setShowCreateAccount(false);

  setNewAccount({
    name: "",
    legal_name: "",
    industry: "",
    country: "",
    city: "",
    status: "active",
    notes: "",
  });
}}
        >
          Crear cuenta
        </button>
      </div>
    </div>
  </div>
)}

{/* ===== MODAL IMPORTACIÓN MASIVA ===== */}
{showImportModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "grid",
      placeItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        width: 900,
        maxWidth: "95vw",
        maxHeight: "85vh",
        overflow: "auto",
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 20,
        display: "grid",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800 }}>
        Importación masiva de cuentas
      </div>

      <div style={{ display: "grid", gap: 8 }}>
  <div style={{ color: "#94a3b8", fontSize: 13 }}>
    Se detectaron {importRows.length} filas válidas.
  </div>

  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <span style={{ fontSize: 13, color: "#cbd5e1" }}>
      Modo:
    </span>

    <button
      type="button"
      style={importMode === "insert" ? primaryButton : miniButton}
      onClick={() => setImportMode("insert")}
    >
      Insertar nuevas
    </button>

    <button
      type="button"
      style={importMode === "upsert" ? primaryButton : miniButton}
      onClick={() => setImportMode("upsert")}
    >
      Insertar / actualizar
    </button>
  </div>
</div>

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: "#0b1220" }}>
              <th style={tableHead}>Nombre</th>
              <th style={tableHead}>Razón social</th>
              <th style={tableHead}>Industria</th>
              <th style={tableHead}>Ciudad</th>
              <th style={tableHead}>País</th>
              <th style={tableHead}>Estado</th>
              <th style={tableHead}>Advertencias</th>
            </tr>
          </thead>

          <tbody>
            {importRows.slice(0, 50).map((row, i) => (
              <tr key={i}>
                <td style={tableCell}>{row.name}</td>
                <td style={tableCell}>{row.legal_name || "-"}</td>
                <td style={tableCell}>{row.industry || "-"}</td>
                <td style={tableCell}>{row.city || "-"}</td>
                <td style={tableCell}>{row.country || "-"}</td>
                <td style={tableCell}>{row.status || "active"}</td>
                <td style={tableCell}>
  {row._warnings.length > 0 ? row._warnings.join(" · ") : "-"}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {importRows.length > 50 && (
        <div style={{ color: "#94a3b8", fontSize: 12 }}>
          Mostrando solo las primeras 50 filas.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          style={miniButton}
          onClick={() => {
            setShowImportModal(false);
            setImportRows([]);
          }}
          disabled={importing}
        >
          Cancelar
        </button>

        <button
          style={primaryButton}
          onClick={confirmImportRows}
          disabled={importing}
        >
          {importing ? "Importando..." : "Confirmar importación"}
        </button>
      </div>
    </div>
  </div>
)}
  
</div>
);

 // ===== FIN RENDER =====
}
