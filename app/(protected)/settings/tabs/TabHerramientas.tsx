"use client";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { supabase } from "@/lib/supabaseClient";

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

type ToolStatus = "idle" | "running" | "success" | "error";

type Tool = {
  id:       string;
  titleEs:  string;
  titleEn:  string;
  descEs:   string;
  descEn:   string;
  warningEs:string;
  warningEn:string;
  actionEs: string;
  actionEn: string;
  once:     boolean; // true = solo se usa al dar de alta la empresa
};

const TOOLS: Tool[] = [
  {
    id:       "sync_cxc",
    titleEs:  "Sincronizar facturas PPD a Cuentas por Cobrar",
    titleEn:  "Sync PPD invoices to Accounts Receivable",
    descEs:   "Crea automáticamente una cuenta por cobrar por cada factura de ingreso (PPD) ya emitida en el sistema. Las facturas nuevas se sincronizan en tiempo real — este proceso es solo para la migración inicial.",
    descEn:   "Automatically creates an accounts receivable record for each income invoice (PPD) already issued in the system. New invoices sync in real time — this process is for initial migration only.",
    warningEs:"Úsalo una sola vez al configurar la empresa. No genera duplicados si ya está sincronizado.",
    warningEn:"Use only once when setting up the company. Will not create duplicates if already synced.",
    actionEs: "Sincronizar CFDIs PPD → CxC",
    actionEn: "Sync PPD CFDIs → AR",
    once:     true,
  },
];

export default function TabHerramientas() {
  const { lang } = useTranslation();
  const { companyId } = useTenant();
  const es = lang !== "en";

  const [isAdmin,  setIsAdmin]  = useState(false);
  const [statuses, setStatuses] = useState<Record<string, ToolStatus>>({});
  const [results,  setResults]  = useState<Record<string, string>>({});

  useEffect(() => {
    if (!companyId) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("company_users")
        .select("role")
        .eq("company_id", companyId)
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => setIsAdmin(data?.role === "admin" || data?.role === "owner"));
    });
  }, [companyId]);

  async function runTool(toolId: string) {
    if (!companyId || !isAdmin) return;
    setStatuses(p => ({ ...p, [toolId]: "running" }));
    setResults(p => ({ ...p, [toolId]: "" }));

    try {
      if (toolId === "sync_cxc") {
        const res = await fetch("/api/cxc/sync", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ companyId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const n = data.synced ?? 0;
        setResults(p => ({
          ...p,
          [toolId]: es
            ? n > 0 ? `✓ ${n} factura(s) PPD sincronizadas exitosamente.` : `✓ Todo ya estaba sincronizado. Sin cambios.`
            : n > 0 ? `✓ ${n} PPD invoice(s) synced successfully.`         : `✓ Everything was already in sync. No changes.`,
        }));
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
          {es ? "Herramientas de administrador" : "Admin tools"}
        </div>
        <div style={{ padding: "20px 24px", borderRadius: "var(--radius-lg)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "13px", color: "var(--color-warning-text)", fontWeight: 600 }}>
          {es ? "Solo los administradores y propietarios pueden acceder a estas herramientas." : "Only administrators and owners can access these tools."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "20px" }}>
      <div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)" }}>
          {es ? "Herramientas de administrador" : "Admin tools"}
        </div>
        <div style={{ fontSize: "13px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          {es
            ? "Herramientas de configuración inicial y mantenimiento. Ejecuta cada una solo cuando sea necesario."
            : "Initial setup and maintenance tools. Run each one only when necessary."}
        </div>
      </div>

      {/* Banner informativo */}
      <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md)", background: "var(--color-info-bg)", border: "1px solid var(--color-info-border)", fontSize: "12px", color: "var(--color-info-text)", lineHeight: 1.6 }}>
        {es
          ? "Estas herramientas están diseñadas para el proceso de alta inicial de la empresa. Están protegidas para evitar duplicados, pero úsalas con cuidado."
          : "These tools are designed for the company's initial setup process. They are protected against duplicates, but use them carefully."}
      </div>

      {/* Lista de herramientas */}
      <Section
        title={es ? "Migración e integración de datos" : "Data migration & integration"}
        desc={es ? "Sincroniza datos existentes entre módulos del sistema." : "Sync existing data between system modules."}
      >
        {TOOLS.map((tool) => {
          const status  = statuses[tool.id] ?? "idle";
          const result  = results[tool.id] ?? "";
          const running = status === "running";

          return (
            <div key={tool.id} style={{ padding: "16px", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-faint)", display: "grid", gap: "10px" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {es ? tool.titleEs : tool.titleEn}
                    </div>
                    {tool.once && (
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)", background: "var(--color-info-bg)", color: "var(--color-brand-blue)", border: "1px solid var(--color-info-border)" }}>
                        {es ? "Configuración inicial" : "Initial setup"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                    {es ? tool.descEs : tool.descEn}
                  </div>
                </div>

                <button
                  onClick={() => runTool(tool.id)}
                  disabled={running}
                  style={{ height: "36px", padding: "0 18px", borderRadius: "var(--radius-md)", background: running ? "var(--color-bg-base)" : "var(--color-brand-blue)", color: running ? "var(--color-text-muted)" : "#fff", border: running ? "1px solid var(--color-border)" : "none", fontSize: "12px", fontWeight: 700, cursor: running ? "not-allowed" : "pointer", whiteSpace: "nowrap", flexShrink: 0, opacity: running ? 0.7 : 1 }}>
                  {running
                    ? (es ? "Ejecutando…" : "Running…")
                    : (es ? tool.actionEs : tool.actionEn)}
                </button>
              </div>

              {/* Advertencia */}
              <div style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", background: "var(--color-warning-bg)", border: "1px solid var(--color-warning-border)", fontSize: "11px", color: "var(--color-warning-text)", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                {es ? tool.warningEs : tool.warningEn}
              </div>

              {/* Resultado */}
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
