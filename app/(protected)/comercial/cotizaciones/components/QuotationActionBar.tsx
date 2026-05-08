"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Quotation } from "../types/quotations.types";
import {
  isQuotationEditable,
  getQuotationEditBlockReason,
  STATUS_CONFIG,
} from "../types/quotations.types";
import {
  IconEdit,
  IconCopy,
  IconDownload,
  IconSend,
  IconTrash,
  IconArrowRight,
  IconCheck,
  IconLock,
  IconAlertTriangle,
  IconX,
} from "./Icons";

// ═══════════════════════════════════════════════════════════════════
// QUOTATION ACTION BAR — Barra de acciones jerárquica nivel ERP
//
// Patrón SAP/Salesforce: agrupar acciones por intención
//   Grupo 1 (Edición)        → Editar · Duplicar
//   Grupo 2 (Distribución)   → Descargar PDF · Enviar por correo
//   Grupo 3 (Conversión)     → Aceptar (solo borrador/enviada)
//   Grupo 4 (Destructiva)    → Eliminar
//   Grupo 5 (Navegación)     → Ver embarque/pedido vinculado
//
// Reglas de bloqueo:
//   - Cotización aceptada     → NO editable (audit trail). Mostrar tooltip.
//   - Cotización cancelada    → NO editable.
//   - Sin embarque ni pedido  → No mostrar grupo "Navegación".
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
  onEdit: () => void;
  onDuplicate: () => Promise<void>;
  onDownloadPDF: () => void;
  onSend?: () => void;
  onDelete: () => Promise<void>;
  onAccept?: () => void;
  onMarkSent?: () => void;
  onReject?: () => void;
  saving?: boolean;
};

export default function QuotationActionBar({
  quotation,
  onEdit,
  onDuplicate,
  onDownloadPDF,
  onSend,
  onDelete,
  onAccept,
  onMarkSent,
  onReject,
  saving = false,
}: Props) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const editable = isQuotationEditable(quotation);
  const blockReason = getQuotationEditBlockReason(quotation);
  const cfg = STATUS_CONFIG[quotation.status] ?? STATUS_CONFIG.draft;

  // Navegación a entidad vinculada (embarque o pedido)
  const linkedShipmentId = (quotation as any).shipment_id as string | null | undefined;
  const linkedOrderId = (quotation as any).order_id as string | null | undefined;
  const linkedType = linkedShipmentId
    ? "shipment"
    : linkedOrderId
      ? "order"
      : null;
  const linkedLabel =
    linkedType === "shipment" ? "Ver embarque" : linkedType === "order" ? "Ver pedido" : "";
  const linkedHref =
    linkedType === "shipment"
      ? `/logistica/embarques?id=${linkedShipmentId}`
      : linkedType === "order"
        ? `/comercial/pedidos?id=${linkedOrderId}`
        : "";

  // Aceptar disponible solo en estados pre-aceptación
  const canAccept =
    onAccept &&
    (quotation.status === "draft" ||
      quotation.status === "sent" ||
      quotation.status === "viewed");

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      await onDuplicate();
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      // Auto-cancelar el "confirmar" después de 4s
      setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    await onDelete();
    setConfirmingDelete(false);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 14px",
        background: "var(--color-bg-base)",
        border: "1px solid var(--color-border-faint)",
        borderRadius: "var(--radius-lg)",
        flexWrap: "wrap",
      }}
    >
      {/* CONTEXT — Folio + status badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingRight: "10px",
          borderRight: "1px solid var(--color-border-faint)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: "13px",
            fontWeight: 800,
            color: "var(--color-text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {quotation.quote_number}
        </div>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: "var(--radius-full)",
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid ${cfg.border}`,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          {quotation.status}
        </span>
      </div>

      {/* GRUPO 1 — EDICIÓN */}
      <div style={{ display: "flex", gap: "6px" }}>
        <ActionButton
          icon={editable ? <IconEdit size={13} /> : <IconLock size={13} />}
          label="Editar"
          onClick={onEdit}
          disabled={!editable || saving}
          variant="primary"
          tooltip={blockReason ?? undefined}
        />
        <ActionButton
          icon={<IconCopy size={13} />}
          label={duplicating ? "Duplicando…" : "Duplicar"}
          onClick={handleDuplicate}
          disabled={duplicating || saving}
          variant="secondary"
          tooltip="Crea una nueva cotización con folio nuevo, copiando los mismos datos"
        />
      </div>

      {/* SEPARADOR */}
      <Divider />

      {/* GRUPO 2 — DISTRIBUCIÓN */}
      <div style={{ display: "flex", gap: "6px" }}>
        <ActionButton
          icon={<IconDownload size={13} />}
          label="PDF"
          onClick={onDownloadPDF}
          disabled={saving}
          variant="secondary"
        />
        {onSend && (
          <ActionButton
            icon={<IconSend size={13} />}
            label="Enviar"
            onClick={onSend}
            disabled={saving}
            variant="secondary"
            tooltip={
              quotation.contact_email
                ? `Enviar a ${quotation.contact_email}`
                : "Sin correo de contacto"
            }
          />
        )}
      </div>

      {/* SEPARADOR + GRUPO 3 — CAMBIO DE ESTADO (Marcar enviada / Aceptar / Rechazar) */}
      {(quotation.status === "draft" ||
        quotation.status === "sent" ||
        quotation.status === "viewed") && (
        <>
          <Divider />
          <div style={{ display: "flex", gap: "6px" }}>
            {/* Marcar enviada — solo si está en borrador */}
            {quotation.status === "draft" && onMarkSent && (
              <ActionButton
                icon={<IconSend size={13} />}
                label="Marcar enviada"
                onClick={onMarkSent}
                disabled={saving}
                variant="primary"
                tooltip="Cambiar estado a Enviada (sin enviar email)"
              />
            )}
            {/* Aceptar — disponible en draft/sent/viewed */}
            {canAccept && (
              <ActionButton
                icon={<IconCheck size={13} />}
                label="Aceptar"
                onClick={onAccept}
                disabled={saving}
                variant="success"
                tooltip={
                  quotation.type === "services"
                    ? "Aceptar cotización y generar embarque"
                    : "Aceptar cotización y generar pedido"
                }
              />
            )}
            {/* Rechazar — solo si está enviada/vista */}
            {(quotation.status === "sent" || quotation.status === "viewed") &&
              onReject && (
                <ActionButton
                  icon={<IconX size={13} />}
                  label="Rechazar"
                  onClick={onReject}
                  disabled={saving}
                  variant="danger"
                  tooltip="Cambiar estado a Rechazada (cliente declinó)"
                />
              )}
          </div>
        </>
      )}

      {/* SEPARADOR + GRUPO 4 — ELIMINAR */}
      <Divider />
      <ActionButton
        icon={confirmingDelete ? <IconAlertTriangle size={13} /> : <IconTrash size={13} />}
        label={confirmingDelete ? "Confirmar eliminar" : "Eliminar"}
        onClick={handleDelete}
        disabled={saving}
        variant={confirmingDelete ? "danger-confirm" : "danger"}
      />

      {/* GRUPO 5 — NAVEGACIÓN (a la derecha) */}
      {linkedType && (
        <>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => router.push(linkedHref)}
            style={{
              height: "32px",
              padding: "0 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-info-bg)",
              border: "1px solid var(--color-info-border)",
              color: "var(--color-info-text)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              flexShrink: 0,
              transition: "var(--transition-fast)",
            }}
          >
            {linkedLabel}
            <IconArrowRight size={13} />
          </button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ActionButton — botón estandarizado con variantes
// ═══════════════════════════════════════════════════════════════════
function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant = "secondary",
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "success" | "danger" | "danger-confirm";
  tooltip?: string;
}) {
  type VariantStyle = { bg: string; border: string; color: string; hoverBg?: string };
  const variants: Record<string, VariantStyle> = {
    primary: {
      bg: "var(--color-info-bg)",
      border: "var(--color-info-border)",
      color: "var(--color-info-text)",
    },
    secondary: {
      bg: "var(--color-bg-subtle)",
      border: "var(--color-border)",
      color: "var(--color-text-second)",
    },
    success: {
      bg: "var(--color-success-text)",
      border: "var(--color-success-text)",
      color: "#fff",
    },
    danger: {
      bg: "var(--color-bg-subtle)",
      border: "var(--color-danger-border)",
      color: "var(--color-danger-text)",
    },
    "danger-confirm": {
      bg: "var(--color-danger-text)",
      border: "var(--color-danger-text)",
      color: "#fff",
    },
  };
  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      style={{
        height: "32px",
        padding: "0 12px",
        borderRadius: "var(--radius-md)",
        background: disabled ? "var(--color-bg-subtle)" : v.bg,
        border: `1px solid ${disabled ? "var(--color-border-faint)" : v.border}`,
        color: disabled ? "var(--color-text-muted)" : v.color,
        fontSize: "12px",
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        opacity: disabled ? 0.5 : 1,
        transition: "var(--transition-fast)",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "var(--color-border-faint)",
        flexShrink: 0,
      }}
    />
  );
}