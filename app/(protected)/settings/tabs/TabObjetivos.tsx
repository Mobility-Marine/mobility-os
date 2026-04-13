"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchCompanySettings, upsertCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

export default function TabObjetivos() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();

  const [goal,    setGoal]    = useState("");
  const [currency,setCurrency]= useState("MXN");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => {
      if (s) {
        setGoal(String(s.monthly_goal ?? ""));
        setCurrency(s.goal_currency ?? "MXN");
      }
    });
  }, [companyId]);

  async function handleSave() {
    if (!companyId) return;
    setSaving(true);
    try {
      await upsertCompanySettings(companyId, {
        monthly_goal:  Number(goal) || 0,
        goal_currency: currency,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  const goalNum = Number(goal) || 0;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabObjetivos ?? "Objetivos del negocio"}
      </div>

      <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)", paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
          {(t.settings as any)?.monthlyGoalTitle ?? "Meta mensual de ventas"}
        </div>

        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          Esta meta aparece en el Dashboard como indicador de progreso mensual.
          El sistema compara las cotizaciones aceptadas vs. la meta establecida.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Monto objetivo mensual
            </div>
            <input
              type="number"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="500000"
              min="0"
              style={INPUT}
            />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Moneda
            </div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {goalNum > 0 && (
          <div style={{ padding: "16px 20px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--color-success-text)", fontWeight: 600, marginBottom: "3px" }}>META MENSUAL CONFIGURADA</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Aparecerá en el Dashboard como indicador de progreso</div>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {currency} ${goalNum.toLocaleString("es-MX")}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>
            {error}
          </div>
        )}

        <div>
          <button onClick={handleSave} disabled={saving} style={{
            height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)",
            background: saved ? "var(--color-success-text)" : "var(--color-brand-blue)",
            color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}>
            {saving ? t.general.loading : saved ? "✓ Guardado" : t.general.save}
          </button>
        </div>
      </div>
    </div>
  );
}
