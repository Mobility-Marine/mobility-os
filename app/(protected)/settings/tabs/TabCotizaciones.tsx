"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { fetchCompanySettings, upsertCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import type { CompanySettings, QuotationTemplate } from "@/app/(protected)/comercial/cotizaciones/types/quotations.types";

const INPUT: React.CSSProperties = {
  width: "100%", height: "38px", padding: "0 12px",
  borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)", color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--color-bg-base)", border: "1px solid var(--color-border-faint)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "grid", gap: "14px" }}>
      <div style={{ paddingBottom: "10px", borderBottom: "1px solid var(--color-border-faint)" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</div>
        {desc && <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "3px" }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

const VARIABLES = [
  { var: "{AÑO}",    desc: "Año actual (ej: 2026)" },
  { var: "{MES}",    desc: "Mes actual (ej: 04)" },
  { var: "{NUM}",    desc: "Consecutivo (ej: 0001)" },
  { var: "{CLIENTE}",desc: "3 letras del cliente (ej: MOB)" },
  { var: "{TIPO}",   desc: "L=Logística, P=Productos" },
];

export default function TabCotizaciones() {
  const { t }         = useTranslation();
  const { companyId } = useTenant();

  const [form,   setForm]   = useState<Partial<CompanySettings>>({
    quote_number_format:  "COT-{AÑO}-{NUM}",
    quote_number_counter: 1,
    quote_validity_days:  15,
    margin_minimum_pct:   20,
    template_products:    "elegante",
    template_services:    "elegante",
    quote_terms:          "",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    fetchCompanySettings(companyId).then((s) => { if (s) setForm((p) => ({ ...p, ...s })); });
  }, [companyId]);

  function set(k: keyof CompanySettings, v: any) { setForm((p) => ({ ...p, [k]: v })); }

  // Preview del consecutivo
  const previewNumber = () => {
    const now     = new Date();
    const preview = (form.quote_number_format ?? "COT-{AÑO}-{NUM}")
      .replace("{AÑO}",    String(now.getFullYear()))
      .replace("{MES}",    String(now.getMonth() + 1).padStart(2, "0"))
      .replace("{NUM}",    String(form.quote_number_counter ?? 1).padStart(4, "0"))
      .replace("{CLIENTE}","MOB")
      .replace("{TIPO}",   "L");
    return preview;
  };

  async function handleSave() {
    if (!companyId) return;
    setSaving(true); setError(null);
    try {
      await upsertCompanySettings(companyId, form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {(t.settings as any)?.tabCotizaciones ?? "Configuración de cotizaciones"}
      </div>

      {/* CONSECUTIVO */}
      <Section
        title={(t.settings as any)?.consecutivoTitle ?? "Formato de numeración"}
        desc={(t.settings as any)?.consecutivoDesc ?? "Define cómo se generan los números de cotización."}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Formato
          </div>
          <input
            value={form.quote_number_format ?? ""}
            onChange={(e) => set("quote_number_format", e.target.value)}
            placeholder="COT-{AÑO}-{NUM}"
            style={INPUT}
          />
        </div>

        {/* Variables disponibles */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {VARIABLES.map((v) => (
            <button key={v.var} onClick={() => set("quote_number_format", (form.quote_number_format ?? "") + v.var)} title={v.desc} style={{
              height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)",
              color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer",
            }}>
              {v.var}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)" }}>
          <div style={{ fontSize: "11px", color: "var(--color-info-text)", marginBottom: "3px" }}>Vista previa:</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>
            {previewNumber()}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Próximo número
            </div>
            <input
              type="number"
              value={form.quote_number_counter ?? 1}
              onChange={(e) => set("quote_number_counter", Number(e.target.value))}
              min="1"
              style={INPUT}
            />
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Vigencia por defecto (días)
            </div>
            <input
              type="number"
              value={form.quote_validity_days ?? 15}
              onChange={(e) => set("quote_validity_days", Number(e.target.value))}
              min="1"
              style={INPUT}
            />
          </div>
        </div>
      </Section>

      {/* PLANTILLAS */}
      <Section
        title={(t.settings as any)?.templatesTitle ?? "Plantillas por defecto"}
        desc={(t.settings as any)?.templatesDesc ?? "Plantilla que se pre-selecciona al crear una nueva cotización."}
      >
        {(["products", "services"] as const).map((type) => {
          const key    = type === "products" ? "template_products" : "template_services";
          const label  = type === "products" ? "Cotización de productos" : "Cotización de servicios";
          return (
            <div key={type}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {(["elegante", "moderna", "corporativa"] as QuotationTemplate[]).map((tpl) => (
                  <button key={tpl} onClick={() => set(key, tpl)} style={{
                    padding: "12px 8px", borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "center",
                    background: (form as any)[key] === tpl ? "var(--color-info-bg)" : "var(--color-bg-subtle)",
                    border: `2px solid ${(form as any)[key] === tpl ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                  }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>
                      {tpl === "elegante" ? "✦" : tpl === "moderna" ? "◇" : "▣"}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: (form as any)[key] === tpl ? "var(--color-brand-blue)" : "var(--color-text-primary)", textTransform: "capitalize" }}>
                      {tpl}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {/* MARGEN MÍNIMO */}
      <Section
        title={(t.settings as any)?.marginTitle ?? "Margen mínimo"}
        desc={(t.settings as any)?.marginDesc ?? "El sistema alerta si el margen de ganancia es menor a este porcentaje."}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="number"
            value={form.margin_minimum_pct ?? 20}
            onChange={(e) => set("margin_minimum_pct", Number(e.target.value))}
            min="0" max="100"
            style={{ ...INPUT, width: "100px" }}
          />
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>% de margen mínimo</span>
        </div>
      </Section>

      {/* TÉRMINOS POR DEFECTO */}
      <Section
        title={(t.settings as any)?.defaultTermsTitle ?? "Términos y condiciones por defecto"}
        desc={(t.settings as any)?.defaultTermsDesc ?? "Se auto-rellena en nuevas cotizaciones."}
      >
        <textarea
          rows={4}
          value={form.quote_terms ?? ""}
          onChange={(e) => set("quote_terms", e.target.value)}
          placeholder="Precios sujetos a cambio sin previo aviso. Vigencia de la cotización según fecha indicada. Impuestos aplicables según legislación vigente."
          style={{ ...INPUT, height: "auto", padding: "10px 12px", resize: "vertical" }}
        />
      </Section>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>
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
  );
}
