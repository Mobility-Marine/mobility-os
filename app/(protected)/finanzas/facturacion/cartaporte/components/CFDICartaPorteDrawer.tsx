"use client";

// ═══════════════════════════════════════════════════════════════════════
// CFDICartaPorteDrawer — Drawer Factura/Traslado con Carta Porte 3.1
// 
// Combina en un solo flujo:
//   - Datos del CFDI base (Cliente + Conceptos)
//   - Complemento Carta Porte 3.1 (6 secciones)
// 
// Visualmente idéntico al CFDICreateDrawer del proyecto (inline styles
// + CSS variables — sin Tailwind).
// ═══════════════════════════════════════════════════════════════════════

import { useState, useCallback, useMemo } from "react";
import type {
  CartaPorteData,
  CartaPorteParentType,
  CFDIBaseData,
  CFDIClienteData,
  CFDIConCartaPorteData,
} from "../types/carta_porte.types";
import { defaultCFDIConCartaPorte } from "../types/carta_porte.defaults";
import {
  validateCFDIConCartaPorte,
  groupErrorsBySection,
} from "../types/carta_porte.validations";

import { ClienteSection }         from "./sections/ClienteSection";
import { ConceptosSection }       from "./sections/ConceptosSection";
import { DatosGeneralesSection }  from "./sections/DatosGeneralesSection";
import { UbicacionesSection }     from "./sections/UbicacionesSection";
import { MercanciasSection }      from "./sections/MercanciasSection";
import { ModoTransporteSection }  from "./sections/ModoTransporteSection";
import { FigurasSection }         from "./sections/FigurasSection";
import { RegimenAduaneroSection } from "./sections/RegimenAduaneroSection";

// ─────────────────────────────────────────────────────────────
type StepId =
  | "cliente" | "conceptos" | "datos_generales" | "ubicaciones"
  | "mercancias" | "modo_transporte" | "figuras" | "resumen";

type Step = {
  id: StepId;
  label: string;
  number: number;
  errorSection: string | null;
  hideForTraslado?: boolean;
};

const STEPS_ALL: Step[] = [
  { id: "cliente",         label: "Cliente",       number: 1, errorSection: "cliente" },
  { id: "conceptos",       label: "Conceptos",     number: 2, errorSection: "conceptos", hideForTraslado: true },
  { id: "datos_generales", label: "Datos",         number: 3, errorSection: "header" },
  { id: "ubicaciones",     label: "Ubicaciones",   number: 4, errorSection: "ubicaciones" },
  { id: "mercancias",      label: "Mercancías",    number: 5, errorSection: "mercancias" },
  { id: "modo_transporte", label: "Transporte",    number: 6, errorSection: "modo_transporte" },
  { id: "figuras",         label: "Figuras",       number: 7, errorSection: "figuras" },
  { id: "resumen",         label: "Resumen",       number: 8, errorSection: null },
];

interface Props {
  open: boolean;
  parentType: CartaPorteParentType;
  saving?: boolean;
  onClose: () => void;
  onSaveDraft?: (data: CFDIConCartaPorteData) => Promise<void> | void;
  onStamp?: (data: CFDIConCartaPorteData) => Promise<void> | void;
}

export function CFDICartaPorteDrawer({
  open, parentType, saving = false, onClose, onSaveDraft, onStamp,
}: Props) {
  const [data, setData] = useState<CFDIConCartaPorteData>(defaultCFDIConCartaPorte);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showValidation, setShowValidation] = useState<boolean>(false);

  const isTraslado = parentType === "traslado_carta_porte";
  const STEPS = useMemo(
    () => STEPS_ALL.filter(s => !(isTraslado && s.hideForTraslado)).map((s, idx) => ({ ...s, number: idx + 1 })),
    [isTraslado]
  );

  const validation = useMemo(() => validateCFDIConCartaPorte(data, parentType), [data, parentType]);
  const groupedErrors = useMemo(() => groupErrorsBySection(validation.errors), [validation]);

  // ─── Updaters atómicos ───
  const setCliente   = useCallback((next: CFDIClienteData) => { setData(p => ({ ...p, base: { ...p.base, cliente: next } })); }, []);
  const setBase      = useCallback((next: CFDIBaseData)    => { setData(p => ({ ...p, base: next })); }, []);
  const updateHeader = useCallback((patch: Partial<CartaPorteData["header"]>) => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, header: { ...p.carta_porte.header, ...patch } } })); }, []);
  const setUbicaciones        = useCallback((next: CartaPorteData["ubicaciones"])         => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, ubicaciones: next } })); }, []);
  const setMercancias         = useCallback((next: CartaPorteData["mercancias"])          => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, mercancias: next } })); }, []);
  const setMercanciasAgregado = useCallback((next: CartaPorteData["mercancias_agregado"]) => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, mercancias_agregado: next } })); }, []);
  const setAutotransporte     = useCallback((next: CartaPorteData["autotransporte"])      => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, autotransporte: next } })); }, []);
  const setMaritimo           = useCallback((next: CartaPorteData["transporte_maritimo"]) => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, transporte_maritimo: next } })); }, []);
  const setAereo              = useCallback((next: CartaPorteData["transporte_aereo"])    => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, transporte_aereo: next } })); }, []);
  const setFerroviario        = useCallback((next: CartaPorteData["transporte_ferroviario"]) => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, transporte_ferroviario: next } })); }, []);
  const setFiguras            = useCallback((next: CartaPorteData["figuras"])             => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, figuras: next } })); }, []);
  const setRegimenes          = useCallback((next: CartaPorteData["regimenes_aduaneros"]) => { setData(p => ({ ...p, carta_porte: { ...p.carta_porte, regimenes_aduaneros: next } })); }, []);

  if (!open) return null;

  const titleBase = parentType === "factura_carta_porte" ? "Nueva Factura con Carta Porte" : "Nuevo Traslado con Carta Porte";
  const subtitle  = parentType === "factura_carta_porte" ? "CFDI Tipo I + Complemento Carta Porte 3.1" : "CFDI Tipo T + Complemento Carta Porte 3.1";

  const goPrev = () => setCurrentStep(p => Math.max(0, p - 1));
  const goNext = () => setCurrentStep(p => Math.min(STEPS.length - 1, p + 1));
  const isLastStep = currentStep === STEPS.length - 1;
  const currentStepDef = STEPS[currentStep];

  const errorsCountByStep = (step: Step): number => {
    if (!step.errorSection) return 0;
    return (groupedErrors as any)[step.errorSection]?.length ?? 0;
  };

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    await onSaveDraft(data);
  };

  const handleStamp = async () => {
    setShowValidation(true);
    if (!validation.ok) {
      const firstErrorStep = STEPS.findIndex(s => s.errorSection && errorsCountByStep(s) > 0);
      if (firstErrorStep >= 0) setCurrentStep(firstErrorStep);
      return;
    }
    if (!onStamp) return;
    await onStamp(data);
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 499 }} />

      {/* Drawer */}
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0,
        width: "min(820px, 95vw)",
        background: "var(--color-bg-base)",
        borderLeft: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 500,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--color-border-faint)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>
              Carta Porte 3.1
            </div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {titleBase}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {subtitle}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            style={{
              width: "32px", height: "32px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-muted)", flexShrink: 0,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Stepper */}
        <div style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--color-border-faint)",
          background: "var(--color-bg-subtle)",
          overflowX: "auto", overflowY: "hidden",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: "6px", minWidth: "max-content" }}>
            {STEPS.map((step, idx) => {
              const isActive   = idx === currentStep;
              const isPast     = idx < currentStep;
              const errorCount = showValidation ? errorsCountByStep(step) : 0;
              const hasError   = errorCount > 0;

              return (
                <button key={step.id} onClick={() => setCurrentStep(idx)}
                  style={{
                    height: "32px", padding: "0 12px",
                    borderRadius: "var(--radius-md)",
                    border: isActive ? "1px solid var(--color-brand-blue)" : "1px solid transparent",
                    background: isActive ? "var(--color-brand-blue)" : (isPast ? "var(--color-bg-base)" : "transparent"),
                    color: isActive ? "#fff" : (isPast ? "var(--color-text-primary)" : "var(--color-text-muted)"),
                    fontSize: "12px", fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    whiteSpace: "nowrap",
                  }}>
                  <span style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    background: hasError ? "#dc2626" : (isActive ? "rgba(255,255,255,0.25)" : (isPast ? "var(--color-brand-blue)" : "var(--color-bg-base)")),
                    color: hasError ? "#fff" : (isActive ? "#fff" : (isPast ? "#fff" : "var(--color-text-muted)")),
                    fontSize: "10px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: !isActive && !isPast && !hasError ? "1px solid var(--color-border)" : "none",
                  }}>
                    {hasError ? "!" : (isPast ? "✓" : step.number)}
                  </span>
                  <span>{step.label}</span>
                  {hasError && (
                    <span style={{
                      padding: "1px 5px", borderRadius: "8px",
                      background: "rgba(220, 38, 38, 0.2)", color: "#fca5a5",
                      fontSize: "10px", fontWeight: 700,
                    }}>{errorCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {currentStepDef.id === "cliente" && (
            <ClienteSection
              data={data.base} setCliente={setCliente}
              showValidation={showValidation}
              errors={(groupedErrors as any).cliente ?? []}
              parentType={parentType}
            />
          )}
          {currentStepDef.id === "conceptos" && (
            <ConceptosSection
              data={data.base} setBase={setBase} parentType={parentType}
              showValidation={showValidation}
              errors={(groupedErrors as any).conceptos ?? []}
            />
          )}
          {currentStepDef.id === "datos_generales" && (
            <DatosGeneralesSection
              data={data.carta_porte} updateHeader={updateHeader} parentType={parentType}
              showValidation={showValidation} errors={groupedErrors.header ?? []}
            />
          )}
          {currentStepDef.id === "ubicaciones" && (
            <UbicacionesSection
              data={data.carta_porte} setUbicaciones={setUbicaciones}
              showValidation={showValidation} errors={groupedErrors.ubicaciones ?? []}
            />
          )}
          {currentStepDef.id === "mercancias" && (
            <MercanciasSection
              data={data.carta_porte} setMercancias={setMercancias}
              setMercanciasAgregado={setMercanciasAgregado}
              showValidation={showValidation} errors={groupedErrors.mercancias ?? []}
            />
          )}
          {currentStepDef.id === "modo_transporte" && (
            <ModoTransporteSection
              data={data.carta_porte}
              setAutotransporte={setAutotransporte} setMaritimo={setMaritimo}
              setAereo={setAereo} setFerroviario={setFerroviario}
              showValidation={showValidation} errors={groupedErrors.modo_transporte ?? []}
            />
          )}
          {currentStepDef.id === "figuras" && (
            <div>
              <FigurasSection
                data={data.carta_porte} setFiguras={setFiguras}
                showValidation={showValidation} errors={groupedErrors.figuras ?? []}
              />
              {data.carta_porte.header.transp_internac === "Sí" && (
                <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--color-border-faint)" }}>
                  <RegimenAduaneroSection
                    data={data.carta_porte} setRegimenes={setRegimenes}
                    showValidation={showValidation} errors={groupedErrors.regimen_aduanero ?? []}
                  />
                </div>
              )}
            </div>
          )}
          {currentStepDef.id === "resumen" && (
            <ResumenSection
              data={data} parentType={parentType}
              validation={validation} showValidation={showValidation}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, gap: "12px",
        }}>
          <button onClick={goPrev} disabled={currentStep === 0 || saving}
            style={{
              height: "38px", padding: "0 14px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-second)",
              fontSize: "12px", fontWeight: 600,
              cursor: (currentStep === 0 || saving) ? "not-allowed" : "pointer",
              opacity: (currentStep === 0 || saving) ? 0.4 : 1,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Anterior
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "11px" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              Paso {currentStep + 1} de {STEPS.length}
            </span>
            {showValidation && validation.errors.length > 0 && (
              <span style={{
                padding: "3px 8px", borderRadius: "var(--radius-md)",
                background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
                color: "var(--color-danger-text)", fontWeight: 700,
              }}>{validation.errors.length} {validation.errors.length === 1 ? "error" : "errores"}</span>
            )}
            {validation.ok && (
              <span style={{
                padding: "3px 8px", borderRadius: "var(--radius-md)",
                background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#22c55e", fontWeight: 700,
              }}>✓ Listo para timbrar</span>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {!isLastStep ? (
              <button onClick={goNext} disabled={saving}
                style={{
                  height: "38px", padding: "0 18px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--color-brand-blue)", border: "none",
                  color: "#fff", fontSize: "12px", fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.5 : 1,
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                Siguiente
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ) : (
              <>
                <button onClick={handleSaveDraft} disabled={!onSaveDraft || saving}
                  style={{
                    height: "38px", padding: "0 14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-subtle)",
                    color: "var(--color-text-second)",
                    fontSize: "12px", fontWeight: 600,
                    cursor: (!onSaveDraft || saving) ? "not-allowed" : "pointer",
                    opacity: (!onSaveDraft || saving) ? 0.5 : 1,
                  }}>
                  {saving ? "Guardando..." : "Guardar borrador"}
                </button>
                <button onClick={handleStamp} disabled={!onStamp || saving}
                  style={{
                    height: "38px", padding: "0 18px",
                    borderRadius: "var(--radius-md)",
                    background: "#16a34a", border: "none",
                    color: "#fff", fontSize: "12px", fontWeight: 700,
                    cursor: (!onStamp || saving) ? "not-allowed" : "pointer",
                    opacity: (!onStamp || saving) ? 0.5 : 1,
                  }}>
                  {saving ? "Timbrando..." : "Timbrar CFDI"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Sección de Resumen (inline)
// ─────────────────────────────────────────────────────────────
function ResumenSection({
  data, parentType, validation, showValidation,
}: {
  data: CFDIConCartaPorteData;
  parentType: CartaPorteParentType;
  validation: { ok: boolean; errors: any[] };
  showValidation: boolean;
}) {
  const totals = data.base.conceptos.reduce(
    (acc, c) => {
      const base = c.quantity * c.unit_price * (1 - c.discount_pct / 100);
      acc.subtotal += base;
      acc.iva += base * c.tax_rate;
      acc.ret += base * c.retention_rate;
      return acc;
    },
    { subtotal: 0, iva: 0, ret: 0 }
  );
  const total = totals.subtotal + totals.iva - totals.ret;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
      <div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "6px" }}>
          Paso final
        </div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Resumen del CFDI
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Verifica los datos antes de timbrar al SAT.
        </div>
      </div>

      {showValidation && !validation.ok && (
        <div style={{
          padding: "14px 16px", borderRadius: "var(--radius-md)",
          background: "var(--color-danger-bg)", border: "1px solid var(--color-danger-border)",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-danger-text)", marginBottom: "8px" }}>
            ⚠ {validation.errors.length} {validation.errors.length === 1 ? "error" : "errores"} pendientes
          </div>
          <ul style={{ margin: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "3px" }}>
            {validation.errors.slice(0, 10).map((e, i) => (
              <li key={i} style={{ fontSize: "12px", color: "var(--color-danger-text)" }}>{e.message}</li>
            ))}
            {validation.errors.length > 10 && (
              <li style={{ fontSize: "11px", color: "var(--color-danger-text)", opacity: 0.8 }}>… y {validation.errors.length - 10} más</li>
            )}
          </ul>
        </div>
      )}

      <SummaryCard title="Datos del CFDI">
        <Row label="Tipo" value={parentType === "factura_carta_porte" ? "Factura (I) + Carta Porte 3.1" : "Traslado (T) + Carta Porte 3.1"} />
        <Row label="Cliente" value={data.base.cliente.receiver_name || "—"} />
        <Row label="RFC receptor" value={data.base.cliente.receiver_rfc || "—"} mono />
        <Row label="Uso CFDI" value={data.base.cliente.receiver_cfdi_use} />
      </SummaryCard>

      {parentType === "factura_carta_porte" && (
        <SummaryCard title="Totales">
          <Row label="Subtotal" value={`${data.base.currency} $${totals.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
          <Row label="IVA" value={`${data.base.currency} $${totals.iva.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} />
          {totals.ret > 0 && <Row label="Retención" value={`− ${data.base.currency} $${totals.ret.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} danger />}
          <Row label="Total" value={`${data.base.currency} $${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`} highlight />
        </SummaryCard>
      )}

      <SummaryCard title="Resumen Carta Porte">
        <Row label="Operación" value={data.carta_porte.header.transp_internac === "Sí" ? "Internacional" : "Nacional"} />
        <Row label="Distancia total" value={`${data.carta_porte.header.total_dist_rec.toLocaleString("es-MX")} km`} />
        <Row label="Ubicaciones" value={String(data.carta_porte.ubicaciones.length)} />
        <Row label="Mercancías" value={String(data.carta_porte.mercancias.length)} />
        <Row label="Peso bruto" value={`${data.carta_porte.mercancias_agregado.peso_bruto_total.toLocaleString("es-MX")} ${data.carta_porte.mercancias_agregado.unidad_peso}`} />
        <Row label="Figuras" value={String(data.carta_porte.figuras.length)} />
      </SummaryCard>

      <div style={{
        padding: "12px 14px", borderRadius: "var(--radius-md)",
        background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)",
        fontSize: "12px", color: "#16a34a", lineHeight: 1.5,
      }}>
        ✓ Cuando todo esté correcto, presiona <strong>"Timbrar CFDI"</strong> para enviarlo al SAT vía Facturapi.
        El proceso es irreversible una vez timbrado.
      </div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: "var(--radius-md)",
      background: "var(--color-bg-subtle)", border: "1px solid var(--color-border-faint)",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, mono, highlight, danger }: { label: string; value: string; mono?: boolean; highlight?: boolean; danger?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span style={{
        fontWeight: highlight ? 700 : 600,
        color: danger ? "var(--color-danger-text)" : (highlight ? "var(--color-brand-blue)" : "var(--color-text-primary)"),
        fontFamily: mono ? "monospace" : undefined,
        fontSize: highlight ? "14px" : "12px",
      }}>{value}</span>
    </div>
  );
}
