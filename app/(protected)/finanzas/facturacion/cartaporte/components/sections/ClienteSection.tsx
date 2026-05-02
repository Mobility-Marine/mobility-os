"use client";

// ═══════════════════════════════════════════════════════════════════════
// ClienteSection — Datos fiscales del receptor del CFDI
// Estilos: inline + CSS variables (mismo patrón que ConceptosSection)
//
// Captura el cliente del CFDI con:
// - Selector de cliente registrado en la BD (autocomplete)
// - RFC, razón social, código postal, régimen fiscal y uso CFDI
// - Email opcional para envío automático del CFDI
//
// Los catálogos de Régimen Fiscal y Uso CFDI vienen del SAT vía
// useSATCatalog (siempre actualizados).
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { CFDIClienteData, CFDIBaseData } from "../../types/carta_porte.types";

// ─── Tipo de cliente desde Supabase ───
type ClienteDB = {
  id: string;
  name: string | null;
  legal_name: string | null;
  rfc: string | null;
  email: string | null;
  tax_regime: string | null;
  zip_code: string | null;
};

interface Props {
  data: CFDIBaseData;
  setCliente: (next: CFDIClienteData) => void;
  showValidation: boolean;
  errors: { field: string; message: string }[];
}

export function ClienteSection({ data, setCliente, showValidation, errors }: Props) {
  const { companyId } = useTenant();

  // Catálogos SAT desde BD (cache automático)
  const { items: regimenes, loading: loadingRegimenes } = useSATCatalog("regimen_fiscal");
  const { items: usosCfdi, loading: loadingUsos } = useSATCatalog("uso_cfdi");

  // Lista de clientes registrados
  const [clientes, setClientes] = useState<ClienteDB[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showList, setShowList] = useState(false);

  // ─── Cargar clientes registrados ───
  useEffect(() => {
    if (!companyId) return;
    setLoadingClientes(true);
    supabase
      .from("clients")
      .select("id, name, legal_name, rfc, email, tax_regime, zip_code")
      .eq("company_id", companyId)
      .order("name")
      .limit(200)
      .then(({ data }) => {
        setClientes(data ?? []);
        setLoadingClientes(false);
      });
  }, [companyId]);

  // Filtro local sobre la lista de clientes ya cargada
  const filtered = clientes.filter(c => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(s) ||
      c.legal_name?.toLowerCase().includes(s) ||
      c.rfc?.toLowerCase().includes(s)
    );
  });

  const update = (patch: Partial<CFDIClienteData>) =>
    setCliente({ ...data.cliente, ...patch });

  const selectClient = (c: ClienteDB) => {
    setCliente({
      client_id: c.id,
      receiver_rfc: c.rfc ?? "",
      receiver_name: c.legal_name ?? c.name ?? "",
      receiver_fiscal_regime: c.tax_regime ?? "601",
      receiver_zip: c.zip_code ?? "",
      receiver_email: c.email ?? "",
      receiver_cfdi_use: data.cliente.receiver_cfdi_use,
    });
    setSearchTerm(c.legal_name ?? c.name ?? "");
    setShowList(false);
  };

  const clearClient = () => {
    setCliente({
      client_id: undefined,
      receiver_rfc: "",
      receiver_name: "",
      receiver_fiscal_regime: "601",
      receiver_zip: "",
      receiver_email: "",
      receiver_cfdi_use: data.cliente.receiver_cfdi_use,
    });
    setSearchTerm("");
  };

  const fieldError = (field: string) =>
    showValidation && errors.some(e => e.field === field);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "780px" }}>
      {/* ── Banner ── */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-info-bg)",
        border: "1px solid var(--color-info-border)",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-info-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          Datos fiscales del receptor del CFDI. Selecciona un cliente registrado para
          autocompletar o captura los datos manualmente para clientes nuevos.
        </div>
      </div>

      {/* ── Selector de cliente registrado ── */}
      <div>
        <SectionHeader
          title="Buscar cliente registrado"
          subtitle="Empieza a escribir el nombre o RFC para autocompletar"
        />
        <div style={{ position: "relative" }}>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setShowList(true);
              }}
              onFocus={() => setShowList(true)}
              onBlur={() => setTimeout(() => setShowList(false), 200)}
              placeholder={loadingClientes ? "Cargando clientes..." : "Busca por nombre, razón social o RFC…"}
              disabled={loadingClientes}
              style={{ ...INPUT, paddingLeft: "34px" }}
            />
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {showList && filtered.length > 0 && (
            <div style={{
              position: "absolute",
              zIndex: 10,
              left: 0,
              right: 0,
              top: "calc(100% + 4px)",
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              maxHeight: "260px",
              overflowY: "auto",
              boxShadow: "var(--shadow-xl)",
            }}>
              {filtered.slice(0, 30).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClient(c)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--color-border-faint)",
                    cursor: "pointer",
                    color: "var(--color-text-primary)",
                    transition: "var(--transition-fast)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-subtle)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>
                    {c.legal_name ?? c.name}
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    fontFamily: "monospace",
                    marginTop: "2px",
                  }}>
                    {c.rfc ?? "Sin RFC"}
                    {c.zip_code && ` · CP ${c.zip_code}`}
                    {c.tax_regime && ` · Régimen ${c.tax_regime}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Indicador de cliente vinculado */}
        {data.cliente.client_id && (
          <div style={{
            marginTop: "8px",
            padding: "8px 12px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}>
            <div style={{
              fontSize: "11px",
              color: "var(--color-success-text)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              Cliente vinculado de la base de datos
            </div>
            <button
              type="button"
              onClick={clearClient}
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-success-border)",
                background: "var(--color-bg-base)",
                color: "var(--color-success-text)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Desvincular
            </button>
          </div>
        )}
      </div>

      {/* ── Datos fiscales ── */}
      <div>
        <SectionHeader
          title="Datos fiscales"
          subtitle="Información requerida por el SAT para emitir el CFDI"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS
              label="Razón social / Nombre completo"
              required
              error={fieldError("receiver_name")}
            >
              <input
                type="text"
                value={data.cliente.receiver_name}
                onChange={e => update({ receiver_name: e.target.value })}
                placeholder="Ej: Empresa S.A. de C.V."
                style={INPUT}
              />
            </FieldS>
          </div>

          <FieldS
            label="RFC"
            required
            error={fieldError("receiver_rfc")}
            hint="Genéricos: XAXX010101000 (público) · XEXX010101000 (extranjero)"
          >
            <input
              type="text"
              value={data.cliente.receiver_rfc}
              onChange={e => update({ receiver_rfc: e.target.value.toUpperCase() })}
              placeholder="ABC850101XXX"
              maxLength={13}
              style={{ ...INPUT, fontFamily: "monospace" }}
            />
          </FieldS>

          <FieldS
            label="Código postal"
            required
            error={fieldError("receiver_zip")}
            hint="5 dígitos del domicilio fiscal del receptor"
          >
            <input
              type="text"
              value={data.cliente.receiver_zip}
              onChange={e =>
                update({ receiver_zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
              }
              maxLength={5}
              placeholder="06700"
              style={{ ...INPUT, fontFamily: "monospace", fontVariantNumeric: "tabular-nums" }}
            />
          </FieldS>

          <FieldS
            label="Régimen fiscal"
            required
            error={fieldError("receiver_fiscal_regime")}
          >
            <select
              value={data.cliente.receiver_fiscal_regime}
              onChange={e => update({ receiver_fiscal_regime: e.target.value })}
              disabled={loadingRegimenes}
              style={INPUT}
            >
              <option value="">{loadingRegimenes ? "Cargando..." : "Selecciona régimen..."}</option>
              {regimenes.map(r => (
                <option key={r.code} value={r.code}>
                  {r.code} — {r.label}
                </option>
              ))}
            </select>
          </FieldS>

          <FieldS
            label="Uso del CFDI"
            required
            error={fieldError("receiver_cfdi_use")}
          >
            <select
              value={data.cliente.receiver_cfdi_use}
              onChange={e => update({ receiver_cfdi_use: e.target.value })}
              disabled={loadingUsos}
              style={INPUT}
            >
              <option value="">{loadingUsos ? "Cargando..." : "Selecciona uso..."}</option>
              {usosCfdi.map(u => (
                <option key={u.code} value={u.code}>
                  {u.code} — {u.label}
                </option>
              ))}
            </select>
          </FieldS>

          <div style={{ gridColumn: "1 / -1" }}>
            <FieldS
              label="Email (opcional)"
              hint="Si llenas el email, podrás enviar el CFDI directamente al cliente al timbrar."
            >
              <input
                type="email"
                value={data.cliente.receiver_email ?? ""}
                onChange={e => update({ receiver_email: e.target.value || undefined })}
                placeholder="contacto@cliente.com"
                style={INPUT}
              />
            </FieldS>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────

const INPUT: React.CSSProperties = {
  width: "100%",
  height: "36px",
  padding: "0 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--color-text-primary)",
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginTop: "2px",
          lineHeight: 1.5,
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function FieldS({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "block",
        fontSize: "11px",
        color: "var(--color-text-muted)",
        marginBottom: "5px",
        fontWeight: 500,
      }}>
        {label}
        {required && <span style={{ color: "var(--color-danger-text)", marginLeft: "3px" }}>*</span>}
      </label>
      <div style={
        error
          ? {
              boxShadow: "0 0 0 1px var(--color-danger-text)",
              borderRadius: "var(--radius-md)",
            }
          : undefined
      }>
        {children}
      </div>
      {hint && (
        <div style={{
          fontSize: "10px",
          color: "var(--color-text-muted)",
          marginTop: "4px",
          lineHeight: 1.4,
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}
