"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { DepreciationEntry, FixedAsset } from "../types/activos.types";
import { ASSET_TYPE_CONFIG } from "../types/activos.types";
import { fetchDepreciationSchedule } from "../services/activos.service";

type Props = {
  pending:  DepreciationEntry[];
  posted:   DepreciationEntry[];
  assets:   FixedAsset[];
  period:   string;
  saving:   boolean;
  onPost:   () => void;
  onSelectAsset: (a: FixedAsset) => void;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

export default function ActivosDepreciacion({
  pending, posted, assets, period, saving, onPost, onSelectAsset,
}: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const ac = (t as any).activos ?? {};

  const [selectedAsset, setSelectedAsset]   = useState<FixedAsset | null>(null);
  const [schedule,      setSchedule]        = useState<DepreciationEntry[]>([]);
  const [loadingSched,  setLoadingSched]     = useState(false);

  async function loadSchedule(asset: FixedAsset) {
    setSelectedAsset(asset);
    setLoadingSched(true);
    try {
      const sched = await fetchDepreciationSchedule(asset.id);
      setSchedule(sched);
    } finally { setLoadingSched(false); }
  }

  const totalPending = pending.reduce((s, e) => s + e.depreciation_amount, 0);
  const totalPosted  = posted.reduce((s, e) => s + e.depreciation_amount, 0);

  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header período */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ padding: "16px 20px", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
            {ac.pendiente ?? "Pendiente"} — {period}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: pending.length > 0 ? "var(--color-warning-text)" : "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
            ${fmt(totalPending)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {pending.length} {es ? "activos pendientes" : "assets pending"}
          </div>
          {pending.length > 0 && (
            <button onClick={onPost} disabled={saving}
              style={{ marginTop: "10px", height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
              {saving ? (es ? "Posteando…" : "Posting…") : (ac.postearPeriodo ?? "Postear depreciación")}
            </button>
          )}
        </div>
        <div style={{ padding: "16px 20px", background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
            {ac.posteado ?? "Posteado"} — {period}
          </div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
            ${fmt(totalPosted)}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {posted.length} {es ? "activos posteados" : "assets posted"}
          </div>
        </div>
      </div>

      {/* Tabla pendientes */}
      {pending.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-warning-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 18px", background: "var(--color-warning-bg)", borderBottom: "1px solid var(--color-warning-border)", fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)" }}>
            {es ? "Pendientes de postear" : "Pending to post"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 120px 110px", padding: "7px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            <span>{es ? "Activo" : "Asset"}</span>
            <span style={{ textAlign: "center" }}>Tipo</span>
            <span style={{ textAlign: "right" }}>Dep. mensual</span>
            <span style={{ textAlign: "right" }}>Dep. acumulada</span>
            <span style={{ textAlign: "right" }}>Valor libro</span>
          </div>
          {pending.map((e, i) => {
            const cfg = e.asset ? ASSET_TYPE_CONFIG[e.asset.asset_type] : null;
            return (
              <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 120px 110px", padding: "10px 18px", borderBottom: i < pending.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{e.asset?.name ?? "—"}</div>
                <div style={{ textAlign: "center" }}><span style={{ fontSize: "14px" }}>{cfg?.icon ?? "📦"}</span></div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.depreciation_amount)}</div>
                <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.accumulated_to_date)}</div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.book_value_after)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabla de depreciación por activo */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "16px" }}>
        {/* Selector activo */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-faint)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {ac.tablaDepreciacion ?? "Tabla de depreciación"}
          </div>
          <div style={{ overflowY: "auto", maxHeight: "400px" }}>
            {assets.filter(a => a.status !== "disposed").map((a, i) => {
              const cfg = ASSET_TYPE_CONFIG[a.asset_type];
              const isSelected = selectedAsset?.id === a.id;
              return (
                <div key={a.id} onClick={() => loadSchedule(a)}
                  style={{ padding: "10px 14px", borderBottom: "1px solid var(--color-border-faint)", cursor: "pointer", background: isSelected ? "var(--color-info-bg)" : "transparent", borderLeft: `3px solid ${isSelected ? "var(--color-brand-blue)" : "transparent"}` }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--color-bg-subtle)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {cfg.icon} {a.name}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {a.useful_life_months} meses · ${fmt(a.monthly_depreciation)}/mes
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabla */}
        {selectedAsset ? (
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {selectedAsset.name} — {es ? "Tabla completa de depreciación" : "Full depreciation schedule"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                {selectedAsset.useful_life_months} {es ? "meses" : "months"} · {DEPRECIATION_METHOD_LABEL[selectedAsset.depreciation_method]}
              </div>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "450px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "80px 100px 110px 120px 110px 80px", padding: "7px 16px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", position: "sticky", top: 0 }}>
                <span>Período</span>
                <span style={{ textAlign: "right" }}>Dep. mes</span>
                <span style={{ textAlign: "right" }}>Dep. acum.</span>
                <span style={{ textAlign: "right" }}>Valor libro</span>
                <span style={{ textAlign: "right" }}>% Depreciado</span>
                <span style={{ textAlign: "center" }}>Estado</span>
              </div>
              {loadingSched ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)", fontSize: "12px" }}>Cargando…</div>
              ) : schedule.map((e, i) => {
                const pct = selectedAsset.acquisition_cost > 0 ? (e.accumulated_to_date / selectedAsset.acquisition_cost) * 100 : 0;
                const isCurrentPeriod = e.period === period;
                return (
                  <div key={e.id} style={{ display: "grid", gridTemplateColumns: "80px 100px 110px 120px 110px 80px", padding: "8px 16px", borderBottom: i < schedule.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", background: isCurrentPeriod ? "rgba(59,130,246,0.05)" : "transparent" }}>
                    <div style={{ fontSize: "11px", color: isCurrentPeriod ? "var(--color-brand-blue)" : "var(--color-text-muted)", fontWeight: isCurrentPeriod ? 700 : 400 }}>
                      {(() => { const [y, m] = e.period.split("-"); return `${MESES[parseInt(m)-1]} ${y}`; })()}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>${fmt(e.depreciation_amount)}</div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.accumulated_to_date)}</div>
                    <div style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>${fmt(e.book_value_after)}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "2px" }}>{pct.toFixed(1)}%</div>
                      <div style={{ height: "4px", borderRadius: "2px", background: "var(--color-border-faint)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pct > 80 ? "var(--color-danger-text)" : "var(--color-brand-blue)" }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {e.posted ? (
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-success-bg)", color: "var(--color-success-text)" }}>✓</span>
                      ) : isCurrentPeriod ? (
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "var(--radius-full)", background: "var(--color-warning-bg)", color: "var(--color-warning-text)" }}>Hoy</span>
                      ) : (
                        <span style={{ fontSize: "9px", color: "var(--color-border-faint)" }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", color: "var(--color-text-muted)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div style={{ fontSize: "13px" }}>{es ? "Selecciona un activo para ver su tabla" : "Select an asset to view its schedule"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const DEPRECIATION_METHOD_LABEL: Record<string, string> = {
  straight_line:    "Línea recta",
  double_declining: "Doble saldo decreciente",
  sum_of_digits:    "Suma de dígitos",
  no_depreciation:  "Sin depreciación",
};
