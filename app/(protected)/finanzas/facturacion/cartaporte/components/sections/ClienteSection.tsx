"use client";

// ═══════════════════════════════════════════════════════════════════════
// ClienteSection — Datos fiscales del receptor del CFDI
// Estilos: inline + CSS variables (consistente con el resto del proyecto)
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import type { CFDIClienteData, CFDIBaseData } from "../../types/carta_porte.types";

const REGIMEN_FISCAL: { code: string; label: string }[] = [
  { code: "601", label: "601 — General de Ley Personas Morales" },
  { code: "603", label: "603 — Personas Morales con Fines no Lucrativos" },
  { code: "605", label: "605 — Sueldos y Salarios" },
  { code: "606", label: "606 — Arrendamiento" },
  { code: "612", label: "612 — Personas Físicas con Actividades Empresariales" },
  { code: "621", label: "621 — Incorporación Fiscal" },
  { code: "626", label: "626 — RESICO (Régimen Simplificado de Confianza)" },
  { code: "616", label: "616 — Sin obligaciones fiscales" },
];

const USO_CFDI: { code: string; label: string }[] = [
  { code: "G01", label: "G01 — Adquisición de mercancías" },
  { code: "G02", label: "G02 — Devoluciones, descuentos o bonificaciones" },
  { code: "G03", label: "G03 — Gastos en general" },
  { code: "I01", label: "I01 — Construcciones" },
  { code: "I04", label: "I04 — Equipo de cómputo" },
  { code: "I05", label: "I05 — Dados, troqueles, moldes" },
  { code: "I08", label: "I08 — Otra maquinaria y equipo" },
  { code: "S01", label: "S01 — Sin efectos fiscales" },
  { code: "CP01", label: "CP01 — Pagos" },
];

interface Props {
  data: CFDIBaseData;
  setCliente: (next: CFDIClienteData) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function ClienteSection({ data, setCliente, showValidation, errors }: Props) {
  const { companyId } = useTenant();
  const [clientes,    setClientes]   = useState<any[]>([]);
  const [searchTerm,  setSearchTerm] = useState("");
  const [showList,    setShowList]   = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("clients")
      .select("id, name, legal_name, rfc, email, tax_regime, zip_code")
      .eq("company_id", companyId).order("name").limit(200)
      .then(({ data }) => setClientes(data ?? []));
  }, [companyId]);

  const filtered = clientes.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.legal_name?.toLowerCase().includes(s) || c.rfc?.toLowerCase().includes(s);
  });

  const update = (patch: Partial<CFDIClienteData>) => setCliente({ ...data.cliente, ...patch });

  const selectClient = (c: any) => {
    setCliente({
      client_id:              c.id,
      receiver_rfc:           c.rfc ?? "",
      receiver_name:          c.legal_name ?? c.name ?? "",
      receiver_fiscal_regime: c.tax_regime ?? "601",
      receiver_zip:           c.zip_code ?? "",
      receiver_email:         c.email ?? "",
      receiver_cfdi_use:      data.cliente.receiver_cfdi_use,
    });
    setSearchTerm(c.legal_name ?? c.name ?? "");
    setShowList(false);
  };

  const fieldError = (field: string) => showValidation && errors.some(e => e.field === field);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>

      {/* Banner */}
      <div style={{
        padding: "12px 14px", borderRadius: "var(--radius-md)",
        background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
        fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5,
      }}>
        Datos fiscales del receptor del CFDI. Selecciona un cliente registrado o captura los datos manualmente.
      </div>

      {/* Selector cliente */}
      <Section title="Buscar cliente registrado">
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowList(true); }}
            onFocus={() => setShowList(true)}
            onBlur={() => setTimeout(() => setShowList(false), 200)}
            placeholder="Busca por nombre, razón social o RFC…"
            style={INPUT}
          />
          {showList && filtered.length > 0 && (
            <div style={{
              position: "absolute", zIndex: 10, left: 0, right: 0, top: "calc(100% + 4px)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              maxHeight: "240px", overflowY: "auto",
              boxShadow: "var(--shadow-xl)",
            }}>
              {filtered.slice(0, 30).map(c => (
                <button key={c.id} type="button" onClick={() => selectClient(c)}
                  style={{
                    width: "100%", padding: "8px 12px", textAlign: "left",
                    background: "transparent", border: "none", borderBottom: "1px solid var(--color-border-faint)",
                    cursor: "pointer", color: "var(--color-text-primary)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{c.legal_name ?? c.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px" }}>
                    {c.rfc ?? "Sin RFC"}{c.zip_code && ` · CP ${c.zip_code}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {data.cliente.client_id && (
          <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            Cliente vinculado de la base de datos
          </div>
        )}
      </Section>

      {/* Datos fiscales */}
      <Section title="Datos fiscales">
        <Grid>
          <FieldFull label="Razón social / Nombre completo" required error={fieldError("receiver_name")}>
            <input
              type="text"
              value={data.cliente.receiver_name}
              onChange={e => update({ receiver_name: e.target.value })}
              placeholder="Ej: Empresa S.A. de C.V."
              style={INPUT}
            />
          </FieldFull>

          <Field label="RFC" required error={fieldError("receiver_rfc")} hint="Genéricos: XAXX010101000 (público) · XEXX010101000 (extranjero)">
            <input
              type="text"
              value={data.cliente.receiver_rfc}
              onChange={e => update({ receiver_rfc: e.target.value.toUpperCase() })}
              maxLength={13}
              placeholder="ABC850101XXX"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </Field>

          <Field label="Código postal" required error={fieldError("receiver_zip")}>
            <input
              type="text"
              value={data.cliente.receiver_zip}
              onChange={e => update({ receiver_zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
              maxLength={5}
              placeholder="06700"
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </Field>

          <Field label="Régimen fiscal" required error={fieldError("receiver_fiscal_regime")}>
            <select
              value={data.cliente.receiver_fiscal_regime}
              onChange={e => update({ receiver_fiscal_regime: e.target.value })}
              style={INPUT}
            >
              {REGIMEN_FISCAL.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
            </select>
          </Field>

          <Field label="Uso del CFDI" required error={fieldError("receiver_cfdi_use")}>
            <select
              value={data.cliente.receiver_cfdi_use}
              onChange={e => update({ receiver_cfdi_use: e.target.value })}
              style={INPUT}
            >
              {USO_CFDI.map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
            </select>
          </Field>

          <FieldFull label="Email (opcional)" hint="Si llenas el email, podrás enviar el CFDI directamente al cliente al timbrar.">
            <input
              type="email"
              value={data.cliente.receiver_email ?? ""}
              onChange={e => update({ receiver_email: e.target.value || undefined })}
              placeholder="contacto@cliente.com"
              style={INPUT}
            />
          </FieldFull>
        </Grid>
      </Section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Estilos compartidos y mini-componentes
// ─────────────────────────────────────────────────────────────
const INPUT: React.CSSProperties = {
  width: "100%", height: "36px", padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-subtle)",
  color: "var(--color-text-primary)",
  fontSize: "13px", outline: "none", boxSizing: "border-box",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>{children}</div>;
}

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      <div style={error ? { boxShadow: "0 0 0 1px #dc2626", borderRadius: "var(--radius-md)" } : undefined}>
        {children}
      </div>
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function FieldFull({ label, required, error, hint, children }: { label: string; required?: boolean; error?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <label style={{ display: "block", fontSize: "11px", color: "var(--color-text-muted)", marginBottom: "5px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: "3px" }}>*</span>}
      </label>
      <div style={error ? { boxShadow: "0 0 0 1px #dc2626", borderRadius: "var(--radius-md)" } : undefined}>
        {children}
      </div>
      {hint && <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}
