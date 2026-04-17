"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";
import { fetchCompanySettings, upsertCompanySettings } from "@/app/(protected)/comercial/cotizaciones/services/quotations.service";
import type { CompanySettings } from "@/app/(protected)/comercial/cotizaciones/types/quotations.types";

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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "5px", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{children}</div>
  );
}

function AreaDivider({ title, icon }: { title: string; icon: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0 4px" }}>
      <span style={{ fontSize: "18px" }}>{icon}</span>
      <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--color-text-primary)" }}>{title}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--color-border-faint)" }} />
    </div>
  );
}

// ── Términos por defecto ──────────────────────────────────────
const DEFAULT_TERMS_ES = `TÉRMINOS Y CONDICIONES — SERVICIOS LOGÍSTICOS
Los precios no incluyen I.V.A. (16%) salvo indicación expresa. Cotización válida únicamente para los conceptos, rutas y especificaciones indicadas. Los tiempos de tránsito son aproximados. Seguro de mercancía por cuenta del cliente. Condiciones de pago: las pactadas con el cliente.`;

const DEFAULT_TERMS_PRODUCTS_ES = `TÉRMINOS Y CONDICIONES — PRODUCTOS
Los precios no incluyen I.V.A. (16%) salvo indicación expresa. Tiempos de entrega aproximados. Flete no incluido salvo indicación expresa. Riesgos de pérdida o daño se transfieren al comprador en el momento de la entrega. Condiciones de pago: las pactadas con el cliente.`;

const VARIABLES = [
  { var: "{AÑO}",     desc: "Año actual (ej: 2026)" },
  { var: "{MES}",     desc: "Mes actual (ej: 04)" },
  { var: "{NUM}",     desc: "Consecutivo (ej: 0001)" },
  { var: "{CLIENTE}", desc: "3 letras del cliente" },
  { var: "{TIPO}",    desc: "L=Logística, P=Productos" },
];

type ToolStatus = "idle" | "running" | "success" | "error";

export default function TabHerramientas() {
  const { lang }      = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [isAdmin,   setIsAdmin]   = useState(false);

  // ── Estado cotizaciones ────────────────────────────────────
  const [cotForm,    setCotForm]    = useState<Partial<CompanySettings>>({
    quote_number_format:  "COT-{AÑO}-{NUM}",
    quote_number_counter: 1,
    quote_validity_days:  15,
    margin_minimum_pct:   20,
    quote_terms_services: "",
    quote_terms_products: "",
  });
  const [cotSaving,  setCotSaving]  = useState(false);
  const [cotSaved,   setCotSaved]   = useState(false);
  const [cotError,   setCotError]   = useState<string | null>(null);
  const [termsTab,   setTermsTab]   = useState<"services" | "products">("services");

  // ── Estado objetivos ───────────────────────────────────────
  const [goal,        setGoal]        = useState("");
  const [goalCurrency,setGoalCurrency] = useState("MXN");
  const [goalMetric,  setGoalMetric]   = useState("invoices");
  const [goalSaving,  setGoalSaving]  = useState(false);
  const [goalSaved,   setGoalSaved]   = useState(false);
  const [goalError,   setGoalError]   = useState<string | null>(null);

  // ── Estado herramientas ────────────────────────────────────
  const [statuses, setStatuses] = useState<Record<string, ToolStatus>>({});
  const [results,  setResults]  = useState<Record<string, string>>({});

  useEffect(() => {
    if (!companyId) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("company_users").select("role").eq("company_id", companyId).eq("user_id", user.id).single()
        .then(({ data }) => setIsAdmin(data?.role === "admin" || data?.role === "owner"));
    });
    fetchCompanySettings(companyId).then((s) => {
      if (s) {
        setCotForm(prev => ({
          ...prev, ...s,
          quote_terms_services: s.quote_terms_services || DEFAULT_TERMS_ES,
          quote_terms_products: s.quote_terms_products || DEFAULT_TERMS_PRODUCTS_ES,
        }));
        setGoal(String(s.monthly_goal ?? ""));
        setGoalCurrency(s.goal_currency ?? "MXN");
        setGoalMetric((s as any).monthly_goal_metric ?? "invoices");
      }
    });
  }, [companyId]);

  function setCot(k: keyof CompanySettings, v: any) {
    setCotForm(p => ({ ...p, [k]: v }));
  }

  const previewNumber = () => {
    const now = new Date();
    return (cotForm.quote_number_format ?? "COT-{AÑO}-{NUM}")
      .replace("{AÑO}",    String(now.getFullYear()))
      .replace("{MES}",    String(now.getMonth() + 1).padStart(2, "0"))
      .replace("{NUM}",    String(cotForm.quote_number_counter ?? 1).padStart(4, "0"))
      .replace("{CLIENTE}","MOB")
      .replace("{TIPO}",   "L");
  };

  async function handleSaveCot() {
    if (!companyId) return;
    setCotSaving(true); setCotError(null);
    try {
      await upsertCompanySettings(companyId, cotForm);
      setCotSaved(true); setTimeout(() => setCotSaved(false), 2000);
    } catch (e: any) { setCotError(e.message); }
    finally { setCotSaving(false); }
  }

  async function handleSaveGoal() {
    if (!companyId) return;
    setGoalSaving(true); setGoalError(null);
    try {
      await upsertCompanySettings(companyId, {
        monthly_goal:        Number(goal) || 0,
        goal_currency:       goalCurrency,
        monthly_goal_metric: goalMetric,
      });
      setGoalSaved(true); setTimeout(() => setGoalSaved(false), 2000);
    } catch (e: any) { setGoalError(e.message); }
    finally { setGoalSaving(false); }
  }

  async function runTool(toolId: string) {
    if (!companyId || !isAdmin) return;
    setStatuses(p => ({ ...p, [toolId]: "running" }));
    setResults(p => ({ ...p, [toolId]: "" }));
    try {
      if (toolId === "sync_cxc") {
        const res  = await fetch("/api/cxc/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const n = data.synced ?? 0;
        setResults(p => ({ ...p, [toolId]: n > 0 ? `✓ ${n} factura(s) PPD sincronizadas.` : `✓ Todo ya estaba sincronizado.` }));
        setStatuses(p => ({ ...p, [toolId]: "success" }));
      }
    } catch (e: any) {
      setResults(p => ({ ...p, [toolId]: `✗ ${e.message}` }));
      setStatuses(p => ({ ...p, [toolId]: "error" }));
    }
  }

  if (!isAdmin) {
    return (
      <div style={{ display: "grid", gap: "20px" }}>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
          {es ? "Herramientas" : "Tools"}
        </div>
        <div style={{ padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "13px", color: "var(--color-warning-text)", fontWeight: 600 }}>
          {es ? "Solo los administradores y propietarios pueden acceder a esta sección." : "Only administrators and owners can access this section."}
        </div>
      </div>
    );
  }

  const goalNum = Number(goal) || 0;

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {es ? "Herramientas & Configuración" : "Tools & Configuration"}
      </div>

      {/* ══ COTIZACIONES ══════════════════════════════════════ */}
      <AreaDivider title="Cotizaciones" icon="📋" />

      {/* Numeración */}
      <Section title="Formato de numeración" desc="Define cómo se generan los números de cotización.">
        <div>
          <FieldLabel>Formato</FieldLabel>
          <input value={cotForm.quote_number_format ?? ""} onChange={(e) => setCot("quote_number_format", e.target.value)} placeholder="COT-{AÑO}-{NUM}" style={INPUT} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {VARIABLES.map((v) => (
            <button key={v.var} onClick={() => setCot("quote_number_format", (cotForm.quote_number_format ?? "") + v.var)} title={v.desc}
              style={{ height: "26px", padding: "0 10px", borderRadius: "var(--radius-md)", background: "var(--color-bg-subtle)", border: "1px solid var(--color-border)", color: "var(--color-text-second)", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
              {v.var}
            </button>
          ))}
        </div>
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)" }}>
          <div style={{ fontSize: "11px", color: "var(--color-info-text)", marginBottom: "3px" }}>Vista previa:</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--color-brand-blue)", fontVariantNumeric: "tabular-nums" }}>{previewNumber()}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <FieldLabel>Próximo número</FieldLabel>
            <input type="number" value={cotForm.quote_number_counter ?? 1} onChange={(e) => setCot("quote_number_counter", Number(e.target.value))} min="1" style={INPUT} />
          </div>
          <div>
            <FieldLabel>Vigencia por defecto (días)</FieldLabel>
            <input type="number" value={cotForm.quote_validity_days ?? 15} onChange={(e) => setCot("quote_validity_days", Number(e.target.value))} min="1" style={INPUT} />
          </div>
        </div>
      </Section>

      {/* Margen mínimo */}
      <Section title="Margen mínimo" desc="El sistema alerta si el margen de ganancia es menor a este porcentaje.">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input type="number" value={cotForm.margin_minimum_pct ?? 20} onChange={(e) => setCot("margin_minimum_pct", Number(e.target.value))} min="0" max="100" style={{ ...INPUT, width: "100px" }} />
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>% de margen mínimo</span>
        </div>
      </Section>

      {/* Términos */}
      <Section title="Términos y condiciones por defecto" desc="Se auto-rellenan al crear cotizaciones según el tipo seleccionado.">
        <div style={{ display: "flex", gap: "3px", background: "var(--color-bg-subtle)", padding: "3px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", alignSelf: "start" }}>
          {([
            { key: "services" as const, label: "Servicios logísticos", icon: "🚛" },
            { key: "products" as const, label: "Productos",            icon: "📦" },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setTermsTab(tab.key)}
              style={{ height: "30px", padding: "0 14px", borderRadius: "var(--radius-sm)", background: termsTab === tab.key ? "var(--color-bg-base)" : "transparent", border: termsTab === tab.key ? "1px solid var(--color-border)" : "1px solid transparent", color: termsTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-muted)", fontSize: "12px", fontWeight: termsTab === tab.key ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <textarea key={termsTab} rows={14}
          value={termsTab === "services" ? (cotForm.quote_terms_services ?? "") : (cotForm.quote_terms_products ?? "")}
          onChange={(e) => setCot(termsTab === "services" ? "quote_terms_services" : "quote_terms_products", e.target.value)}
          style={{ ...INPUT, height: "auto", padding: "12px", resize: "vertical", fontFamily: "monospace", fontSize: "11px", lineHeight: 1.6 }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setCot(termsTab === "services" ? "quote_terms_services" : "quote_terms_products", termsTab === "services" ? DEFAULT_TERMS_ES : DEFAULT_TERMS_PRODUCTS_ES)}
            style={{ height: "28px", padding: "0 12px", borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "11px", cursor: "pointer" }}>
            ↺ Restaurar por defecto
          </button>
        </div>
      </Section>

      {/* Numeración CFDI */}
      <Section title="Numeración de documentos fiscales" desc="Serie y folio inicial para cada tipo de CFDI. Solo admin puede modificar.">
        {!isAdmin && (
          <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)" }}>
            Solo administradores y propietarios pueden modificar la numeración.
          </div>
        )}
        <div style={{ display: "grid", gap: "10px" }}>
          {([
            { key: "ingreso",   label: "Facturas de Ingreso (Tipo I)",    seriesKey: "invoice_series",  folioKey: "invoice_next_folio",  color: "var(--color-success-text)", bg: "var(--color-success-bg)", defS: "A"  },
            { key: "egreso",    label: "Notas de Crédito (Tipo E)",       seriesKey: "egreso_series",   folioKey: "egreso_next_folio",   color: "var(--color-warning-text)", bg: "var(--color-warning-bg)", defS: "E"  },
            { key: "pago",      label: "Complementos de Pago (Tipo P)",   seriesKey: "pago_series",     folioKey: "pago_next_folio",     color: "var(--color-brand-blue)",   bg: "var(--color-info-bg)",    defS: "P"  },
            { key: "traslado",  label: "Traslados (Tipo T)",               seriesKey: "traslado_series", folioKey: "traslado_next_folio", color: "var(--color-text-second)",  bg: "var(--color-bg-subtle)",  defS: "T"  },
            { key: "nomina",    label: "Nómina (Tipo N)",                  seriesKey: "nomina_series",   folioKey: "nomina_next_folio",   color: "#7c3aed",                   bg: "#ede9fe",                 defS: "N"  },
            { key: "notas",     label: "Notas sin valor fiscal",           seriesKey: "note_series",     folioKey: "note_next_folio",     color: "var(--color-text-muted)",   bg: "var(--color-bg-subtle)",  defS: "NR" },
          ] as const).map((item) => (
            <div key={item.key} style={{ display: "grid", gridTemplateColumns: "1fr 90px 130px 120px", gap: "10px", alignItems: "center", padding: "12px 14px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)" }}>{item.label}</div>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--radius-full)", background: item.bg, color: item.color, textAlign: "center" }}>
                {item.key === "ingreso" ? "Tipo I" : item.key === "egreso" ? "Tipo E" : item.key === "pago" ? "Tipo P" : item.key === "traslado" ? "Tipo T" : item.key === "nomina" ? "Tipo N" : "No fiscal"}
              </span>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" as const }}>Serie</div>
                <input disabled={!isAdmin}
                  value={String((cotForm as any)[item.seriesKey] ?? item.defS)}
                  onChange={(e) => isAdmin && setCot(item.seriesKey as any, e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
                  maxLength={10} style={{ ...INPUT, height: "32px", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, opacity: isAdmin ? 1 : 0.5 }} />
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 600, color: "var(--color-text-muted)", marginBottom: "4px", textTransform: "uppercase" as const }}>Próximo folio</div>
                <input type="number" min="1" disabled={!isAdmin}
                  value={Number((cotForm as any)[item.folioKey] ?? 1)}
                  onChange={(e) => isAdmin && setCot(item.folioKey as any, Number(e.target.value))}
                  style={{ ...INPUT, height: "32px", fontSize: "12px", opacity: isAdmin ? 1 : 0.5 }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "12px", color: "var(--color-warning-text)", lineHeight: 1.6 }}>
          El folio se incrementa automáticamente con cada documento timbrado. Ajusta el número si tienes documentos previos en otro sistema.
        </div>
      </Section>

      {cotError && <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "13px" }}>{cotError}</div>}
      <div>
        <button onClick={handleSaveCot} disabled={cotSaving}
          style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: cotSaved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
          {cotSaving ? "Guardando…" : cotSaved ? "✓ Guardado" : "Guardar configuración de cotizaciones"}
        </button>
      </div>

      {/* ══ OBJETIVOS ══════════════════════════════════════════ */}
      <AreaDivider title="Objetivos del negocio" icon="🎯" />

      <Section title="Meta mensual de ventas" desc="Aparece en el Dashboard como indicador de progreso mensual.">
        <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
          El sistema compara el avance real del mes vs. la meta configurada. Visible para admin y manager.
        </div>

        {/* Tipo de métrica */}
        <div>
          <FieldLabel>¿Qué quieres medir?</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {[
              { value: "invoices",    icon: "🧾", label: "Facturas emitidas",    desc: "Cantidad de CFDIs válidos" },
              { value: "amount_mxn",  icon: "💰", label: "Monto facturado MXN",  desc: "Suma del mes en MXN" },
              { value: "amount_usd",  icon: "💵", label: "Monto facturado USD",  desc: "Suma del mes en USD" },
              { value: "quotations",  icon: "📋", label: "Cotizaciones enviadas", desc: "Cotizaciones del mes" },
              { value: "shipments",   icon: "🚛", label: "Embarques completados", desc: "Servicios entregados" },
              { value: "prospects",   icon: "👥", label: "Prospectos convertidos", desc: "Conversiones del mes" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGoalMetric(opt.value)}
                style={{
                  padding: "10px 12px", borderRadius: "var(--radius-md)", textAlign: "left",
                  background: goalMetric === opt.value ? "var(--color-brand-blue-light)" : "var(--color-bg-subtle)",
                  border: `1px solid ${goalMetric === opt.value ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "16px", marginBottom: "3px" }}>{opt.icon}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: goalMetric === opt.value ? "var(--color-brand-blue)" : "var(--color-text-primary)" }}>{opt.label}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "1px" }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Meta numérica */}
        <div style={{ display: "grid", gridTemplateColumns: goalMetric.startsWith("amount") ? "1fr 120px" : "1fr", gap: "12px" }}>
          <div>
            <FieldLabel>
              {goalMetric === "invoices"   ? "Cantidad objetivo de facturas" :
               goalMetric === "amount_mxn" ? "Monto objetivo mensual (MXN)"  :
               goalMetric === "amount_usd" ? "Monto objetivo mensual (USD)"  :
               goalMetric === "quotations" ? "Cantidad objetivo de cotizaciones" :
               goalMetric === "shipments"  ? "Cantidad objetivo de embarques"    :
               "Cantidad objetivo de conversiones"}
            </FieldLabel>
            <input
              type="number" value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={goalMetric.startsWith("amount") ? "500000" : "50"}
              min="0" style={INPUT}
            />
          </div>
          {goalMetric.startsWith("amount") && (
            <div>
              <FieldLabel>Moneda</FieldLabel>
              <select value={goalCurrency} onChange={(e) => setGoalCurrency(e.target.value)} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          )}
        </div>

        {goalNum > 0 && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-success-bg)", border: "1px solid var(--color-success-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: "var(--color-success-text)", fontWeight: 700, marginBottom: "2px" }}>META MENSUAL CONFIGURADA</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Aparecerá en el Dashboard como barra de progreso</div>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--color-success-text)", fontVariantNumeric: "tabular-nums" }}>
              {goalMetric.startsWith("amount") ? `${goalCurrency} $${Number(goal).toLocaleString("es-MX")}` : `${Number(goal).toLocaleString("es-MX")} ${goalMetric === "invoices" ? "facturas" : goalMetric === "quotations" ? "cotizaciones" : goalMetric === "shipments" ? "embarques" : "conversiones"}`}
            </div>
          </div>
        )}

        {goalError && <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)", color: "var(--color-danger-text)", fontSize: "12px" }}>{goalError}</div>}
        <div>
          <button onClick={handleSaveGoal} disabled={goalSaving}
            style={{ height: "40px", padding: "0 28px", borderRadius: "var(--radius-md)", background: goalSaved ? "var(--color-success-text)" : "var(--color-brand-blue)", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            {goalSaving ? "Guardando…" : goalSaved ? "✓ Guardado" : "Guardar meta"}
          </button>
        </div>
      </Section>

      {/* ══ HERRAMIENTAS ADMIN ═════════════════════════════════ */}
      <AreaDivider title="Herramientas de administrador" icon="🔧" />

      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
        {es ? "Herramientas de configuración inicial y mantenimiento. Ejecuta cada una solo cuando sea necesario." : "Initial setup and maintenance tools. Run each one only when necessary."}
      </div>

      <Section title={es ? "Migración e integración de datos" : "Data migration & integration"} desc={es ? "Sincroniza datos existentes entre módulos del sistema." : "Sync existing data between system modules."}>
        {[{
          id: "sync_cxc",
          titleEs: "Sincronizar facturas PPD a Cuentas por Cobrar",
          descEs: "Crea automáticamente una cuenta por cobrar por cada factura PPD ya emitida. Las facturas nuevas se sincronizan en tiempo real — este proceso es solo para la migración inicial.",
          warningEs: "Úsalo una sola vez al configurar la empresa. No genera duplicados si ya está sincronizado.",
          actionEs: "Sincronizar CFDIs PPD → CxC",
        }].map((tool) => {
          const status  = statuses[tool.id] ?? "idle";
          const result  = results[tool.id]  ?? "";
          const running = status === "running";
          return (
            <div key={tool.id} style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>{tool.titleEs}</div>
                    <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)" }}>
                      Configuración inicial
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>{tool.descEs}</div>
                </div>
                <button onClick={() => runTool(tool.id)} disabled={running}
                  style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: running ? "var(--color-bg-base)" : "var(--color-brand-blue)", color: running ? "var(--color-text-muted)" : "#fff", border: running ? "1px solid var(--color-border)" : "none", fontSize: "12px", fontWeight: 700, cursor: running ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0, opacity: running ? 0.7 : 1 }}>
                  {running ? "Ejecutando…" : tool.actionEs}
                </button>
              </div>
              <div style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {tool.warningEs}
              </div>
              {result && (
                <div style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: status === "success" ? "var(--color-success-bg)" : "var(--color-danger-bg)", border: `1px solid ${status === "success" ? "var(--color-success-border)" : "var(--color-danger-border)"}`, fontSize: "12px", fontWeight: 600, color: status === "success" ? "var(--color-success-text)" : "var(--color-danger-text)" }}>
                  {result}
                </div>
              )}
            </div>
          );
        })}
      </Section>
    </div>
  );
}
