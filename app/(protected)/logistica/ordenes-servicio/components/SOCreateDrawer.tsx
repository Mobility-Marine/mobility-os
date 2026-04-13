"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { ServiceOrder, ServiceOrderType } from "../types/service-orders.types";
import { SO_TYPE_CONFIG } from "../types/service-orders.types";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (data: Partial<ServiceOrder>) => Promise<ServiceOrder | undefined>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function SOCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const tl            = (t.logistics as any) ?? {};

  const [saving,       setSaving]      = useState(false);
  const [error,        setError]       = useState<string | null>(null);
  const [shipments,    setShipments]   = useState<any[]>([]);
  const [shipSearch,   setShipSearch]  = useState("");
  const [selectedShip, setSelectedShip] = useState<any | null>(null);
  const [showShipDD,   setShowShipDD]  = useState(false);
  const [orderType,    setOrderType]   = useState<ServiceOrderType>("ccp_carta");

  useEffect(() => {
    if (!open || !companyId) return;
    supabase.from("shipments")
      .select("id, reference, client:clients(name)")
      .eq("company_id", companyId)
      .not("status", "eq", "cancelled")
      .order("created_at", { ascending: false })
      .then(({ data }) => setShipments(data ?? []));
  }, [open, companyId]);

  const filteredShipments = shipments.filter((s) =>
    !shipSearch.trim() ||
    s.reference?.toLowerCase().includes(shipSearch.toLowerCase()) ||
    s.client?.name?.toLowerCase().includes(shipSearch.toLowerCase())
  );

  async function handleCreate() {
    if (!selectedShip) { setError("Selecciona un embarque"); return; }
    setSaving(true); setError(null);
    try {
      await onCreate({ order_type: orderType, shipment_id: selectedShip.id });
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setSelectedShip(null); setShipSearch(""); setOrderType("ccp_carta"); setError(null); onClose();
  }

  if (!open) return null;

  const ORDER_TYPES: ServiceOrderType[] = ["ccp_carta", "bol_usa", "carta_aduanal"];

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(480px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tl.newServiceOrder ?? "Nueva orden de servicio"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tl.serviceOrdersDesc ?? "CCP + Carta instrucciones, BOL USA, Carta Agente Aduanal."}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "16px", alignContent: "start" }}>

          {/* TIPO */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Tipo de orden *
            </div>
            <div style={{ display: "grid", gap: "6px" }}>
              {ORDER_TYPES.map((type) => {
                const cfg        = SO_TYPE_CONFIG[type];
                const label      = tl[`type${type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("")}`] ?? type;
                const isSelected = orderType === type;
                return (
                  <button key={type} onClick={() => setOrderType(type)} style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left", background: isSelected ? cfg.bg : "var(--color-bg-subtle)", border: `2px solid ${isSelected ? cfg.color : "var(--color-border-faint)"}` }}>
                    <div style={{ fontSize: "12px", fontWeight: isSelected ? 700 : 400, color: isSelected ? cfg.color : "var(--color-text-second)" }}>{label}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>{cfg.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* EMBARQUE VINCULADO */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {tl.linkedShipment ?? "Embarque vinculado"} *
            </div>
            <div style={{ position: "relative" }}>
              <input
                placeholder="Buscar embarque por referencia o cliente…"
                value={shipSearch}
                onChange={(e) => { setShipSearch(e.target.value); setShowShipDD(true); setSelectedShip(null); }}
                onFocus={() => setShowShipDD(true)}
                style={INPUT}
              />
              {showShipDD && filteredShipments.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: "var(--color-bg-base)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--shadow-lg)", maxHeight: "200px", overflowY: "auto" }}>
                  {filteredShipments.map((s) => (
                    <div key={s.id} onClick={() => { setSelectedShip(s); setShipSearch(s.reference); setShowShipDD(false); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace" }}>{s.reference}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{s.client?.name ?? "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedShip && (
              <div style={{ marginTop: "6px", padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", fontSize: "12px", fontWeight: 700, color: "var(--color-success-text)" }}>
                ✓ {selectedShip.reference} {selectedShip.client?.name ? `— ${selectedShip.client.name}` : ""}
              </div>
            )}
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving || !selectedShip} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: selectedShip ? SO_TYPE_CONFIG[orderType].color : "var(--color-bg-subtle)", color: selectedShip ? "#fff" : "var(--color-text-muted)", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving || !selectedShip ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tl.newServiceOrder ?? "Crear orden de servicio")}
          </button>
        </div>
      </div>
    </>
  );
}
