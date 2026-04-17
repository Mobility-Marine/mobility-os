"use client";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import {
  fetchTaxRegime, fetchPosicionFiscal, fetchDeclaracionIVA,
  fetchDeclaracionISR, fetchTaxPaymentsYear, registerTaxPayment,
  type PosicionFiscal, type DeclaracionIVA, type DeclaracionISR, type TaxPayment,
} from "./services/impuestos.service";
import ImpuestosPosicion  from "./components/ImpuestosPosicion";
import ImpuestosIVA       from "./components/ImpuestosIVA";
import ImpuestosISR       from "./components/ImpuestosISR";
import ImpuestosHistorial from "./components/ImpuestosHistorial";
import ImpuestosPagoDrawer from "./components/ImpuestosPagoDrawer";
import { useRouter } from "next/navigation";

type Tab = "posicion" | "iva" | "isr" | "historial";

function getCurrentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ImpuestosPage() {
  const { lang, t }   = useTranslation();
  const { companyId } = useTenant();
  const router        = useRouter();
  const es  = lang !== "en";
  const im  = (t as any).impuestos ?? {};

  const [userId,   setUserId]   = useState("");
  const [tab,      setTab]      = useState<Tab>("posicion");
  const [period,   setPeriod]   = useState(getCurrentPeriod());
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [regimen,  setRegimen]  = useState<string | null>(null);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoType, setPagoType] = useState<"iva" | "isr">("iva");

  const [posicion,  setPosicion]  = useState<PosicionFiscal  | null>(null);
  const [dataIVA,   setDataIVA]   = useState<DeclaracionIVA  | null>(null);
  const [dataISR,   setDataISR]   = useState<DeclaracionISR  | null>(null);
  const [historial, setHistorial] = useState<TaxPayment[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? ""));
  }, []);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const reg = await fetchTaxRegime(companyId);
      setRegimen(reg);
      const year = period.split("-")[0];
      const [pos, iva, isr, hist] = await Promise.all([
        fetchPosicionFiscal(companyId, period),
        fetchDeclaracionIVA(companyId, period),
        fetchDeclaracionISR(companyId, period),
        fetchTaxPaymentsYear(companyId, year),
      ]);
      setPosicion(pos);
      setDataIVA(iva);
      setDataISR(isr);
      setHistorial(hist);
    } finally { setLoading(false); }
  }, [companyId, period]);

  useEffect(() => { if (companyId) load(); }, [companyId, period]);

  async function handlePago(payload: any) {
    setSaving(true);
    try {
      await registerTaxPayment(companyId!, userId, payload);
      await load();
    } finally { setSaving(false); }
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "posicion",  label: im.tabPosicion  ?? "Posición fiscal",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { key: "iva",       label: im.tabIVA       ?? "IVA",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { key: "isr",       label: im.tabISR       ?? "ISR",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { key: "historial", label: im.tabHistorial ?? "Historial",
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  ];

  const INPUT_S: React.CSSProperties = {
    height: "32px", padding: "0 8px",
    borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
    background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
    fontSize: "12px", outline: "none", cursor: "pointer",
  };

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const [y, m] = period.split("-");
  const periodoLabel = `${MESES[parseInt(m)-1]} ${y}`;

  // Sin régimen configurado
  if (regimen === null && !loading) return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
        🧾 {im.title ?? "Impuestos"}
      </h1>
      <div style={{ padding: "40px", textAlign: "center", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <span style={{ fontSize: "48px" }}>🏛️</span>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>{im.sinRegimen ?? "Configura tu régimen fiscal"}</div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", maxWidth: "400px" }}>{im.sinRegimenDesc}</div>
        <button onClick={() => router.push("/settings")}
          style={{ height: "38px", padding: "0 24px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          {im.irASettings ?? "Ir a Configuración"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "20px", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-text-primary)", margin: 0 }}>
            🧾 {im.title ?? "Impuestos"}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: "4px 0 0" }}>
            {im.subtitle ?? "IVA, ISR y declaraciones fiscales calculadas automáticamente."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Selector de mes */}
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            style={{ ...INPUT_S, padding: "0 8px", width: "140px" }} />
          {/* Períodos rápidos */}
          <button onClick={() => setPeriod(getCurrentPeriod())}
            style={{ ...INPUT_S, padding: "0 12px", cursor: "pointer", fontWeight: 600 }}>
            {im.mesActual ?? "Mes actual"}
          </button>
          <button onClick={load} disabled={loading}
            style={{ height: "32px", padding: "0 14px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: loading ? "spin 1s linear infinite" : "none" }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {loading ? (es ? "Calculando…" : "Calculating…") : (es ? "Actualizar" : "Refresh")}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--color-border-faint)" }}>
        {TABS.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md) var(--radius-md) 0 0", background: tab === tb.key ? "var(--color-bg-base)" : "transparent", border: tab === tb.key ? "1px solid var(--color-border-faint)" : "none", borderBottom: tab === tb.key ? "1px solid var(--color-bg-base)" : "none", color: tab === tb.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: tab === tb.key ? 700 : 400, cursor: "pointer", marginBottom: tab === tb.key ? "-1px" : "0", display: "flex", alignItems: "center", gap: "6px" }}>
            {tb.icon}{tb.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === "posicion" && posicion && (
        <ImpuestosPosicion
          posicion={posicion}
          loading={loading}
          onPagarIVA={() => { setPagoType("iva"); setPagoOpen(true); }}
          onPagarISR={() => { setPagoType("isr"); setPagoOpen(true); }}
        />
      )}
      {tab === "iva" && dataIVA && (
        <ImpuestosIVA
          data={dataIVA}
          loading={loading}
          onPagar={() => { setPagoType("iva"); setPagoOpen(true); }}
        />
      )}
      {tab === "isr" && dataISR && (
        <ImpuestosISR
          data={dataISR}
          loading={loading}
          onPagar={() => { setPagoType("isr"); setPagoOpen(true); }}
        />
      )}
      {tab === "historial" && (
        <ImpuestosHistorial payments={historial} loading={loading} />
      )}

      {/* Drawer pago */}
      <ImpuestosPagoDrawer
        open={pagoOpen}
        taxType={pagoType}
        period={period}
        amountDue={pagoType === "iva" ? (posicion?.iva_neto ?? 0) : (posicion?.isr_a_pagar ?? 0)}
        saving={saving}
        onClose={() => setPagoOpen(false)}
        onSave={handlePago}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
