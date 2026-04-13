"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useClientsController } from "./services/clients.controller";
import { filterClients } from "./services/clients.normalization";
import type { ClientFilters } from "./types/clients.types";
import { DEFAULT_CLIENT_FILTERS } from "./types/clients.types";

import ClientCommandCenter from "./components/ClientCommandCenter";
import ClientSidebar       from "./components/ClientSidebar";
import ClientWorkspace     from "./components/ClientWorkspace";
import ClientDocuments     from "./components/ClientDocuments";
import ClientConnections   from "./components/ClientConnections";
import ClientCreateDrawer  from "./components/ClientCreateDrawer";

export default function ClientsPage() {
  const { t } = useTranslation();
  const ctrl  = useClientsController();
  const {
    clients, selected, setSelected,
    loading, saving, detailLoading,
    documents, connections,
    createClient, updateClient, toggleStatus,
    addDocument, removeDocument,
  } = ctrl;

  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_CLIENT_FILTERS);
  const [showCreate, setCreate] = useState(false);

  const filtered = useMemo(
    () => filterClients(clients, {
      search:     filters.search,
      role:       filters.role,
      onlyActive: filters.onlyActive,
    }),
    [clients, filters]
  );

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{
        background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)", padding: "20px 32px",
        fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)",
      }}>
        {(t.clients as any)?.loading ?? "Cargando clientes…"}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "auto 560px 380px",
      gap: "16px",
      paddingBottom: "32px",
    }}>
      {/* STRIP — Command Center */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        <ClientCommandCenter clients={clients} onSelect={setSelected} />
      </div>

      {/* ROW_M — Sidebar + Workspace + Documents */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <ClientSidebar
          search={filters.search}
          setSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
          clients={filtered}
          selected={selected}
          setSelected={setSelected}
          onOpenCreate={() => setCreate(true)}
        />
      </div>
      <div style={{ gridColumn: "2 / 4", minHeight: 0, overflow: "hidden" }}>
        <ClientWorkspace
          client={selected}
          onUpdate={updateClient}
          onToggle={toggleStatus}
          detailLoading={detailLoading}
        />
      </div>
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden" }}>
        <ClientDocuments
          documents={documents}
          clientId={selected?.id ?? null}
          onAdd={addDocument}
          onRemove={removeDocument}
          loading={detailLoading}
        />
      </div>

      {/* ROW_L — Customer 360 Connections */}
      <div style={{ gridColumn: "1 / -1", minHeight: 0, overflow: "hidden" }}>
        <ClientConnections
          connections={connections}
          stats={selected?.stats}
          clientName={selected?.name}
          loading={detailLoading}
        />
      </div>

      {/* DRAWER */}
      <ClientCreateDrawer
        open={showCreate}
        onClose={() => setCreate(false)}
        onCreate={createClient as any}
      />
    </div>
  );
}
