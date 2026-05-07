"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Icon } from "./Icons";

// ═══════════════════════════════════════════════════════════════════════
// ComplementoSelectorModal
// 
// Modal que aparece tras presionar "Facturar" en un embarque o pedido.
// Pregunta al usuario si la factura requiere complemento y abre el drawer
// correspondiente:
//   · "none"               → CFDICreateDrawer (factura simple)
//   · "carta_porte"        → CFDICartaPorteDrawer
//   · "comercio_exterior"  → próximamente (deshabilitado)
// 
// Estilo ERP-grade: explicaciones claras, sin lógica condicional oculta.
// El usuario decide manualmente qué complemento aplica fiscalmente.
// ═══════════════════════════════════════════════════════════════════════

export type ComplementoType = "none" | "carta_porte" | "comercio_exterior";

export type ComplementoSelectorContext = {
  source:      "shipment" | "order";
  reference:   string;          // ej. LOG-MMA-0001 / PED-MMA-0001
  clientName?: string;
  currency?:   string;
  total?:      number;
};

interface Props {
  open: boolean;
  context: ComplementoSelectorContext | null;
  onClose: () => void;
  onConfirm: (complemento: ComplementoType) => void;
}

const fmt = (n: number) =>
  Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ComplementoSelectorModal({ open, context, onClose, onConfirm }: Props) {
  const { lang } = useTranslation();
  const es = lang !== "en";
  const [selected, setSelected] = useState<ComplementoType>("none");

  // Reset selection cuando se abre el modal
  useEffect(() => { if (open) setSelected("none"); }, [open]);

  if (!open || !context) return null;

  const sourceLabel = context.source === "shipment"
    ? (es ? "Servicio"  : "Service")
    : (es ? "Pedido"    : "Order");

  const options: {
    id: ComplementoType;
    iconName: "document" | "truck" | "globe";
    labelEs: string; labelEn: string;
    descEs:  string; descEn:  string;
    tipo:    string;
    disabled?: boolean;
    badgeEs?: string; badgeEn?: string;
  }[] = [
    {
      id: "none", iconName: "document",
      labelEs: "Factura simple",
      labelEn: "Simple invoice",
      descEs: "CFDI de Ingreso sin complemento. Recomendada para la mayoría de operaciones nacionales o servicios genéricos (consultoría, asesoría, comisiones, software).",
      descEn: "Income CFDI without complement. Recommended for most domestic operations or generic services (consulting, advisory, commissions, software).",
      tipo: "Tipo I",
    },
    {
      id: "carta_porte", iconName: "truck",
      labelEs: "Con Carta Porte 3.1",
      labelEn: "With Bill of Lading 3.1",
      descEs: "Obligatorio cuando tu empresa transporta físicamente la mercancía por carretera, vía marítima, aérea o ferroviaria. NO aplica si solo subcontratas el transporte a un tercero.",
      descEn: "Required when your company physically transports goods by road, sea, air or rail. Does NOT apply if you only subcontract transport to a third party.",
      tipo: "Tipo I + CCP 3.1",
    },
    {
      id: "comercio_exterior", iconName: "globe",
      labelEs: "Con Comercio Exterior",
      labelEn: "With Foreign Trade",
      descEs: "Para exportaciones definitivas de mercancías al extranjero. Requiere pedimento aduanal, fracción arancelaria, INCOTERM y datos del destinatario internacional.",
      descEn: "For definitive export of goods abroad. Requires customs petition, tariff fraction, INCOTERM and international receiver data.",
      tipo: "Tipo I + ComEx",
      disabled: true,
      badgeEs: "Próximamente", badgeEn: "Coming soon",
    },
  ];

  function handleConfirm() {
    if (selected === "comercio_exterior") return; // disabled — no hacer nada
    onConfirm(selected);
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 599 }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(680px, 95vw)", maxHeight: "90vh",
        background: "var(--color-bg-base)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 600,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--color-border-faint)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-brand-blue)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>
              {es ? "Antes de emitir el CFDI" : "Before issuing the CFDI"}
            </div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {es ? "¿Esta factura requiere algún complemento?" : "Does this invoice need any complement?"}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
              {sourceLabel}{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--color-text-primary)" }}>
                {context.reference}
              </span>
              {context.clientName && <> · {context.clientName}</>}
              {context.currency && context.total != null && (
                <> · <strong>{context.currency} ${fmt(context.total)}</strong></>
              )}
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar"
            style={{
              width: "32px", height: "32px", borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)", background: "var(--color-bg-subtle)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--color-text-muted)", flexShrink: 0,
            }}>
            <Icon name="x" size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Body — 3 cards (radio buttons grandes) */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {options.map((opt) => {
            const isSelected = selected === opt.id;
            const isDisabled = !!opt.disabled;
            return (
              <button
                key={opt.id}
                disabled={isDisabled}
                onClick={() => !isDisabled && setSelected(opt.id)}
                style={{
                  textAlign: "left",
                  padding: "16px 18px",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${
                    isSelected   ? "var(--color-brand-blue)" :
                    isDisabled   ? "var(--color-border-faint)" : "var(--color-border)"
                  }`,
                  background:
                    isSelected   ? "var(--color-info-bg)" :
                    isDisabled   ? "var(--color-bg-subtle)" : "var(--color-bg-base)",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  opacity: isDisabled ? 0.55 : 1,
                  display: "flex", gap: "14px", alignItems: "flex-start",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isSelected) {
                    e.currentTarget.style.borderColor = "var(--color-brand-blue)";
                    e.currentTarget.style.background  = "var(--color-info-bg)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled && !isSelected) {
                    e.currentTarget.style.borderColor = "var(--color-border)";
                    e.currentTarget.style.background  = "var(--color-bg-base)";
                  }
                }}>

                {/* Radio circle */}
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  border: `2px solid ${isSelected ? "var(--color-brand-blue)" : "var(--color-border)"}`,
                  background: "var(--color-bg-base)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "2px",
                }}>
                  {isSelected && (
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--color-brand-blue)" }} />
                  )}
                </div>

                {/* Icon */}
                <div style={{
                  width: "42px", height: "42px", borderRadius: "var(--radius-md)",
                  background: isSelected ? "rgba(59, 130, 246, 0.12)" : "var(--color-bg-subtle)",
                  color: isSelected ? "var(--color-brand-blue)" : "var(--color-text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name={opt.iconName} size={22} strokeWidth={1.7} />
                </div>

                {/* Texto */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {es ? opt.labelEs : opt.labelEn}
                    </div>
                    <span style={{
                      fontSize: "9px", fontWeight: 700, padding: "2px 6px",
                      borderRadius: "var(--radius-full)",
                      background: "var(--color-bg-subtle)",
                      color: "var(--color-text-muted)",
                      fontFamily: "monospace",
                    }}>
                      {opt.tipo}
                    </span>
                    {isDisabled && (
                      <span style={{
                        fontSize: "9px", fontWeight: 700, padding: "2px 7px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-warning-bg)",
                        color: "var(--color-warning-text)",
                        border: "1px solid var(--color-warning-border)",
                      }}>
                        {es ? opt.badgeEs : opt.badgeEn}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.55 }}>
                    {es ? opt.descEs : opt.descEn}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--color-border-faint)",
          display: "flex", justifyContent: "flex-end", gap: "10px",
          flexShrink: 0,
          background: "var(--color-bg-subtle)",
        }}>
          <button onClick={onClose}
            style={{
              height: "38px", padding: "0 18px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-bg-base)",
              color: "var(--color-text-second)",
              fontSize: "12px", fontWeight: 600,
              cursor: "pointer",
            }}>
            {es ? "Cancelar" : "Cancel"}
          </button>
          <button onClick={handleConfirm}
            disabled={selected === "comercio_exterior"}
            style={{
              height: "38px", padding: "0 22px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: "var(--color-brand-blue)",
              color: "#fff",
              fontSize: "12px", fontWeight: 700,
              cursor: selected === "comercio_exterior" ? "not-allowed" : "pointer",
              opacity: selected === "comercio_exterior" ? 0.5 : 1,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
            {es ? "Continuar" : "Continue"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}