"use client";
import { useTranslation }       from "@/lib/i18n/useTranslation";
import { useTrackingController } from "./services/tracking.controller";
import TrackingCommandCenter    from "./components/TrackingCommandCenter";
import TrackingSidebar          from "./components/TrackingSidebar";
import TrackingWorkspace        from "./components/TrackingWorkspace";

export default function TrackingPage() {
  const { t } = useTranslation();
  const tl    = (t.logistics as any) ?? {};
  const ctrl  = useTrackingController();
  const {
    filteredShipments, selected, events, notifications, pendingGlobal,
    loading, saving, filters, setFilters,
    handleSelectShipment,
    handleCreateEvent, handleDeleteEvent,
    handleCreateNotification, handleUpdateNotification,
    handleMarkReady, handleSendNotification, handleCancelNotification,
  } = ctrl;

  if (loading) return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "300px" }}>
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 32px", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
        {tl.loading ?? "Cargando tracking…"}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gridTemplateRows: "auto 560px",
      gap: "16px",
      paddingBottom: "32px",
    }}>
      {/* KPIs */}
      <TrackingCommandCenter
        shipments={filteredShipments}
        pendingNotifs={pendingGlobal.length}
      />

      {/* SIDEBAR */}
      <div style={{ gridColumn: "1 / 2", minHeight: 0, overflow: "hidden" }}>
        <TrackingSidebar
          shipments={filteredShipments}
          selected={selected}
          onSelect={handleSelectShipment}
          filters={filters}
          setFilters={setFilters}
        />
      </div>

      {/* WORKSPACE */}
      <div style={{ gridColumn: "2 / 5", minHeight: 0, overflow: "hidden" }}>
        <TrackingWorkspace
          shipment={selected}
          events={events}
          notifications={notifications}
          saving={saving}
          onCreateEvent={handleCreateEvent}
          onDeleteEvent={handleDeleteEvent}
          onCreateNotification={handleCreateNotification}
          onUpdateNotification={handleUpdateNotification}
          onMarkReady={handleMarkReady}
          onSend={handleSendNotification}
          onCancel={handleCancelNotification}
        />
      </div>
    </div>
  );
}
