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
import ClientContacts      from "./components/ClientContacts";
import ClientConnections   from "./components/ClientConnections";
import ClientCreateDrawer  from "./components/ClientCreateDrawer";

export default function ClientsPage() {
  const { t } = useTranslation();
  const ctrl  = useClientsController();
  const {
    clients, selected, setSelected,
    loading, detailLoading,
    documents, contacts, connections,
    createClient, updateClient, toggleStatus,
    addContact, editContact, removeContact,
    addDocument, editDocument, removeDocument,
  } = ctrl;

  const [filters,    setFilters] = useState<ClientFilters>(DEFAULT_CLIENT_FILTERS);
  const [showCreate, setCreate]  = useState(false);
  const [tab,        setTab]     = useState<"contacts" | "documents">("contacts");

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
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
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
      {/* STRIP */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "16px" }}>
        <ClientCommandCenter clients={clients} onSelect={setSelected} />
      </div>

      {/* ROW_M: Sidebar | Workspace | Contacts+Docs */}
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

      {/* Contacts / Documents tab panel */}
      <div style={{ gridColumn: "4 / 5", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: "0" }}>
        {/* TABS */}
        <div style={{ display: "flex", borderRadius: "var(--radius-lg) var(--radius-lg) 0 0", overflow: "hidden", flexShrink: 0 }}>
          {[
            { key: "contacts",  label: (t.clients as any)?.contacts  ?? "Contactos"  },
            { key: "documents", label: (t.clients as any)?.documents ?? "Documentos" },
          ].map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key as any)}
              style={{
                flex: 1, height: "36px", border: "none",
                background: tab === tb.key ? "var(--color-bg-base)" : "var(--color-bg-subtle)",
                borderBottom: tab === tb.key ? "2px solid var(--color-brand-blue)" : "2px solid var(--color-border-faint)",
                color: tab === tb.key ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                fontSize: "12px", fontWeight: 700, cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              {tb.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)", border: "1px solid var(--color-border-faint)", borderTop: "none" }}>
          {tab === "contacts" ? (
            <div style={{ height: "100%", padding: "14px", overflow: "hidden" }}>
              <ClientContacts
                contacts={contacts}
                clientId={selected?.id ?? null}
                onAdd={addContact}
                onEdit={editContact}
                onRemove={removeContact}
                loading={detailLoading}
              />
            </div>
          ) : (
            <div style={{ height: "100%", padding: "14px", overflow: "hidden" }}>
              <ClientDocuments
                documents={documents}
                clientId={selected?.id ?? null}
                onAdd={addDocument}
                onEdit={editDocument}
                onRemove={removeDocument}
                loading={detailLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* ROW_L — Customer 360 */}
      <div style={{ gridColumn: "1 / -1", minHeight: 0, overflow: "hidden" }}>
        <ClientConnections
          connections={connections}
          stats={selected?.stats}
          clientName={selected?.name}
          loading={detailLoading}
        />
      </div>

      <ClientCreateDrawer
        open={showCreate}
        onClose={() => setCreate(false)}
        onCreate={createClient as any}
      />
    </div>
  );
}
