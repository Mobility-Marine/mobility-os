"use client";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AssetStats, FixedAsset } from "../types/activos.types";
import { ASSET_TYPE_CONFIG, ASSET_STATUS_CONFIG } from "../types/activos.types";

type Props = {
  stats:   AssetStats;
  assets:  FixedAsset[];
  loading: boolean;
  period:  string;
  onNew:             () => void;
  onSelectAsset:     (a: FixedAsset) => void;
  onPostDepreciation:() => void;
  pendingCount:      number;
  saving:            boolean;
};

const fmt  = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });
const fmt0 = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 0 });

export default function ActivosDashboard({
  stats: s, assets, loading, period, onNew, onSelectAsset,
  onPostDepreciation, pendingCount, saving,
}: Props) {
  const { lang, t } = useTranslation();
  const es  = lang !== "en";
  const ac  = (t as any).activos ?? {};

  const pctDepreciado = s.total_cost > 0 ? (s.total_accumulated_dep / s.total_cost) * 100 : 0;
  const activeAssets  = assets.filter(a => a.status === "active");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Alerta depreciación pendiente */}
      {pendingCount > 0 && (
        <div style={{ padding: "14px 18px", borderRadius: "var(--radius-lg)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning-text)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-warning-text)" }}>
                {pendingCount} {es ? "activos con depreciación pendiente de postear" : "assets with pending depreciation to post"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-warning-text)", opacity: 0.8 }}>
                {es ? `Período: ${period}` : `Period: ${period}`}
              </div>
            </div>
          </div>
          <button onClick={onPostDepreciation} disabled={saving}
            style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: "var(--color-warning-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? (es ? "Posteando…" : "Posting…") : (ac.postearPeriodo ?? "Postear depreciación")}
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: ac.totalActivos  ?? "Valor en libros",    value: `$${fmt0(s.total_book_value)}`,      color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",     icon: "🏛️" },
          { label: ac.totalCosto    ?? "Costo de adquisición", value: `$${fmt0(s.total_cost)}`,          color: "var(--color-text-second)",  bg: "var(--color-bg-subtle)",   icon: "💰" },
          { label: ac.totalDepreciado??"Depreciación acumulada", value: `$${fmt0(s.total_accumulated_dep)}`, color: "var(--color-danger-text)", bg: "var(--color-danger-bg)",   icon: "📉" },
          { label: ac.porDepreciar  ?? "Por depreciar (mes)", value: `$${fmt0(s.monthly_dep_pending)}`,  color: "var(--color-warning-text)", bg: "var(--color-warning-bg)",  icon: "📅" },
        ].map(c => (
          <div key={c.label} style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.3 }}>{c.label}</div>
              <div style={{ width: "34px", height: "34px", borderRadius: "var(--radius-md)", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>{c.icon}</div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: c.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
              {c.label === (ac.totalActivos ?? "Valor en libros") ? `${s.total_assets} ${es ? "activos" : "assets"}` :
               c.label === (ac.totalDepreciado ?? "Depreciación acumulada") ? `${pctDepreciado.toFixed(1)}% ${es ? "del costo total" : "of total cost"}` : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Barra de depreciación global */}
      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Estado de depreciación global" : "Global depreciation status"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
            {pctDepreciado.toFixed(1)}% {es ? "depreciado" : "depreciated"}
          </div>
        </div>
        <div style={{ height: "14px", borderRadius: "7px", background: "var(--color-border-faint)", overflow: "hidden", display: "flex" }}>
          <div style={{ height: "100%", width: `${Math.min(pctDepreciado, 100)}%`, background: pctDepreciado > 80 ? "var(--color-danger-text)" : pctDepreciado > 50 ? "var(--color-warning-text)" : "var(--color-brand-blue)", borderRadius: "7px", transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "var(--color-text-muted)" }}>
          <span>$0</span>
          <span style={{ color: "var(--color-danger-text)", fontWeight: 600 }}>Dep. acum: ${fmt0(s.total_accumulated_dep)}</span>
          <span>Costo: ${fmt0(s.total_cost)}</span>
        </div>
      </div>

      {/* Por tipo + Lista activos */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px" }}>

        {/* Por tipo */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
            {es ? "Por tipo de activo" : "By asset type"}
          </div>
          {Object.entries(s.by_type).map(([type, data]) => {
            const cfg = ASSET_TYPE_CONFIG[type as any];
            if (!cfg || data.count === 0) return null;
            const pct = s.total_book_value > 0 ? (data.book_value / s.total_book_value) * 100 : 0;
            return (
              <div key={type}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", color: "var(--color-text-second)" }}>{cfg.icon} {cfg.labelEs}</span>
                  <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{data.count}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ flex: 1, height: "5px", borderRadius: "3px", background: "var(--color-border-faint)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: "3px" }} />
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: cfg.color, fontVariantNumeric: "tabular-nums", minWidth: "70px", textAlign: "right" }}>
                    ${fmt0(data.book_value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lista activos */}
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "Activos activos" : "Active assets"} ({activeAssets.length})
            </div>
            <button onClick={onNew}
              style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
              {ac.nuevoActivo ?? "+ Nuevo activo"}
            </button>
          </div>
          {activeAssets.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏛️</div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-muted)" }}>{ac.sinActivos}</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>{ac.sinActivosDesc}</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 90px 80px", padding: "7px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <span>Activo</span>
                <span style={{ textAlign: "center" }}>Tipo</span>
                <span style={{ textAlign: "right" }}>Costo</span>
                <span style={{ textAlign: "right" }}>Valor libro</span>
                <span style={{ textAlign: "right" }}>Dep/mes</span>
                <span style={{ textAlign: "center" }}>Estado</span>
              </div>
              {activeAssets.slice(0, 10).map((a, i) => {
                const cfg = ASSET_TYPE_CONFIG[a.asset_type];
                const sc  = ASSET_STATUS_CONFIG[a.status];
                const pctDep = a.acquisition_cost > 0 ? (a.accumulated_depreciation / a.acquisition_cost) * 100 : 0;
                return (
                  <div key={a.id} onClick={() => onSelectAsset(a)}
                    style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 110px 90px 80px", padding: "10px 18px", borderBottom: i < activeAssets.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{a.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <div style={{ height: "4px", width: "80px", borderRadius: "2px", background: "var(--color-border-faint)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pctDep}%`, background: pctDep > 80 ? "var(--color-danger-text)" : "var(--color-brand-blue)" }} />
                        </div>
                        <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>{pctDep.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "14px" }}>{cfg.icon}</span>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                      {a.currency} ${fmt0(a.acquisition_cost)}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
                      {a.currency} ${fmt0(a.book_value)}
                    </div>
                    <div style={{ textAlign: "right", fontSize: "11px", color: "var(--color-warning-text)", fontVariantNumeric: "tabular-nums" }}>
                      ${fmt(a.monthly_depreciation)}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "var(--radius-full)", background: sc.bg, color: sc.color }}>
                        {sc.labelEs}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
