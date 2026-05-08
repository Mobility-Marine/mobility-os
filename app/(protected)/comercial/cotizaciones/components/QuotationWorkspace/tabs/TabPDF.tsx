"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { Quotation } from "../../../types/quotations.types";
import { useTenant } from "@/lib/tenant/TenantProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  sendQuotationEmail,
  parseEmails,
  loadQuotationSendHistory,
  type QuotationSendHistory,
} from "../../../services/quotations.email";
import {
  IconDownload,
  IconMail,
  IconCheck,
  IconAlertCircle,
  IconRefresh,
} from "@/app/components/shared/Icons";

// ═══════════════════════════════════════════════════════════════════
// TAB PDF / ENVÍO — Composer real conectado a Brevo
//
// Secciones:
//   1. Acción principal: descargar PDF
//   2. Información del documento (totales por moneda)
//   3. Indicador de envíos previos (si los hay)
//   4. Composer del correo: Para, CC, CCO, Asunto, Mensaje, Enviar
//
// Reply-to automático apunta al usuario actual: cuando el cliente
// responda, el correo llega al emisor, no al sender genérico.
// ═══════════════════════════════════════════════════════════════════

type Props = {
  quotation: Quotation;
  onDownload: () => void;
  saving: boolean;
};

export default function TabPDF({ quotation, onDownload, saving }: Props) {
  const { companyId } = useTenant();
  const { user: currentUser, loading: userLoading } = useCurrentUser();

  // ─── Estados del composer ──────────────────────────────────────────
  const [emailTo, setEmailTo] = useState(
    quotation.contact_email ?? quotation.client_email ?? "",
  );
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [emailSubject, setEmailSubject] = useState(
    `Cotización ${quotation.quote_number ?? ""}`,
  );
  const [emailMessage, setEmailMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [history, setHistory] = useState<QuotationSendHistory>({ count: 0, lastAt: null, lastTo: null });

  // ─── Re-sync cuando cambia la cotización ───────────────────────────
  useEffect(() => {
    setEmailTo(quotation.contact_email ?? quotation.client_email ?? "");
    setEmailCc("");
    setEmailBcc("");
    setEmailSubject(`Cotización ${quotation.quote_number ?? ""}`);
    setFeedback(null);
  }, [quotation.id]);

  // ─── Plantilla pre-cargada del mensaje ─────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const contactName = quotation.contact_name?.trim() || quotation.client_name?.trim() || "";
    const validUntil = quotation.valid_until;
    const validUntilStr = validUntil
      ? new Date(validUntil).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })
      : "";

    const greeting = contactName ? `Estimado/a ${contactName},` : "Estimado/a cliente,";
    const intro = `Adjunto encontrará la cotización ${quotation.quote_number ?? ""}${validUntilStr ? ` con vigencia al ${validUntilStr}` : ""}.`;
    const closing = "Quedo a sus órdenes para cualquier duda o aclaración. Será un placer atenderle.";

    setEmailMessage(`${greeting}\n\n${intro}\n\n${closing}`);
  }, [quotation.id, currentUser?.id]);

  // ─── Cargar historial de envíos ────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const h = await loadQuotationSendHistory(quotation.id);
      if (!cancelled) setHistory(h);
    }
    void load();
    return () => { cancelled = true; };
  }, [quotation.id]);

  // ─── Totales por moneda para info del documento ────────────────────
  const totalsByCurrency = useMemo(() => {
    const concepts = (quotation as any).billing_concepts ?? [];
    const items    = quotation.items ?? [];
    const totals: Record<string, number> = {};
    if (concepts.length > 0) {
      for (const c of concepts) {
        for (const line of c.lines ?? []) {
          const cur = line.currency ?? c.currency ?? quotation.currency ?? "MXN";
          const price = Number(line.price ?? 0);
          const rate = line.tax_rate;
          const tax = rate === null || rate === undefined || rate === -1 || Number(rate) <= 0
            ? 0
            : price * (Number(rate) / 100);
          totals[cur] = (totals[cur] ?? 0) + price + tax;
        }
      }
    } else {
      totals[quotation.currency ?? "MXN"] = Number(quotation.total ?? 0);
    }
    return totals;
  }, [quotation]);

  const fmt = (n: number, cur: string) => {
    const num = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    return `$${num} ${cur}`;
  };

  // ─── Validación del formulario ─────────────────────────────────────
  const canSend = useMemo(() => {
    if (sending || userLoading || !currentUser) return false;
    if (!emailTo.trim() || !/\S+@\S+\.\S+/.test(emailTo.trim())) return false;
    if (!emailSubject.trim()) return false;
    if (!emailMessage.trim()) return false;
    return true;
  }, [sending, userLoading, currentUser, emailTo, emailSubject, emailMessage]);

  // ─── Envío ─────────────────────────────────────────────────────────
  async function handleSend() {
    if (!canSend || !currentUser || !companyId) return;

    setSending(true);
    setFeedback(null);

    try {
      const result = await sendQuotationEmail({
        quotation,
        companyId,
        currentUser,
        to:          emailTo.trim(),
        cc:          parseEmails(emailCc),
        bcc:         parseEmails(emailBcc),
        subject:     emailSubject.trim(),
        userMessage: emailMessage,
      });

      if (result.success) {
        setFeedback({ type: "success", text: `Cotización enviada correctamente a ${emailTo.trim()}` });
        // Refrescar historial
        const h = await loadQuotationSendHistory(quotation.id);
        setHistory(h);
      } else {
        setFeedback({ type: "error", text: result.error ?? "Error desconocido al enviar" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message ?? "Error inesperado" });
    } finally {
      setSending(false);
    }
  }

  // ─── Helpers de presentación ───────────────────────────────────────
  const lastSentRelative = (() => {
    if (!history.lastAt) return null;
    const d = new Date(history.lastAt);
    const diffMs = Date.now() - d.getTime();
    const diffH  = Math.floor(diffMs / 3600000);
    if (diffH < 1)   return "hace menos de una hora";
    if (diffH < 24)  return `hace ${diffH} ${diffH === 1 ? "hora" : "horas"}`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30)  return `hace ${diffD} ${diffD === 1 ? "día" : "días"}`;
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  })();

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "20px 24px", overflowY: "auto", height: "100%" }}>

      {/* ═══ DESCARGA PDF ═══ */}
      <div
        style={{
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
            Documento PDF
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {quotation.quote_number}.pdf · plantilla {quotation.template ?? "elegante"}
          </div>
        </div>
        <button
          onClick={onDownload}
          disabled={saving}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-blue)",
            border: "1px solid var(--color-brand-blue)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <IconDownload size={15} />
          {saving ? "Generando..." : "Descargar PDF"}
        </button>
      </div>

      {/* ═══ INFO DOCUMENTO (totales por moneda) ═══ */}
      <div
        style={{
          background: "var(--color-bg-subtle)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding: "14px 18px",
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 24px",
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
            Cliente
          </div>
          <div style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 600 }}>
            {quotation.client_name ?? "—"}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>
            Total
          </div>
          {Object.entries(totalsByCurrency).map(([cur, val]) => (
            <div key={cur} style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
              {fmt(val, cur)}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ INDICADOR DE ENVÍOS PREVIOS ═══ */}
      {history.count > 0 && (
        <div
          style={{
            background: "color-mix(in srgb, var(--color-brand-blue) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-brand-blue) 25%, transparent)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            color: "var(--color-text-primary)",
          }}
        >
          <IconRefresh size={14} style={{ color: "var(--color-brand-blue)" }} />
          <span>
            <strong>Enviada {history.count} {history.count === 1 ? "vez" : "veces"}.</strong>
            {history.lastTo && lastSentRelative && (
              <> Última: a <strong>{history.lastTo}</strong> {lastSentRelative}.</>
            )}
          </span>
        </div>
      )}

      {/* ═══ COMPOSER ═══ */}
      <div
        style={{
          background: "var(--color-bg-base)",
          border: "1px solid var(--color-border-faint)",
          borderRadius: "var(--radius-lg)",
          padding: "18px 20px",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>
          Envío por correo
        </div>

        {/* Para */}
        <Field label="Para" required>
          <input
            type="email"
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
            placeholder="cliente@empresa.com"
            disabled={sending}
            style={inputStyle}
          />
        </Field>

        {/* CC */}
        <Field label="CC" hint="Separados por coma">
          <input
            type="text"
            value={emailCc}
            onChange={e => setEmailCc(e.target.value)}
            placeholder="contacto@empresa.com, otro@empresa.com"
            disabled={sending}
            style={inputStyle}
          />
        </Field>

        {/* CCO */}
        <Field label="CCO" hint="Copia oculta — separados por coma">
          <input
            type="text"
            value={emailBcc}
            onChange={e => setEmailBcc(e.target.value)}
            placeholder="auditoria@miempresa.com"
            disabled={sending}
            style={inputStyle}
          />
        </Field>

        {/* Asunto */}
        <Field label="Asunto" required>
          <input
            type="text"
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
            disabled={sending}
            style={inputStyle}
          />
        </Field>

        {/* Mensaje */}
        <Field label="Mensaje" required>
          <textarea
            value={emailMessage}
            onChange={e => setEmailMessage(e.target.value)}
            disabled={sending}
            rows={8}
            style={{
              ...inputStyle,
              fontFamily: "inherit",
              resize: "vertical",
              minHeight: 140,
              lineHeight: 1.5,
            }}
          />
        </Field>

        {/* Reply-to info */}
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: -6, marginBottom: 14, fontStyle: "italic" }}>
          Las respuestas del cliente llegarán a tu correo: <strong>{currentUser?.email ?? "—"}</strong>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-md)",
              marginBottom: 14,
              fontSize: 12,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: feedback.type === "success"
                ? "color-mix(in srgb, var(--color-success-text) 10%, transparent)"
                : "color-mix(in srgb, var(--color-danger-text) 10%, transparent)",
              border: feedback.type === "success"
                ? "1px solid color-mix(in srgb, var(--color-success-text) 35%, transparent)"
                : "1px solid color-mix(in srgb, var(--color-danger-text) 35%, transparent)",
              color: feedback.type === "success" ? "var(--color-success-text)" : "var(--color-danger-text)",
            }}
          >
            {feedback.type === "success" ? <IconCheck size={14} /> : <IconAlertCircle size={14} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Botón Enviar */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: "100%",
            height: 42,
            borderRadius: "var(--radius-md)",
            background: canSend ? "var(--color-brand-blue)" : "var(--color-bg-subtle)",
            border: `1px solid ${canSend ? "var(--color-brand-blue)" : "var(--color-border-faint)"}`,
            color: canSend ? "#fff" : "var(--color-text-muted)",
            fontSize: 13,
            fontWeight: 800,
            cursor: canSend ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "var(--transition-fast)",
          }}
        >
          <IconMail size={15} />
          {sending ? "Enviando..." : "Enviar cotización"}
        </button>
      </div>
    </div>
  );
}

// ─── Subcomponente Field reutilizable ──────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--color-text-second)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
        <span>{label}</span>
        {required && <span style={{ color: "var(--color-danger-text)" }}>*</span>}
        {hint && <span style={{ fontWeight: 400, color: "var(--color-text-muted)", textTransform: "none", letterSpacing: 0, fontSize: 10 }}>· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Estilo común de inputs ────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border-faint)",
  background: "var(--color-bg-base)",
  color: "var(--color-text-primary)",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};