"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant }       from "@/lib/tenant/TenantProvider";
import type { ForeignTradeOperation, OperationType, TradeRegime } from "../types/foreign-trade.types";
import { REGIME_LABELS } from "../types/foreign-trade.types";
import { supabase }        from "@/lib/supabaseClient";

type Props = {
  open:     boolean;
  onClose:  () => void;
  onCreate: (data: Partial<ForeignTradeOperation>) => Promise<ForeignTradeOperation | undefined>;
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function FTCreateDrawer({ open, onClose, onCreate }: Props) {
  const { t }         = useTranslation();
  const { companyId } = useTenant();
  const tl            = (t.logistics as any) ?? {};

  const [saving,      setSaving]     = useState(false);
  const [error,       setError]      = useState<string | null>(null);
  const [shipments,   setShipments]  = useState<any[]>([]);
  const [brokers,     setBrokers]    = useState<any[]>([]);

  const [opType,      setOpType]     = useState<OperationType>("import");
  const [regime,      setRegime]     = useState<TradeRegime>("definitiva_importacion");
  const [shipment,    setShipment]   = useState("");
  const [broker,      setBroker]     = useState("");
  const [invoice,     setInvoice]    = useState("");
  const [invoiceVal,  setInvoiceVal] = useState("");
  const [currency,    setCurrency]   = useState("USD");
  const [incotermVal, setIncotermVal]= useState("DAP");
  const [origin,      setOrigin]     = useState("US");
  const [destination, setDestination]= useState("MX");

  useEffect(() => {
    if (!open || !companyId) return;
    Promise.all([
      supabase.from("shipments").select("id, reference, client:clients(name)").eq("company_id", companyId).not("status","eq","cancelled").order("created_at",{ascending:false}),
      supabase.from("logistics_providers").select("id, provider_name").eq("company_id", companyId).eq("provider_type","customs_broker").eq("is_active",true),
    ]).then(([{ data: s }, { data: b }]) => {
      setShipments(s ?? []);
      setBrokers(b ?? []);
    });
  }, [open, companyId]);

  useEffect(() => {
    if (opType === "import") setRegime("definitiva_importacion");
    else                     setRegime("definitiva_exportacion");
  }, [opType]);

  async function handleCreate() {
    setSaving(true); setError(null);
    try {
      await onCreate({
        operation_type:   opType,
        regime,
        shipment_id:      shipment    || undefined,
        customs_broker_id: broker     || undefined,
        invoice_number:   invoice     || undefined,
        invoice_value:    invoiceVal  ? parseFloat(invoiceVal) : undefined,
        invoice_currency: currency,
        incoterm:         incotermVal || undefined,
        country_origin:      origin      || undefined,
        country_destination: destination || undefined,
      });
      handleClose();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  function handleClose() {
    setOpType("import"); setRegime("definitiva_importacion"); setShipment(""); setBroker("");
    setInvoice(""); setInvoiceVal(""); setCurrency("USD"); setIncotermVal("DAP");
    setOrigin("US"); setDestination("MX"); setError(null); onClose();
  }

  if (!open) return null;

  const regimes = (Object.keys(REGIME_LABELS) as TradeRegime[]).filter((r) =>
    opType === "import" ? r.includes("importacion") || ["deposito_fiscal","transito_internacional","recinto_fiscalizado","elaboracion_transformacion","otros"].includes(r)
                       : r.includes("exportacion")  || ["deposito_fiscal","transito_internacional","recinto_fiscalizado","elaboracion_transformacion","otros"].includes(r)
  );

  return (
    <>
      <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 400 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(480px, 96vw)", background: "var(--color-bg-base)", borderLeft: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)", zIndex: 401, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--color-border-faint)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-text-primary)" }}>{tl.newOperation ?? "Nueva operación"}</div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{tl.foreignTradeDesc ?? "Importación / Exportación"}</div>
          </div>
          <button onClick={handleClose} style={{ width: "30px", height: "30px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "grid", gap: "14px", alignContent: "start" }}>

          {/* Tipo */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase" }}>Tipo de operación *</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {(["import","export"] as OperationType[]).map((type) => (
                <button key={type} onClick={() => setOpType(type)} style={{ padding: "12px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center", background: opType === type ? (type === "import" ? "#dbeafe" : "#ede9fe") : "var(--color-bg-subtle)", border: `2px solid ${opType === type ? (type === "import" ? "#2563eb" : "#7c3aed") : "var(--color-border-faint)"}` }}>
                  <div style={{ fontSize: "16px", marginBottom: "4px" }}>{type === "import" ? "📥" : "📤"}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: opType === type ? (type === "import" ? "#2563eb" : "#7c3aed") : "var(--color-text-second)" }}>
                    {type === "import" ? (tl.opTypeImport ?? "Importación") : (tl.opTypeExport ?? "Exportación")}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Régimen */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Régimen aduanero *</div>
            <select value={regime} onChange={(e) => setRegime(e.target.value as TradeRegime)} style={{ ...INPUT, cursor: "pointer" }}>
              {regimes.map((r) => (
                <option key={r} value={r}>{tl[REGIME_LABELS[r].replace("logistics.", "")] ?? r}</option>
              ))}
            </select>
          </div>

          {/* Embarque */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Embarque vinculado</div>
            <select value={shipment} onChange={(e) => setShipment(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="">— Sin embarque —</option>
              {shipments.map((s) => <option key={s.id} value={s.id}>{s.reference}{s.client?.name ? ` · ${s.client.name}` : ""}</option>)}
            </select>
          </div>

          {/* Agente Aduanal */}
          {brokers.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.customsBroker ?? "Agente aduanal"}</div>
              <select value={broker} onChange={(e) => setBroker(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">— Sin asignar —</option>
                {brokers.map((b) => <option key={b.id} value={b.id}>{b.provider_name}</option>)}
              </select>
            </div>
          )}

          {/* Factura */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.invoiceNumber ?? "No. Factura comercial"}</div>
              <input value={invoice} onChange={(e) => setInvoice(e.target.value)} placeholder="INV-2025-001" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.invoiceValue ?? "Valor factura"}</div>
              <input type="number" min="0" step="0.01" value={invoiceVal} onChange={(e) => setInvoiceVal(e.target.value)} placeholder="0.00" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Moneda</div>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {["USD","MXN","EUR","CAD"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>Incoterm</div>
              <select value={incotermVal} onChange={(e) => setIncotermVal(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                {["EXW","FCA","FAS","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"].map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.countryOrigin ?? "País origen"}</div>
              <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="US, MX, CN…" style={INPUT} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase" }}>{tl.countryDestination ?? "País destino"}</div>
              <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="MX, US…" style={INPUT} />
            </div>
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{error}</div>}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border-faint)", display: "flex", gap: "10px", flexShrink: 0 }}>
          <button onClick={handleClose} style={{ height: "40px", padding: "0 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-second)", fontSize: "13px", cursor: "pointer" }}>
            {t.general.cancel}
          </button>
          <button onClick={handleCreate} disabled={saving} style={{ flex: 1, height: "40px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? t.general.loading : (tl.newOperation ?? "Crear operación")}
          </button>
        </div>
      </div>
    </>
  );
}
