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
//
// MODO TRASLADO (parentType="traslado_carta_porte"):
// - Banner contextual diferenciado
// - Botón rápido "Auto-llenar con mi empresa" (carga datos de company_settings)
// - Uso CFDI fijo en S01 (Sin efectos fiscales) - no editable
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useSATCatalog } from "@/lib/hooks/useSATCatalog";
import type { CFDIClienteData, CFDIBaseData, CartaPorteParentType } from "../../types/carta_porte.types";

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
  /** Tipo de comprobante: factura_carta_porte (default) o traslado_carta_porte */
  parentType?: CartaPorteParentType;
}

export function ClienteSection({ data, setCliente, showValidation, errors, parentType = "factura_carta_porte" }: Props) {
  const { companyId } = useTenant();

  // ─── Modo Traslado: detección y datos fiscales de la empresa ───
  const isTraslado = parentType === "traslado_carta_porte";
  const [companyFiscal, setCompanyFiscal] = useState<{
    fiscal_name: string | null;
    fiscal_rfc: string | null;
    fiscal_regime: string | null;
    fiscal_zip: string | null;
    fiscal_email: string | null;
  } | null>(null);

  // Cargar datos fiscales de la empresa cuando es Traslado
  useEffect(() => {
    if (!isTraslado || !companyId) return;
    supabase
      .from("company_settings")
      .select("fiscal_name, fiscal_rfc, fiscal_regime, fiscal_zip, fiscal_email")
      .eq("company_id", companyId)
      .maybeSingle()
      .then(({ data: cs }) => {
        if (cs) setCompanyFiscal(cs as any);
      });
  }, [isTraslado, companyId]);

  // Forzar receiver_cfdi_use = "S01" en modo Traslado (Sin efectos fiscales)
  useEffect(() => {
    if (isTraslado && data.cliente.receiver_cfdi_use !== "S01") {
      setCliente({ ...data.cliente, receiver_cfdi_use: "S01" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTraslado]);

  // Auto-llenar receptor con datos fiscales de la empresa (caso auto-traslado)
  const autoFillFromCompany = () => {
    if (!companyFiscal) return;
    setCliente({
      client_id: undefined,
      receiver_rfc: companyFiscal.fiscal_rfc ?? "",
      receiver_name: companyFiscal.fiscal_name ?? "",
      receiver_fiscal_regime: companyFiscal.fiscal_regime ?? "601",
      receiver_zip: companyFiscal.fiscal_zip ?? "",
      receiver_email: companyFiscal.fiscal_email ?? "",
      receiver_cfdi_use: "S01",
    });
    setSearchTerm(companyFiscal.fiscal_name ?? "");
  };

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
      {/* ── Banner contextual: Factura vs Traslado ── */}
      <div style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: isTraslado ? "var(--color-brand-orange-light)" : "var(--color-info-bg)",
        border: `1px solid ${isTraslado ? "var(--color-brand-orange)" : "var(--color-info-border)"}`,
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-base)",
          border: `1px solid ${isTraslado ? "var(--color-brand-orange)" : "var(--color-info-border)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {isTraslado ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-orange)" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-info-text)" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, fontSize: "12px", color: "var(--color-text-second)", lineHeight: 1.5 }}>
          {isTraslado ? (
            <>
              <strong style={{ color: "var(--color-text-primary)" }}>Modo Traslado (CFDI Tipo T):</strong>{" "}
              el receptor suele ser tu propia empresa (auto-traslado entre puertos/almacenes propios) o el dueño de la mercancía si transportas para un cliente.
              {" "}El uso CFDI se fijará automáticamente en <strong style={{ color: "var(--color-text-primary)" }}>S01 - Sin efectos fiscales</strong>.
            </>
          ) : (
            <>Datos fiscales del receptor del CFDI. Selecciona un cliente registrado para autocompletar o captura los datos manualmente para clientes nuevos.</>
          )}
        </div>
      </div>

      {/* ── Botón rápido "Auto-llenar con mi empresa" (solo en Traslado) ── */}
      {isTraslado && companyFiscal && (
        <button
          type="button"
          onClick={autoFillFromCompany}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-brand-blue)",
            background: "var(--color-brand-blue-light)",
            color: "var(--color-brand-blue)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "var(--transition-fast)",
            width: "100%",
            textAlign: "left",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-base)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--color-brand-blue-light)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <div style={{ flex: 1 }}>
            <div>Auto-llenar con mi empresa ({companyFiscal.fiscal_name ?? "Mi empresa"})</div>
            <div style={{ fontSize: "11px", fontWeight: 400, opacity: 0.8, marginTop: "2px" }}>
              Caso auto-traslado: mover mercancía propia entre tus ubicaciones
            </div>
          </div>
        </button>
      )}

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

          {/* Dropdown de resultados */}
          {showList && searchTerm && filtered.length > 0 && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 999,
              background: "var(--color-bg-base)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-xl)",
              maxHeight: "260px",
              overflowY: "auto",
            }}>
              {filtered.slice(0, 10).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => selectClient(c)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    color: "var(--color-text-primary)",
                    borderBottom: "1px solid var(--color-border-faint)",
                    transition: "var(--transition-fast)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--color-bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
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
            padding: "8px 10px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-success-bg)",
            border: "1px solid var(--color-success-border)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            color: "var(--color-success-text)",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{ flex: 1 }}>Cliente vinculado de tu BD</span>
            <button
              type="button"
              onClick={clearClient}
              style={{
                padding: "2px 8px",
                border: "1px solid var(--color-success-border)",
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                color: "var(--color-success-text)",
                cursor: "pointer",
                fontSize: "10px",
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
                placeholder="ACME Logística S.A. de C.V."
                style={INPUT}
              />
            </FieldS>
          </div>

          <FieldS
            label="RFC"
            required
            error={fieldError("receiver_rfc")}
          >
            <input
              type="text"
              value={data.cliente.receiver_rfc}
              onChange={e => update({ receiver_rfc: e.target.value.toUpperCase() })}
              placeholder="XAXX010101000"
              maxLength={13}
              style={{ ...INPUT, fontFamily: "monospace", textTransform: "uppercase" }}
            />
          </FieldS>

          <FieldS
            label="Código postal"
            required
            error={fieldError("receiver_zip")}
          >
            <input
              type="text"
              value={data.cliente.receiver_zip}
              onChange={e => update({ receiver_zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
              placeholder="20115"
              maxLength={5}
              style={{ ...INPUT, fontFamily: "monospace" }}
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
            hint={isTraslado ? "En Traslado el uso es siempre S01 (Sin efectos fiscales)." : undefined}
          >
            {isTraslado ? (
              <input
                type="text"
                value="S01 — Sin efectos fiscales"
                disabled
                style={{ ...INPUT, fontFamily: "monospace", color: "var(--color-text-muted)", cursor: "not-allowed" }}
              />
            ) : (
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
            )}
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
      {children}
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
      {error && (
        <div style={{
          fontSize: "10px",
          color: "var(--color-danger-text)",
          marginTop: "4px",
        }}>
          Campo obligatorio
        </div>
      )}
    </div>
  );
}
