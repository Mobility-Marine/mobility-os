"use client";

import React, { useState } from "react";
import type { Quotation } from "../../../types/quotations.types";
import {
  IconDownload,
  IconMail,
  IconFileText,
} from "../../Icons";
import { IconInfo } from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// TAB PDF / ENVÍO — Generación y distribución del documento
//
// Secciones:
//   1. Acción principal: descargar PDF (CTA grande)
//   2. Información del documento (plantilla · tipo · totales)
//   3. Composición del envío por correo (placeholder hasta Brevo SMTP)
//   4. Historial de envíos (futuro)
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
  onDownload: () => void;
  saving: boolean;
};

export default function TabPDF({ quotation, onDownload, saving }: Props) {
  const [emailTo, setEmailTo] = useState(
    quotation.contact_email ?? quotation.client_email ?? "",
  );
  const [emailCc, setEmailCc] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Cotización ${quotation.quote_number}`,
  );
  const [emailMessage, setEmailMessage] = useState("");

  // Calcular totales por moneda para mostrar en metadata
  const concepts = (quotation as any).billing_concepts ?? [];
  const items = quotation.items ?? [];
  const totals: Record<string, number> = {};
  if (concepts.length > 0) {
    for (const c of concepts) {
      for (const line of c.lines ?? []) {
        const cur = line.currency ?? c.currency ?? quotation.currency ?? "MXN";
        const price = Number(line.price ?? 0);
        const rate = line.tax_rate;
        const tax =
          rate === null || rate === undefined || rate === -1 || rate <= 0
            ? 0
            : price * (Number(rate) / 100);
        totals[cur] = (totals[cur] ?? 0) + price + tax;
      }
    }
  } else {
    totals[quotation.currency ?? "MXN"] = quotation.total ?? 0;
  }

  const fmt = (n: number, cur: string) => {
    const symbol = cur === "USD" ? "USD $" : cur === "EUR" ? "€" : "$";
    return `${symbol}${n.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* SECCIÓN 1 — CTA principal: Descargar PDF */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--color-info-bg) 0%, var(--color-bg-base) 100%)",
          border: "1px solid var(--color-info-border)",
          borderRadius: "var(--radius-lg)",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-info-text)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconFileText size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--color-text-primary)",
              }}
            >
              Documento PDF de la cotización
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-text-muted)",
                marginTop: "2px",
              }}
            >
              Genera y descarga el PDF con la plantilla configurada en la empresa
            </div>
          </div>
        </div>
        <button
          onClick={onDownload}
          disabled={saving}
          style={{
            height: "42px",
            padding: "0 18px",
            borderRadius: "var(--radius-md)",
            background: saving ? "var(--color-bg-subtle)" : "var(--color-info-text)",
            color: saving ? "var(--color-text-muted)" : "#fff",
            border: "none",
            fontSize: "13px",
            fontWeight: 800,
            cursor: saving ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <IconDownload size={15} strokeWidth={2.5} />
          {saving ? "Generando…" : "Descargar PDF"}
        </button>
      </div>

      {/* SECCIÓN 2 — Información del documento */}
      <Section title="Información del documento">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          <Field label="Folio" value={quotation.quote_number} mono bold />
          <Field
            label="Plantilla"
            value={quotation.template ?? "Mobility OS"}
            bold
          />
          <Field
            label="Tipo"
            value={
              quotation.type === "services"
                ? quotation.service_subtype
                  ? quotation.service_subtype.replace(/_/g, " ").toUpperCase()
                  : "Servicios"
                : "Productos"
            }
          />
          <Field
            label="Idioma"
            value={quotation.language === "en" ? "Inglés" : "Español"}
          />
          <Field
            label={quotation.type === "services" ? "Conceptos" : "Productos"}
            value={
              quotation.type === "services"
                ? `${concepts.length}`
                : `${items.length}`
            }
            mono
          />
          <Field
            label="Líneas totales"
            value={
              quotation.type === "services"
                ? `${concepts.reduce((s: number, c: any) => s + (c.lines?.length ?? 0), 0)}`
                : `${items.length}`
            }
            mono
          />
        </div>
        {/* Totales por moneda */}
        <div
          style={{
            marginTop: "12px",
            padding: "10px 12px",
            background: "var(--color-bg-subtle)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Total a desplegar en PDF
          </span>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {Object.entries(totals).map(([cur, val]) => (
              <span
                key={cur}
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "var(--color-success-text)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {fmt(val, cur)}
                {Object.keys(totals).length > 1 && (
                  <span
                    style={{
                      fontSize: "9px",
                      opacity: 0.65,
                      marginLeft: "4px",
                      fontWeight: 700,
                    }}
                  >
                    {cur}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* SECCIÓN 3 — Envío por correo (placeholder hasta Brevo SMTP activado) */}
      <Section title="Envío por correo">
        <div
          style={{
            padding: "10px 12px",
            background: "var(--color-warning-bg)",
            border: "1px solid var(--color-warning-border)",
            borderRadius: "var(--radius-md)",
            fontSize: "11px",
            color: "var(--color-warning-text)",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            marginBottom: "12px",
            lineHeight: 1.5,
          }}
        >
          <IconInfo size={14} />
          <span>
            <strong>Próximamente:</strong> El envío por correo se habilitará al activar
            la cuenta SMTP de Brevo (pendiente verificación en la cuenta de soporte). Por
            ahora, descarga el PDF y envíalo desde tu cliente de correo.
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", opacity: 0.6 }}>
          <EmailField
            label="Para"
            value={emailTo}
            onChange={setEmailTo}
            disabled
            placeholder="cliente@empresa.com"
          />
          <EmailField
            label="CC (opcional)"
            value={emailCc}
            onChange={setEmailCc}
            disabled
            placeholder="contacto@empresa.com, otro@empresa.com"
          />
          <EmailField
            label="Asunto"
            value={emailSubject}
            onChange={setEmailSubject}
            disabled
          />
          <div>
            <label
              style={{
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.4px",
                display: "block",
                marginBottom: "4px",
              }}
            >
              Mensaje
            </label>
            <textarea
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              disabled
              placeholder="Mensaje opcional para el cuerpo del correo…"
              rows={3}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg-subtle)",
                color: "var(--color-text-primary)",
                fontSize: "12px",
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            disabled
            style={{
              height: "38px",
              padding: "0 16px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-bg-subtle)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <IconMail size={14} />
            Enviar cotización (próximamente)
          </button>
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--color-border-faint)",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  bold,
  mono,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span
        style={{
          fontSize: "9px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: bold ? 700 : 600,
          color: "var(--color-text-primary)",
          fontVariantNumeric: mono ? "tabular-nums" : "normal",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function EmailField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        style={{
          fontSize: "9px",
          fontWeight: 700,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.4px",
          display: "block",
          marginBottom: "4px",
        }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "32px",
          padding: "0 10px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          background: "var(--color-bg-subtle)",
          color: "var(--color-text-primary)",
          fontSize: "12px",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}