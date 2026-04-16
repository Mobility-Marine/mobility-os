"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { AssetDisposal, FixedAsset, DisposalType } from "../types/activos.types";
import { ASSET_TYPE_CONFIG } from "../types/activos.types";

type Props = {
  disposals:     AssetDisposal[];
  assets:        FixedAsset[];
  saving:        boolean;
  onDispose:     (payload: any) => Promise<void>;
};

const fmt = (n: number) => Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 });

const DISPOSAL_CONFIG: Record<DisposalType, { label: string; icon: string; color: string }> = {
  sale:     { label: "Venta",           icon: "💰", color: "var(--color-success-text)" },
  scrap:    { label: "Desecho",         icon: "🗑️", color: "var(--color-text-muted)"  },
  donation: { label: "Donación",        icon: "🎁", color: "#8b5cf6"                  },
  transfer: { label: "Transferencia",   icon: "🔄", color: "var(--color-brand-blue)"  },
  loss:     { label: "Pérdida/Siniestro",icon: "🔥", color: "var(--color-danger-text)" },
};

const INPUT: React.CSSProperties = {
  width: "100%", height: "34px", padding: "0 10px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "12px", outline: "none", boxSizing: "border-box",
};

export default function ActivosBajas({ disposals, assets, saving, onDispose }: Props) {
  const { lang, t } = useTranslation();
  const es = lang !== "en";
  const ac = (t as any).activos ?? {};

  const [showForm,  setShowForm]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [form, setForm] = useState({
    asset_id:      "",
    disposal_date: new Date().toISOString().split("T")[0],
    disposal_type: "sale" as DisposalType,
    sale_amount:   "0",
    notes:         "",
  });

  const activeAssets = assets.filter(a => a.status === "active" || a.status === "fully_depreciated");
  const selectedAsset = activeAssets.find(a => a.id === form.asset_id);
  const gainLoss = selectedAsset ? parseFloat(form.sale_amount) - selectedAsset.book_value : 0;

  async function handleSubmit() {
    if (!form.asset_id)     { setError(es ? "Selecciona un activo" : "Select an asset"); return; }
    if (!selectedAsset)     return;
    setError(null);
    try {
      await onDispose({
        asset_id:      form.asset_id,
        disposal_date: form.disposal_date,
        disposal_type: form.disposal_type,
        sale_amount:   parseFloat(form.sale_amount) || 0,
        book_value:    selectedAsset.book_value,
        notes:         form.notes || undefined,
      });
      setShowForm(false);
      setForm({ asset_id: "", disposal_date: new Date().toISOString().split("T")[0], disposal_type: "sale", sale_amount: "0", notes: "" });
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Botón nueva baja */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setShowForm(v => !v)}
          style={{ height: "34px", padding: "0 16px", borderRadius: "var(--radius-md)", background: showForm ? "var(--color-bg-subtle)" : "var(--color-danger-text)", color: showForm ? "var(--color-text-muted)" : "#fff", border: showForm ? "1px solid var(--color-border)" : "none", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
          {showForm ? (es ? "Cancelar" : "Cancel") : (ac.darDeBaja ?? "Dar de baja activo")}
        </button>
      </div>

      {/* Formulario baja */}
      {showForm && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-danger-border)", borderRadius: "var(--radius-lg)", padding: "20px", display: "grid", gap: "12px" }}>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-danger-text)" }}>
            📤 {ac.darDeBaja ?? "Dar de baja activo fijo"}
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>{error}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Activo a dar de baja" : "Asset to dispose"} *</div>
              <select value={form.asset_id} onChange={e => setForm(p => ({ ...p, asset_id: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="">— Seleccionar activo —</option>
                {activeAssets.map(a => {
                  const cfg = ASSET_TYPE_CONFIG[a.asset_type];
                  return <option key={a.id} value={a.id}>{cfg.icon} {a.name} — Valor libro: ${fmt(a.book_value)}</option>;
                })}
              </select>
            </div>

            {/* Info del activo seleccionado */}
            {selectedAsset && (
              <div style={{ gridColumn: "1 / -1", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[
                  { l: es ? "Costo original" : "Original cost", v: `${selectedAsset.currency} $${fmt(selectedAsset.acquisition_cost)}` },
                  { l: es ? "Dep. acumulada" : "Accum. depreciation", v: `$${fmt(selectedAsset.accumulated_depreciation)}` },
                  { l: es ? "Valor en libros" : "Book value", v: `$${fmt(selectedAsset.book_value)}`, bold: true },
                ].map(r => (
                  <div key={r.l}>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "2px" }}>{r.l}</div>
                    <div style={{ fontSize: "13px", fontWeight: (r as any).bold ? 900 : 600, color: (r as any).bold ? "var(--color-brand-blue)" : "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{r.v}</div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{ac.tiposBaja ?? "Tipo de baja"} *</div>
              <select value={form.disposal_type} onChange={e => setForm(p => ({ ...p, disposal_type: e.target.value as DisposalType }))} style={{ ...INPUT, cursor: "pointer" }}>
                {(Object.entries(DISPOSAL_CONFIG) as [DisposalType, any][]).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{es ? "Fecha de baja" : "Disposal date"} *</div>
              <input type="date" value={form.disposal_date} onChange={e => setForm(p => ({ ...p, disposal_date: e.target.value }))} style={INPUT} />
            </div>

            <div>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>{ac.montoVenta ?? "Monto de venta"}</div>
              <input type="number" min="0" value={form.sale_amount} onChange={e => setForm(p => ({ ...p, sale_amount: e.target.value }))} style={INPUT} />
            </div>

            {selectedAsset && (
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: gainLoss >= 0 ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: `1px solid ${gainLoss >= 0 ? "var(--color-success-border)" : "var(--color-danger-border)"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: gainLoss >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
                  {ac.gananciaPerdia ?? "Ganancia / Pérdida"}
                </span>
                <span style={{ fontSize: "16px", fontWeight: 900, color: gainLoss >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                  {gainLoss >= 0 ? "+" : "−"}${fmt(Math.abs(gainLoss))}
                </span>
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notas</div>
              <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...INPUT, height: "auto", padding: "8px 10px", resize: "vertical" }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSubmit} disabled={saving || !form.asset_id}
              style={{ height: "36px", padding: "0 20px", borderRadius: "var(--radius-md)", background: "var(--color-danger-text)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: !form.asset_id ? 0.5 : 1 }}>
              {saving ? (es ? "Procesando…" : "Processing…") : (es ? "✓ Confirmar baja" : "✓ Confirm disposal")}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ height: "36px", padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)", color: "var(--color-text-muted)", fontSize: "12px", cursor: "pointer" }}>
              {es ? "Cancelar" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* Historial de bajas */}
      {disposals.length > 0 && (
        <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--color-border-faint)", background: "var(--color-bg-subtle)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {es ? "Historial de bajas" : "Disposal history"} ({disposals.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 120px 110px 110px", padding: "7px 18px", background: "var(--color-bg-subtle)", borderBottom: "1px solid var(--color-border-faint)", fontSize: "9px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            <span>{es ? "Activo" : "Asset"}</span>
            <span>Tipo</span>
            <span>Fecha</span>
            <span style={{ textAlign: "right" }}>Valor libro</span>
            <span style={{ textAlign: "right" }}>Venta</span>
            <span style={{ textAlign: "right" }}>Gan./Pérd.</span>
          </div>
          {disposals.map((d, i) => {
            const dc  = DISPOSAL_CONFIG[d.disposal_type];
            const cfg = d.asset ? ASSET_TYPE_CONFIG[d.asset.asset_type] : null;
            return (
              <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 120px 110px 110px", padding: "10px 18px", borderBottom: i < disposals.length - 1 ? "1px solid var(--color-border-faint)" : "none", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {cfg?.icon} {d.asset?.name ?? "—"}
                </div>
                <div style={{ fontSize: "10px", color: dc.color }}>{dc.icon} {dc.label}</div>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  {new Date(d.disposal_date).toLocaleDateString("es-MX")}
                </div>
                <div style={{ textAlign: "right", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>${fmt(d.book_value_at_disposal)}</div>
                <div style={{ textAlign: "right", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>{d.sale_amount > 0 ? `$${fmt(d.sale_amount)}` : "—"}</div>
                <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 700, color: d.gain_loss >= 0 ? "var(--color-success-text)" : "var(--color-danger-text)", fontVariantNumeric: "tabular-nums" }}>
                  {d.gain_loss >= 0 ? "+" : "−"}${fmt(Math.abs(d.gain_loss))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
