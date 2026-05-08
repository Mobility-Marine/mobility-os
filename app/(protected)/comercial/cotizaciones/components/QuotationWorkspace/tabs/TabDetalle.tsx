"use client";

import React from "react";
import type { Quotation } from "../../../types/quotations.types";
import {
  IconUser,
  IconCalendar,
  IconFileText,
  IconClock,
} from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// TAB DETALLE — Vista enriquecida de información de la cotización
//
// Secciones (estilo SAP/Salesforce Lightning):
//   1. Información del cliente
//   2. Configuración (vigencia · idioma · IVA · descuento)
//   3. General info del subtipo de servicio (si aplica)
//   4. Notas
//   5. Términos y condiciones
//   6. Audit trail compacto
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
};

export default function TabDetalle({ quotation }: Props) {
  const clientName = quotation.client?.name ?? quotation.client_name;
  const clientRfc = quotation.client?.rfc ?? quotation.client_rfc;
  const clientEmail = quotation.client?.email ?? quotation.client_email;

  // Extraer general_info legible (depende del subtipo)
  const generalInfo = (quotation.general_info ?? {}) as Record<string, any>;
  const generalEntries = Object.entries(generalInfo).filter(
    ([, v]) =>
      v !== null && v !== undefined && v !== "" && typeof v !== "object",
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* SECCIÓN 1 — Cliente */}
      <Section title="Información del cliente" icon={<IconUser size={13} />}>
        <FieldGrid>
          <Field label="Cliente" value={clientName ?? "—"} bold />
          <Field label="RFC" value={clientRfc ?? "—"} mono />
          <Field label="Email" value={clientEmail ?? "—"} />
          <Field label="Contacto" value={quotation.contact_name ?? "—"} />
          <Field label="Email contacto" value={quotation.contact_email ?? "—"} />
          <Field label="Cargo" value={quotation.contact_title ?? "—"} />
        </FieldGrid>
      </Section>

      {/* SECCIÓN 2 — Configuración */}
      <Section title="Configuración" icon={<IconFileText size={13} />}>
        <FieldGrid>
          <Field
            label="Tipo"
            value={quotation.type === "services" ? "Servicios" : "Productos"}
            bold
          />
          {quotation.service_subtype && (
            <Field
              label="Subtipo"
              value={quotation.service_subtype.replace(/_/g, " ").toUpperCase()}
              bold
            />
          )}
          <Field
            label="Idioma"
            value={quotation.language === "en" ? "Inglés" : "Español"}
          />
          <Field label="Plantilla" value={quotation.template ?? "Default"} />
          <Field
            label="Moneda principal"
            value={quotation.currency ?? "MXN"}
            bold
          />
          <Field
            label="IVA"
            value={`${quotation.tax_rate ?? 16}%`}
            mono
          />
          <Field
            label="Descuento"
            value={
              quotation.discount_amount && Number(quotation.discount_amount) > 0
                ? `$${Number(quotation.discount_amount).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}`
                : "—"
            }
            mono
          />
        </FieldGrid>
      </Section>

      {/* SECCIÓN 3 — Vigencia */}
      <Section title="Vigencia" icon={<IconCalendar size={13} />}>
        <FieldGrid>
          <Field
            label="Creada"
            value={new Date(quotation.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          {quotation.valid_until && (
            <Field
              label="Vence"
              value={new Date(quotation.valid_until).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              bold
            />
          )}
          {quotation.valid_until && (
            <Field
              label="Estado vigencia"
              value={getValidityLabel(quotation.valid_until)}
              valueColor={getValidityColor(quotation.valid_until)}
            />
          )}
        </FieldGrid>
      </Section>

      {/* SECCIÓN 4 — General info del subtipo (campos adicionales) */}
      {generalEntries.length > 0 && (
        <Section title="Información del servicio">
          <FieldGrid>
            {generalEntries.map(([key, value]) => (
              <Field
                key={key}
                label={key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                value={String(value)}
              />
            ))}
          </FieldGrid>
        </Section>
      )}

      {/* SECCIÓN 5 — Notas */}
      {quotation.notes && quotation.notes.trim() && (
        <Section title="Notas">
          <div
            style={{
              padding: "10px 12px",
              background: "var(--color-bg-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-faint)",
              fontSize: "11px",
              color: "var(--color-text-second)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {quotation.notes}
          </div>
        </Section>
      )}

      {/* SECCIÓN 6 — Términos */}
      {quotation.terms && quotation.terms.trim() && (
        <Section title="Términos y condiciones">
          <div
            style={{
              padding: "10px 12px",
              background: "var(--color-bg-subtle)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border-faint)",
              fontSize: "11px",
              color: "var(--color-text-second)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
            }}
          >
            {quotation.terms}
          </div>
        </Section>
      )}

      {/* SECCIÓN 7 — Audit trail compacto */}
      <Section title="Audit trail" icon={<IconClock size={13} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <AuditRow
            label="Creada"
            timestamp={quotation.created_at}
            color="var(--color-text-muted)"
          />
          {quotation.updated_at && quotation.updated_at !== quotation.created_at && (
            <AuditRow
              label="Última modificación"
              timestamp={quotation.updated_at}
              color="var(--color-text-muted)"
            />
          )}
          {quotation.sent_at && (
            <AuditRow
              label="Enviada"
              timestamp={quotation.sent_at}
              color="var(--color-info-text)"
            />
          )}
          {quotation.accepted_at && (
            <AuditRow
              label="Aceptada"
              timestamp={quotation.accepted_at}
              color="var(--color-success-text)"
            />
          )}
          {quotation.rejected_at && (
            <AuditRow
              label="Rechazada"
              timestamp={quotation.rejected_at}
              color="var(--color-danger-text)"
            />
          )}
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
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
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "10px",
          paddingBottom: "8px",
          borderBottom: "1px solid var(--color-border-faint)",
        }}
      >
        {icon && <span style={{ color: "var(--color-text-muted)" }}>{icon}</span>}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
          }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "10px",
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  bold,
  mono,
  valueColor,
}: {
  label: string;
  value: string;
  bold?: boolean;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
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
          color: valueColor ?? "var(--color-text-primary)",
          fontVariantNumeric: mono ? "tabular-nums" : "normal",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function AuditRow({
  label,
  timestamp,
  color,
}: {
  label: string;
  timestamp: string;
  color: string;
}) {
  const date = new Date(timestamp);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 8px",
        background: "var(--color-bg-subtle)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <span style={{ fontSize: "11px", fontWeight: 700, color }}>{label}</span>
      <span
        style={{
          fontSize: "10px",
          color: "var(--color-text-muted)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {date.toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}{" "}
        ·{" "}
        {date.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS — Vigencia
// ═══════════════════════════════════════════════════════════════════

function getValidityLabel(validUntil: string): string {
  const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000);
  if (days < 0) return `Vencida hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vigente · ${days} días restantes`;
}

function getValidityColor(validUntil: string): string {
  const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000);
  if (days < 0) return "var(--color-danger-text)";
  if (days <= 3) return "var(--color-warning-text)";
  return "var(--color-success-text)";
}