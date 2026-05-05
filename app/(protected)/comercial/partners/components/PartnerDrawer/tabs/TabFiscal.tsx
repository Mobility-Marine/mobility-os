// ════════════════════════════════════════════════════════════════════════
// TabFiscal — Tab 2 del wizard PartnerDrawer
// ════════════════════════════════════════════════════════════════════════
// Captura los datos fiscales CFDI 4.0 del partner:
//   Sección 1: Datos fiscales básicos (RFC, razón social, régimen, CP)
//   Sección 2: Validación SAT vía Facturapi (SATValidationCard)
//   Sección 3: Defaults CFDI (uso CFDI, método pago, forma pago)
//   Sección 4: Email facturación
//   Sección 5: Dirección fiscal estructurada
//   Sección 6: Validación 69-B EFOS (Validation69BCard)
//
// Carga catálogos SAT al montarse. Valida campos required en tiempo real.
// ════════════════════════════════════════════════════════════════════════
"use client";

import { useEffect, useState } from "react";
import type { Partner, TabValidationState } from "../types";
import {
  Field,
  FieldGrid,
  SectionTitle,
  FIELD_INPUT,
  FIELD_SELECT,
} from "../components/Field";
import { SATValidationCard } from "../components/SATValidationCard";
import { Validation69BCard } from "../components/Validation69BCard";
import {
  fetchRegimenFiscal,
  fetchUsoCFDI,
  fetchFormaPago,
  fetchEstadosMexico,
  fetchPaisesComunes,
  METODO_PAGO_OPTIONS,
  type SATCatalogItem,
} from "../services/sat-catalogs.service";

// ── Props ─────────────────────────────────────────────────────────────
export type TabFiscalProps = {
  partner:    Partial<Partner>;
  validation: TabValidationState;
  companyId:  string;
  onPatch:    (patch: Partial<Partner>) => void;
};

// ── Componente ────────────────────────────────────────────────────────
export function TabFiscal({ partner, validation, companyId, onPatch }: TabFiscalProps) {
  // ── Estado de los catálogos ───────────────────────────────────────
  const [regimenFiscal, setRegimenFiscal] = useState<SATCatalogItem[]>([]);
  const [usoCFDI,       setUsoCFDI]       = useState<SATCatalogItem[]>([]);
  const [formaPago,     setFormaPago]     = useState<SATCatalogItem[]>([]);
  const [estados,       setEstados]       = useState<SATCatalogItem[]>([]);
  const [paises,        setPaises]        = useState<SATCatalogItem[]>([]);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);

  // ── Cargar catálogos al montar ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchRegimenFiscal(),
      fetchUsoCFDI(),
      fetchFormaPago(),
      fetchEstadosMexico(),
      fetchPaisesComunes(),
    ])
      .then(([rf, uc, fp, est, pa]) => {
        if (cancelled) return;
        setRegimenFiscal(rf);
        setUsoCFDI(uc);
        setFormaPago(fp);
        setEstados(est);
        setPaises(pa);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setCatalogsError(`No se pudieron cargar los catálogos SAT: ${msg}`);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Validación inline de campos requeridos ────────────────────────
  const isRequired   = !!partner.is_customer;
  const rfcInvalid   = isRequired && (!partner.rfc || partner.rfc.trim().length < 12);
  const legalInvalid = isRequired && !partner.legal_name;
  const regimeInvalid = isRequired && !partner.tax_regime;
  const zipInvalid   = isRequired && !/^\d{5}$/.test(partner.zip_code ?? "");

  // ── Si NO es cliente, mostrar solo aviso (no aplica facturación) ──
  if (!partner.is_customer) {
    return (
      <div style={{ padding: "20px" }}>
        <div
          style={{
            padding:       "20px",
            borderRadius:  "var(--radius-md)",
            border:        "1px dashed var(--color-border)",
            background:    "var(--color-bg-subtle)",
            textAlign:     "center",
            color:         "var(--color-text-muted)",
            fontSize:      "13px",
            lineHeight:    1.6,
          }}
        >
          ℹ️ Los datos fiscales solo son obligatorios para partners marcados como{" "}
          <strong>Cliente</strong> (se les emitirá CFDI).
          <br />
          Si lo deseas, puedes capturarlos opcionalmente para tener su información completa.
          <br />
          <button
            type="button"
            onClick={() => onPatch({ is_customer: true })}
            style={{
              marginTop:   "12px",
              padding:     "6px 14px",
              fontSize:    "12px",
              fontWeight:  600,
              border:      "1px solid var(--color-brand-blue, #3b82f6)",
              borderRadius: "var(--radius-md)",
              background:  "transparent",
              color:       "var(--color-brand-blue, #3b82f6)",
              cursor:      "pointer",
            }}
          >
            Marcar como cliente y capturar datos fiscales
          </button>
        </div>
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────────────
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {catalogsError && (
        <div
          style={{
            padding:      "10px 14px",
            borderRadius: "var(--radius-md)",
            background:   "rgba(239, 68, 68, 0.1)",
            color:        "var(--color-danger-text)",
            fontSize:     "12px",
          }}
        >
          ⚠️ {catalogsError}
        </div>
      )}

      {/* ─── SECCIÓN 1: Datos fiscales básicos ─── */}
      <div>
        <SectionTitle>Datos fiscales (CFDI 4.0)</SectionTitle>
        <div style={{ marginTop: "12px" }}>
          <FieldGrid columns={4}>
            <Field
              label="RFC"
              required={isRequired}
              span={2}
              error={rfcInvalid ? "RFC inválido. Debe tener 12 (moral) o 13 caracteres (física)." : undefined}
              hint="Ej. ABC123456XYZ (moral) o ABCD123456XYZ (física)."
            >
              <input
                type="text"
                value={partner.rfc ?? ""}
                onChange={(e) => onPatch({ rfc: e.target.value.toUpperCase() })}
                placeholder="RFC"
                maxLength={13}
                style={{
                  ...FIELD_INPUT,
                  textTransform: "uppercase",
                  borderColor:   rfcInvalid ? "var(--color-danger-text)" : "var(--color-border)",
                }}
              />
            </Field>

            <Field
              label="Razón social"
              required={isRequired}
              span={2}
              error={legalInvalid ? "La razón social es obligatoria para emitir CFDI." : undefined}
              hint="Tal como aparece en la constancia de situación fiscal."
            >
              <input
                type="text"
                value={partner.legal_name ?? ""}
                onChange={(e) => onPatch({ legal_name: e.target.value })}
                placeholder="Ej. Distribuidora del Norte S.A. de C.V."
                style={{
                  ...FIELD_INPUT,
                  borderColor: legalInvalid ? "var(--color-danger-text)" : "var(--color-border)",
                }}
              />
            </Field>

            <Field
              label="Régimen fiscal"
              required={isRequired}
              span={2}
              error={regimeInvalid ? "Selecciona el régimen fiscal." : undefined}
            >
              <select
                value={partner.tax_regime ?? ""}
                onChange={(e) => onPatch({ tax_regime: e.target.value })}
                style={{
                  ...FIELD_SELECT,
                  borderColor: regimeInvalid ? "var(--color-danger-text)" : "var(--color-border)",
                }}
              >
                <option value="">— Seleccionar —</option>
                {regimenFiscal.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.code} — {r.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="CP fiscal"
              required={isRequired}
              error={zipInvalid ? "Código postal inválido (5 dígitos)." : undefined}
              hint="Lugar de expedición del CFDI."
            >
              <input
                type="text"
                value={partner.zip_code ?? ""}
                onChange={(e) => onPatch({ zip_code: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                placeholder="00000"
                maxLength={5}
                style={{
                  ...FIELD_INPUT,
                  borderColor: zipInvalid ? "var(--color-danger-text)" : "var(--color-border)",
                }}
              />
            </Field>

            <Field label="Email facturación" hint="Para envío de CFDI por correo.">
              <input
                type="email"
                value={partner.billing_email ?? ""}
                onChange={(e) => onPatch({ billing_email: e.target.value })}
                placeholder="facturacion@cliente.com"
                style={FIELD_INPUT}
              />
            </Field>
          </FieldGrid>
        </div>
      </div>

      {/* ─── SECCIÓN 2: Validación SAT ─── */}
      <SATValidationCard partner={partner} companyId={companyId} onPatch={onPatch} />

      {/* ─── SECCIÓN 3: Defaults CFDI ─── */}
      <div>
        <SectionTitle>Defaults para emitir CFDI</SectionTitle>
        <div style={{ marginTop: "12px" }}>
          <FieldGrid columns={3}>
            <Field label="Uso CFDI predeterminado" hint="Se aplicará al emitir factura.">
              <select
                value={partner.cfdi_use ?? ""}
                onChange={(e) => onPatch({ cfdi_use: e.target.value })}
                style={FIELD_SELECT}
              >
                <option value="">— Seleccionar —</option>
                {usoCFDI.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Método de pago" hint="PUE: una exhibición · PPD: parcialidades.">
              <select
                value={partner.payment_method ?? ""}
                onChange={(e) => onPatch({ payment_method: e.target.value })}
                style={FIELD_SELECT}
              >
                <option value="">— Seleccionar —</option>
                {METODO_PAGO_OPTIONS.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Forma de pago">
              <select
                value={partner.payment_form ?? ""}
                onChange={(e) => onPatch({ payment_form: e.target.value })}
                style={FIELD_SELECT}
              >
                <option value="">— Seleccionar —</option>
                {formaPago.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.code} — {f.label}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGrid>
        </div>
      </div>

      {/* ─── SECCIÓN 4: Dirección fiscal estructurada ─── */}
      <div>
        <SectionTitle>Dirección fiscal (opcional pero recomendada)</SectionTitle>
        <div style={{ marginTop: "12px" }}>
          <FieldGrid columns={6}>
            <Field label="Calle" span={4}>
              <input
                type="text"
                value={partner.billing_street ?? ""}
                onChange={(e) => onPatch({ billing_street: e.target.value })}
                placeholder="Av. Paseo de la Reforma"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Número exterior">
              <input
                type="text"
                value={partner.billing_ext_number ?? ""}
                onChange={(e) => onPatch({ billing_ext_number: e.target.value })}
                placeholder="123"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Número interior">
              <input
                type="text"
                value={partner.billing_int_number ?? ""}
                onChange={(e) => onPatch({ billing_int_number: e.target.value })}
                placeholder="A"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Colonia" span={2}>
              <input
                type="text"
                value={partner.billing_neighborhood ?? ""}
                onChange={(e) => onPatch({ billing_neighborhood: e.target.value })}
                placeholder="Juárez"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Ciudad" span={2}>
              <input
                type="text"
                value={partner.billing_city ?? ""}
                onChange={(e) => onPatch({ billing_city: e.target.value })}
                placeholder="Ciudad de México"
                style={FIELD_INPUT}
              />
            </Field>

            <Field label="Estado" span={1}>
              <select
                value={partner.billing_state ?? ""}
                onChange={(e) => onPatch({ billing_state: e.target.value })}
                style={FIELD_SELECT}
              >
                <option value="">— Seleccionar —</option>
                {estados.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="País" span={1}>
              <select
                value={partner.billing_country ?? "MEX"}
                onChange={(e) => onPatch({ billing_country: e.target.value })}
                style={FIELD_SELECT}
              >
                {paises.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGrid>
        </div>
      </div>

      {/* ─── SECCIÓN 5: Validación 69-B EFOS ─── */}
      <Validation69BCard partner={partner} onPatch={onPatch} />

      {/* Mostrar error de tab si existe */}
      {!validation.isValid && validation.errorMessage && (
        <div
          style={{
            padding:      "10px 14px",
            borderRadius: "var(--radius-md)",
            background:   "rgba(239, 68, 68, 0.08)",
            color:        "var(--color-danger-text)",
            fontSize:     "12px",
            fontWeight:   500,
          }}
        >
          ⚠️ {validation.errorMessage}
        </div>
      )}
    </div>
  );
}