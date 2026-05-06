/**
 * TemplateProforma.tsx
 *
 * Template PDF para PROFORMAS (CFDI guardado como borrador antes de timbrar).
 *
 * Características del documento:
 *   - Marca de agua diagonal "PROFORMA · SIN VALIDEZ FISCAL"
 *   - Banner amarillo en la parte superior con leyenda destacada
 *   - Datos fiscales completos del emisor (RFC, razón social, régimen, CP)
 *   - Datos fiscales completos del receptor (RFC, razón social, régimen, CP, uso CFDI)
 *   - Tabla de conceptos con clave SAT, clave unidad, descripción, cantidad, precio, etc.
 *   - Totales: subtotal, descuentos, IVA, retenciones, total
 *   - Sin folio fiscal (UUID), sin sello digital SAT, sin código QR
 *   - Disclaimer prominente: este documento NO es un CFDI válido
 *
 * Casos de uso:
 *   - Mandar al agente aduanal para validar Carta Porte / Comercio Exterior
 *     antes de timbrar
 *   - Mandar al cliente para confirmar datos antes de emitir factura definitiva
 *   - Aprobación interna por finanzas/dirección antes de timbrar
 *
 * Es un template AUTO-CONTENIDO: no depende de PDFShared.tsx ni otros utilitarios.
 * Toda la lógica visual vive aquí para facilitar mantenimiento e iteración.
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// ════════════════════════════════════════════════════════════════════
// Tipos
// ════════════════════════════════════════════════════════════════════

export type ProformaDocument = {
  id: string;
  serie: string | null;
  folio: number | null;
  type: string | null; // I, E, P, T, N
  status: string | null;
  cfdi_date: string | null; // ISO
  issuer_rfc: string | null;
  issuer_name: string | null;
  issuer_fiscal_regime: string | null;
  receiver_rfc: string | null;
  receiver_name: string | null;
  receiver_fiscal_regime: string | null;
  receiver_cfdi_use: string | null;
  receiver_zip: string | null;
  receiver_email: string | null;
  subtotal: number | string | null;
  discount: number | string | null;
  tax_amount: number | string | null;
  retention_amount: number | string | null;
  total: number | string | null;
  currency: string | null;
  exchange_rate: number | string | null;
  payment_method: string | null; // PUE, PPD
  payment_form: string | null; // 01, 03, 99, etc.
  notes: string | null;
};

export type ProformaConcept = {
  id: string;
  product_key: string | null; // SAT
  unit_key: string | null; // SAT
  description: string | null;
  unit: string | null; // descripción humana de la unidad
  quantity: number | string | null;
  unit_price: number | string | null;
  discount: number | string | null;
  subtotal: number | string | null;
  tax_rate: number | string | null;
  tax_amount: number | string | null;
  retention_rate: number | string | null;
  retention_amount: number | string | null;
  total: number | string | null;
};

export type ProformaCompanySettings = {
  fiscal_rfc: string | null;
  fiscal_name: string | null;
  fiscal_regime: string | null;
  fiscal_zip: string | null;
  logo_url: string | null;
  brand_color: string | null; // tabla / totales
  brand_color_dark: string | null; // header
  brand_accent: string | null; // acento
};

type Props = {
  document: ProformaDocument;
  concepts: ProformaConcept[];
  companySettings: ProformaCompanySettings;
};

// ════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value: number | string | null | undefined, currency = "MXN") => {
  const n = toNumber(value);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatNumber = (value: number | string | null | undefined, decimals = 2) => {
  const n = toNumber(value);
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
};

const cfdiTypeLabel = (type: string | null): string => {
  switch ((type ?? "I").toUpperCase()) {
    case "I": return "Ingreso";
    case "E": return "Egreso";
    case "P": return "Pago (REP)";
    case "T": return "Traslado";
    case "N": return "Nómina";
    default: return type ?? "Ingreso";
  }
};

const paymentMethodLabel = (method: string | null): string => {
  if (!method) return "—";
  if (method.toUpperCase() === "PUE") return "PUE — Pago en una sola exhibición";
  if (method.toUpperCase() === "PPD") return "PPD — Pago en parcialidades o diferido";
  return method;
};

const paymentFormLabel = (form: string | null): string => {
  if (!form) return "—";
  const map: Record<string, string> = {
    "01": "01 — Efectivo",
    "02": "02 — Cheque nominativo",
    "03": "03 — Transferencia electrónica",
    "04": "04 — Tarjeta de crédito",
    "28": "28 — Tarjeta de débito",
    "99": "99 — Por definir",
  };
  return map[form] ?? form;
};

// ════════════════════════════════════════════════════════════════════
// Estilos
// ════════════════════════════════════════════════════════════════════

const PAGE_PADDING = 36;
const HEADER_HEIGHT = 95;
const WATERMARK_OPACITY = 0.07;

const buildStyles = (settings: ProformaCompanySettings) => {
  // ─────────────────────────────────────────────────────────────────
  // Resolución de colores con fallbacks inteligentes:
  //   - El `headerColor` debe ser oscuro (texto blanco encima).
  //   - Si `brand_color_dark` está configurado y es oscuro, lo usamos.
  //   - Si no, caemos a `brand_color` (que suele ser el principal azul).
  //   - Si tampoco, fallback estático a un azul corporativo.
  // ─────────────────────────────────────────────────────────────────
  const isDarkColor = (hex: string | null): boolean => {
    if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Luminosidad relativa (W3C). <0.5 = oscuro suficiente para texto blanco.
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.55;
  };

  const headerColor =
    (isDarkColor(settings.brand_color_dark) && settings.brand_color_dark) ||
    (isDarkColor(settings.brand_color) && settings.brand_color) ||
    "#1f2a44";
  const tableColor = settings.brand_color || "#3b5bdb";
  const accentColor = settings.brand_accent || "#fbbf24";

  return StyleSheet.create({
    page: {
      paddingTop: HEADER_HEIGHT + 16,
      paddingBottom: 60,
      paddingHorizontal: PAGE_PADDING,
      fontSize: 9,
      fontFamily: "Helvetica",
      color: "#1f2937",
      position: "relative",
    },

    // ─── Header (absoluto en cada página) ────────────────────────────
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: HEADER_HEIGHT,
      backgroundColor: headerColor,
      paddingHorizontal: PAGE_PADDING,
      paddingTop: 16,
      paddingBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    logoBox: {
      width: 56,
      height: 56,
      backgroundColor: "rgba(255,255,255,0.10)",
      borderRadius: 4,
      padding: 6,
      marginRight: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    logoImg: {
      width: 44,
      height: 44,
      objectFit: "contain",
    },
    logoFallback: {
      color: "#ffffff",
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
    },
    issuerName: {
      color: "#ffffff",
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      marginBottom: 3,
    },
    issuerLine: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 8,
      lineHeight: 1.4,
    },
    headerRight: {
      alignItems: "flex-end",
    },
    proformaPill: {
      backgroundColor: accentColor,
      paddingHorizontal: 14,
      paddingVertical: 5,
      borderRadius: 3,
      marginBottom: 6,
    },
    proformaPillText: {
      color: "#1f2937",
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 1,
    },
    folioText: {
      color: "#ffffff",
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      marginBottom: 2,
    },
    dateText: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 8,
    },

    // ─── Disclaimer banner ───────────────────────────────────────────
    disclaimerBanner: {
      backgroundColor: "#fef3c7",
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      borderLeftStyle: "solid",
      padding: 8,
      marginBottom: 14,
      flexDirection: "row",
    },
    disclaimerIcon: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: "#92400e",
      marginRight: 8,
    },
    disclaimerText: {
      flex: 1,
      fontSize: 8.5,
      color: "#78350f",
      lineHeight: 1.4,
    },
    disclaimerStrong: {
      fontFamily: "Helvetica-Bold",
    },

    // ─── Bloques de información (emisor / receptor / detalles) ───────
    blocksRow: {
      flexDirection: "row",
      marginBottom: 14,
      gap: 8,
    },
    block: {
      flex: 1,
      backgroundColor: "#f9fafb",
      borderRadius: 4,
      padding: 10,
      borderTopWidth: 2,
      borderTopColor: tableColor,
      borderTopStyle: "solid",
    },
    blockTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: tableColor,
      letterSpacing: 0.5,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    blockMain: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: "#111827",
      marginBottom: 4,
    },
    blockRow: {
      flexDirection: "row",
      marginBottom: 2,
    },
    blockLabel: {
      fontSize: 7.5,
      color: "#6b7280",
      width: 50,
    },
    blockValue: {
      fontSize: 8,
      color: "#1f2937",
      flex: 1,
    },

    // ─── Tabla de conceptos ──────────────────────────────────────────
    tableTitle: {
      fontSize: 9.5,
      fontFamily: "Helvetica-Bold",
      color: tableColor,
      marginBottom: 6,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    table: {
      borderWidth: 0.5,
      borderColor: "#e5e7eb",
      borderStyle: "solid",
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 12,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: tableColor,
    },
    tableHeaderCell: {
      paddingVertical: 6,
      paddingHorizontal: 5,
      color: "#ffffff",
      fontSize: 7.5,
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.3,
    },
    tableRow: {
      flexDirection: "row",
      borderTopWidth: 0.5,
      borderTopColor: "#e5e7eb",
      borderTopStyle: "solid",
      backgroundColor: "#ffffff",
    },
    tableRowAlt: {
      backgroundColor: "#fafbfc",
    },
    tableCell: {
      paddingVertical: 6,
      paddingHorizontal: 5,
      fontSize: 7.5,
      color: "#374151",
    },
    // anchos de columna (suman 100%)
    colSat: { width: "9%" },
    colUnit: { width: "7%" },
    colDesc: { width: "34%" },
    colQty: { width: "7%", textAlign: "right" },
    colUnitName: { width: "9%" },
    colPrice: { width: "11%", textAlign: "right" },
    colDisc: { width: "8%", textAlign: "right" },
    colTotal: { width: "15%", textAlign: "right" },

    // ─── Totales ─────────────────────────────────────────────────────
    totalsRow: {
      flexDirection: "row",
      marginBottom: 10,
    },
    notesBox: {
      flex: 1,
      paddingRight: 12,
    },
    notesTitle: {
      fontSize: 8,
      fontFamily: "Helvetica-Bold",
      color: tableColor,
      textTransform: "uppercase",
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    notesText: {
      fontSize: 8,
      color: "#4b5563",
      lineHeight: 1.5,
    },
    totalsBox: {
      width: 220,
      backgroundColor: "#f9fafb",
      borderRadius: 4,
      padding: 10,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3,
      borderBottomWidth: 0.5,
      borderBottomColor: "#e5e7eb",
      borderBottomStyle: "solid",
    },
    totalRowLast: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginTop: 4,
      backgroundColor: tableColor,
      borderRadius: 3,
    },
    totalLabel: {
      fontSize: 8,
      color: "#6b7280",
    },
    totalValue: {
      fontSize: 9,
      color: "#1f2937",
      fontFamily: "Helvetica-Bold",
    },
    totalLabelFinal: {
      fontSize: 9.5,
      color: "#ffffff",
      fontFamily: "Helvetica-Bold",
      letterSpacing: 0.5,
    },
    totalValueFinal: {
      fontSize: 11,
      color: "#ffffff",
      fontFamily: "Helvetica-Bold",
    },

    // ─── Footer ──────────────────────────────────────────────────────
    footerBlock: {
      marginTop: 12,
      padding: 10,
      backgroundColor: "#fef3c7",
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      borderLeftStyle: "solid",
    },
    footerTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: "#78350f",
      marginBottom: 3,
      letterSpacing: 0.3,
    },
    footerText: {
      fontSize: 8,
      color: "#78350f",
      lineHeight: 1.5,
    },
    pageNumber: {
      position: "absolute",
      bottom: 24,
      left: PAGE_PADDING,
      right: PAGE_PADDING,
      fontSize: 7,
      color: "#9ca3af",
      textAlign: "center",
    },

    // ─── Marca de agua ───────────────────────────────────────────────
    watermarkContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    watermarkText: {
      fontSize: 72,
      fontFamily: "Helvetica-Bold",
      color: "#ef4444",
      opacity: WATERMARK_OPACITY,
      transform: "rotate(-30deg)",
      letterSpacing: 4,
    },
  });
};

// ════════════════════════════════════════════════════════════════════
// Subcomponentes
// ════════════════════════════════════════════════════════════════════

const Watermark: React.FC<{ styles: ReturnType<typeof buildStyles> }> = ({ styles }) => (
  <View style={styles.watermarkContainer} fixed>
    <Text style={styles.watermarkText}>PROFORMA</Text>
  </View>
);

const Header: React.FC<{
  styles: ReturnType<typeof buildStyles>;
  document: ProformaDocument;
  companySettings: ProformaCompanySettings;
}> = ({ styles, document, companySettings }) => {
  const issuerName = document.issuer_name || companySettings.fiscal_name || "Emisor";
  const issuerRfc = document.issuer_rfc || companySettings.fiscal_rfc || "—";
  const issuerRegime = document.issuer_fiscal_regime || companySettings.fiscal_regime || "—";
  const folioText = document.serie
    ? `${document.serie}${document.folio ? `-${document.folio}` : "-PRO"}`
    : "PRO";

  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLeft}>
        <View style={styles.logoBox}>
          {companySettings.logo_url ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={companySettings.logo_url} style={styles.logoImg} />
          ) : (
            <Text style={styles.logoFallback}>
              {(issuerName.charAt(0) || "M").toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.issuerName}>{issuerName}</Text>
          <Text style={styles.issuerLine}>RFC: {issuerRfc}</Text>
          <Text style={styles.issuerLine}>
            Régimen fiscal: {issuerRegime}
          </Text>
          {companySettings.fiscal_zip && (
            <Text style={styles.issuerLine}>
              C.P. fiscal: {companySettings.fiscal_zip}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.proformaPill}>
          <Text style={styles.proformaPillText}>PROFORMA</Text>
        </View>
        <Text style={styles.folioText}>{folioText}</Text>
        <Text style={styles.dateText}>{formatDate(document.cfdi_date)}</Text>
        <Text style={styles.dateText}>
          Tipo: {cfdiTypeLabel(document.type)}
        </Text>
      </View>
    </View>
  );
};

const DisclaimerBanner: React.FC<{
  styles: ReturnType<typeof buildStyles>;
}> = ({ styles }) => (
  <View style={styles.disclaimerBanner}>
    <Text style={styles.disclaimerIcon}>!</Text>
    <Text style={styles.disclaimerText}>
      <Text style={styles.disclaimerStrong}>Este documento NO es un CFDI válido. </Text>
      Es un borrador (proforma) generado para fines de revisión, validación y
      aprobación previa al timbrado fiscal. No tiene folio fiscal (UUID), sello
      digital del SAT ni efectos contables. La factura definitiva se emitirá
      una vez confirmados los datos.
    </Text>
  </View>
);

const InfoBlocks: React.FC<{
  styles: ReturnType<typeof buildStyles>;
  document: ProformaDocument;
}> = ({ styles, document }) => (
  <View style={styles.blocksRow}>
    {/* Bloque receptor */}
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Cliente / Receptor</Text>
      <Text style={styles.blockMain}>{document.receiver_name || "—"}</Text>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>RFC:</Text>
        <Text style={styles.blockValue}>{document.receiver_rfc || "—"}</Text>
      </View>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>Régimen:</Text>
        <Text style={styles.blockValue}>
          {document.receiver_fiscal_regime || "—"}
        </Text>
      </View>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>Uso CFDI:</Text>
        <Text style={styles.blockValue}>
          {document.receiver_cfdi_use || "—"}
        </Text>
      </View>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>C.P.:</Text>
        <Text style={styles.blockValue}>{document.receiver_zip || "—"}</Text>
      </View>
      {document.receiver_email && (
        <View style={styles.blockRow}>
          <Text style={styles.blockLabel}>Email:</Text>
          <Text style={styles.blockValue}>{document.receiver_email}</Text>
        </View>
      )}
    </View>

    {/* Bloque detalles del comprobante */}
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Detalles del comprobante</Text>
      <Text style={styles.blockMain}>{cfdiTypeLabel(document.type)}</Text>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>Método:</Text>
        <Text style={styles.blockValue}>
          {paymentMethodLabel(document.payment_method)}
        </Text>
      </View>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>Forma:</Text>
        <Text style={styles.blockValue}>
          {paymentFormLabel(document.payment_form)}
        </Text>
      </View>
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>Moneda:</Text>
        <Text style={styles.blockValue}>{document.currency || "MXN"}</Text>
      </View>
      {document.exchange_rate && toNumber(document.exchange_rate) !== 1 && (
        <View style={styles.blockRow}>
          <Text style={styles.blockLabel}>T.C.:</Text>
          <Text style={styles.blockValue}>
            {formatNumber(document.exchange_rate, 4)}
          </Text>
        </View>
      )}
      <View style={styles.blockRow}>
        <Text style={styles.blockLabel}>Fecha:</Text>
        <Text style={styles.blockValue}>{formatDate(document.cfdi_date)}</Text>
      </View>
    </View>
  </View>
);

const ConceptsTable: React.FC<{
  styles: ReturnType<typeof buildStyles>;
  concepts: ProformaConcept[];
  currency: string;
}> = ({ styles, concepts, currency }) => (
  <View>
    <Text style={styles.tableTitle}>Conceptos ({concepts.length})</Text>
    <View style={styles.table}>
      {/* Header */}
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.tableHeaderCell, styles.colSat]}>Clave SAT</Text>
        <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unid. SAT</Text>
        <Text style={[styles.tableHeaderCell, styles.colDesc]}>Descripción</Text>
        <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
        <Text style={[styles.tableHeaderCell, styles.colUnitName]}>Unidad</Text>
        <Text style={[styles.tableHeaderCell, styles.colPrice]}>P. Unit.</Text>
        <Text style={[styles.tableHeaderCell, styles.colDisc]}>Desc.</Text>
        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Subtotal</Text>
      </View>
      {/* Filas */}
      {concepts.map((concept, idx) => (
        <View
          key={concept.id || idx}
          style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
          wrap={false}
        >
          <Text style={[styles.tableCell, styles.colSat]}>
            {concept.product_key || "—"}
          </Text>
          <Text style={[styles.tableCell, styles.colUnit]}>
            {concept.unit_key || "—"}
          </Text>
          <Text style={[styles.tableCell, styles.colDesc]}>
            {concept.description || "—"}
          </Text>
          <Text style={[styles.tableCell, styles.colQty]}>
            {formatNumber(concept.quantity, 2)}
          </Text>
          <Text style={[styles.tableCell, styles.colUnitName]}>
            {concept.unit || "—"}
          </Text>
          <Text style={[styles.tableCell, styles.colPrice]}>
            {formatMoney(concept.unit_price, currency)}
          </Text>
          <Text style={[styles.tableCell, styles.colDisc]}>
            {toNumber(concept.discount) > 0
              ? formatMoney(concept.discount, currency)
              : "—"}
          </Text>
          <Text style={[styles.tableCell, styles.colTotal]}>
            {formatMoney(concept.subtotal, currency)}
          </Text>
        </View>
      ))}
    </View>
  </View>
);

const TotalsBlock: React.FC<{
  styles: ReturnType<typeof buildStyles>;
  document: ProformaDocument;
}> = ({ styles, document }) => {
  const currency = document.currency || "MXN";
  const subtotal = toNumber(document.subtotal);
  const discount = toNumber(document.discount);
  const tax = toNumber(document.tax_amount);
  const retention = toNumber(document.retention_amount);
  const total = toNumber(document.total);

  return (
    <View style={styles.totalsRow} wrap={false}>
      <View style={styles.notesBox}>
        {document.notes ? (
          <View>
            <Text style={styles.notesTitle}>Notas</Text>
            <Text style={styles.notesText}>{document.notes}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.totalsBox}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            {formatMoney(subtotal, currency)}
          </Text>
        </View>
        {discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento</Text>
            <Text style={styles.totalValue}>
              -{formatMoney(discount, currency)}
            </Text>
          </View>
        )}
        {tax > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text style={styles.totalValue}>{formatMoney(tax, currency)}</Text>
          </View>
        )}
        {retention > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Retenciones</Text>
            <Text style={styles.totalValue}>
              -{formatMoney(retention, currency)}
            </Text>
          </View>
        )}
        <View style={styles.totalRowLast}>
          <Text style={styles.totalLabelFinal}>TOTAL</Text>
          <Text style={styles.totalValueFinal}>
            {formatMoney(total, currency)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const FinalDisclaimer: React.FC<{
  styles: ReturnType<typeof buildStyles>;
}> = ({ styles }) => (
  <View style={styles.footerBlock} wrap={false}>
    <Text style={styles.footerTitle}>AVISO IMPORTANTE</Text>
    <Text style={styles.footerText}>
      Este documento es una <Text style={{ fontFamily: "Helvetica-Bold" }}>proforma</Text>{" "}
      sin validez fiscal. NO sustituye al CFDI (Comprobante Fiscal Digital por
      Internet) que se emitirá una vez confirmados todos los datos. La proforma
      no genera obligaciones fiscales, contables ni de pago para ninguna de las
      partes hasta que se emita el comprobante definitivo timbrado por el SAT.
    </Text>
  </View>
);

// ════════════════════════════════════════════════════════════════════
// Componente principal
// ════════════════════════════════════════════════════════════════════

const TemplateProforma: React.FC<Props> = ({
  document,
  concepts,
  companySettings,
}) => {
  const styles = buildStyles(companySettings);
  const currency = document.currency || "MXN";

  return (
    <Document
      title={`Proforma ${document.serie ?? "PRO"}-${document.folio ?? document.id.slice(0, 8)}`}
      author={companySettings.fiscal_name || "Mobility OS"}
      subject="Proforma — Sin validez fiscal"
      creator="Mobility OS"
      producer="Mobility OS"
    >
      <Page size="LETTER" style={styles.page}>
        <Watermark styles={styles} />
        <Header
          styles={styles}
          document={document}
          companySettings={companySettings}
        />
        <DisclaimerBanner styles={styles} />
        <InfoBlocks styles={styles} document={document} />
        <ConceptsTable
          styles={styles}
          concepts={concepts}
          currency={currency}
        />
        <TotalsBlock styles={styles} document={document} />
        <FinalDisclaimer styles={styles} />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `PROFORMA · Sin validez fiscal · Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default TemplateProforma;