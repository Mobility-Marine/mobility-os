export type CFDIType = "I" | "E" | "P" | "T" | "N";
export type CFDIStatus = "valid" | "proforma" | "draft" | "cancelled" | "cancellation_requested";
export type PaymentMethod = "PUE" | "PPD";

export type CFDIDocument = {
  id:                    string;
  company_id:            string;
  facturapi_id:          string | null;
  uuid:                  string | null;
  serie:                 string | null;
  folio:                 string | null;
  type:                  CFDIType;
  status:                CFDIStatus;
  cancellation_status:   string | null;
  cancellation_motive:   string | null;
  cfdi_date:             string;
  issuer_rfc:            string;
  issuer_name:           string;
  receiver_rfc:          string | null;
  receiver_name:         string | null;
  receiver_email:        string | null;
  receiver_cfdi_use:     string | null;
  subtotal:              number;
  discount:              number;
  tax_amount:            number;
  retention_amount:      number;
  total:                 number;
  currency:              string;
  exchange_rate:         number;
  payment_method:        PaymentMethod;
  payment_form:          string;
  related_client_id:     string | null;
  related_quotation_id:  string | null;
  xml_url:               string | null;
  pdf_url:               string | null;
  notes:                 string | null;
  stamp_data:            any;
  created_at:            string;
  updated_at:            string;
  has_carta_porte?:      boolean;
};

export type CFDIConcept = {
  id:               string;
  cfdi_id:          string;
  product_key:      string;
  unit_key:         string;
  description:      string;
  unit:             string;
  quantity:         number;
  unit_price:       number;
  discount:         number;
  subtotal:         number;
  tax_rate:         number;
  tax_amount:       number;
  total:            number;
  product_id:       string | null;
};

export type FacturacionStats = {
  total_month:       number;
  count_month:       number;
  count_pending_pay: number;
  total_pending_pay: number;
  count_cancelled:   number;
  count_total:       number;
  por_moneda:        Record<string, FacturacionMonedaStats>;
};

export type FacturacionMonedaStats = {
  facturado_mes:        number;
  count_mes:            number;
  total_pendiente_ppd:  number;
  count_pendiente_ppd:  number;
  count_emitidas:       number;
  count_canceladas:     number;
};

// ── IMPUESTOS POR CONCEPTO ────────────────────────────────────
export type ConceptTax = {
  type:        "IVA" | "ISR" | "IEPS";
  rate:        number;        // 0.16, 0.10, 0.106667, etc.
  factor:      "Tasa" | "Exento" | "Cuota";
  withholding: boolean;       // false = trasladado (+), true = retenido (-)
};

// Presets de impuestos más comunes en México
export const TAX_PRESETS: { key: string; labelEs: string; taxes: ConceptTax[] }[] = [
  {
    key: "iva16",
    labelEs: "IVA 16%",
    taxes: [{ type: "IVA", rate: 0.16, factor: "Tasa", withholding: false }],
  },
  {
    key: "iva8",
    labelEs: "IVA 8% (Zona fronteriza)",
    taxes: [{ type: "IVA", rate: 0.08, factor: "Tasa", withholding: false }],
  },
  {
    key: "iva0",
    labelEs: "IVA 0%",
    taxes: [{ type: "IVA", rate: 0, factor: "Tasa", withholding: false }],
  },
  {
    key: "exento",
    labelEs: "Exento de IVA",
    taxes: [{ type: "IVA", rate: 0, factor: "Exento", withholding: false }],
  },
  {
    key: "honorarios",
    labelEs: "Honorarios — IVA 16% + IVA ret. 10.67% + ISR ret. 10%",
    taxes: [
      { type: "IVA", rate: 0.16,     factor: "Tasa", withholding: false },
      { type: "IVA", rate: 0.106667, factor: "Tasa", withholding: true  },
      { type: "ISR", rate: 0.10,     factor: "Tasa", withholding: true  },
    ],
  },
  {
    key: "arrendamiento",
    labelEs: "Arrendamiento — IVA 16% + IVA ret. 10.67%",
    taxes: [
      { type: "IVA", rate: 0.16,     factor: "Tasa", withholding: false },
      { type: "IVA", rate: 0.106667, factor: "Tasa", withholding: true  },
    ],
  },
  {
    key: "servicios_isr",
    labelEs: "Servicios + ISR ret. 10%",
    taxes: [
      { type: "IVA", rate: 0.16, factor: "Tasa", withholding: false },
      { type: "ISR", rate: 0.10, factor: "Tasa", withholding: true  },
    ],
  },
  {
    key: "iva_ret4",
    labelEs: "IVA 16% + IVA ret. 4%",
    taxes: [
      { type: "IVA", rate: 0.16, factor: "Tasa", withholding: false },
      { type: "IVA", rate: 0.04, factor: "Tasa", withholding: true  },
    ],
  },
  {
    key: "isr_ret1",
    labelEs: "IVA 16% + ISR ret. 1.25%",
    taxes: [
      { type: "IVA", rate: 0.16,   factor: "Tasa", withholding: false },
      { type: "ISR", rate: 0.0125, factor: "Tasa", withholding: true  },
    ],
  },
];

// Helper: calcular totales de un concepto respetando traslados y retenciones
export function calcConceptTotals(concept: NewConcept): {
  base: number; trasladados: number; retenidos: number; total: number;
} {
  const base = concept.quantity * concept.unit_price * (1 - concept.discount_pct / 100);
  const taxes = concept.taxes;
  const trasladados = taxes
    .filter(t => !t.withholding)
    .reduce((s, t) => s + (t.factor === "Exento" ? 0 : base * t.rate), 0);
  const retenidos = taxes
    .filter(t => t.withholding)
    .reduce((s, t) => s + base * t.rate, 0);
  return { base, trasladados, retenidos, total: base + trasladados - retenidos };
}

// Para crear una nueva factura en el drawer
export type NewCFDIForm = {
  client_id:         string;
  receiver_rfc:      string;
  receiver_name:     string;
  receiver_email:    string;
  receiver_cfdi_use: string;
  receiver_zip:      string;
  receiver_regime:   string;
  serie:             string;
  currency:          string;
  exchange_rate:     number;
  payment_method:    PaymentMethod;
  payment_form:      string;
  cfdi_date:         string;
  notes:             string;
  concepts:          NewConcept[];
};

export type NewConcept = {
  product_id?:  string;
  product_key:  string;
  unit_key:     string;
  description:  string;
  unit:         string;
  quantity:     number;
  unit_price:   number;
  discount_pct: number;
  taxes:        ConceptTax[];
};

// Catálogos SAT
export const CFDI_USES = [
  { key: "G01", label: "Adquisición de mercancias" },
  { key: "G03", label: "Gastos en general" },
  { key: "I01", label: "Construcciones" },
  { key: "I08", label: "Otra maquinaria y equipo" },
  { key: "D01", label: "Honorarios médicos, dentales y gastos hospitalarios" },
  { key: "S01", label: "Sin efectos fiscales" },
  { key: "CP01", label: "Pagos" },
];

export const PAYMENT_FORMS = [
  { key: "01", label: "Efectivo" },
  { key: "02", label: "Cheque nominativo" },
  { key: "03", label: "Transferencia electrónica" },
  { key: "04", label: "Tarjeta de crédito" },
  { key: "28", label: "Tarjeta de débito" },
  { key: "29", label: "Tarjeta de servicios" },
  { key: "99", label: "Por definir (PPD)" },
];

export const CANCEL_MOTIVES = [
  { key: "01", label: "Comprobante emitido con errores con relación" },
  { key: "02", label: "Comprobante emitido con errores sin relación" },
  { key: "03", label: "No se llevó a cabo la operación" },
  { key: "04", label: "Operación nominativa relacionada en una factura global" },
];

export const FISCAL_REGIMES = [
  { key: "601", label: "General de Ley Personas Morales" },
  { key: "603", label: "Personas Morales con Fines no Lucrativos" },
  { key: "605", label: "Sueldos y Salarios e Ingresos Asimilados" },
  { key: "606", label: "Arrendamiento" },
  { key: "607", label: "Régimen de Enajenación o Adquisición de Bienes" },
  { key: "608", label: "Demás ingresos" },
  { key: "610", label: "Residentes en el Extranjero sin EP en México" },
  { key: "611", label: "Ingresos por Dividendos" },
  { key: "612", label: "Personas Físicas con Actividades Empresariales" },
  { key: "614", label: "Ingresos por intereses" },
  { key: "616", label: "Sin obligaciones fiscales" },
  { key: "621", label: "Incorporación Fiscal" },
  { key: "622", label: "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras" },
  { key: "625", label: "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas" },
  { key: "626", label: "Régimen Simplificado de Confianza RESICO" },
];

export const UNIT_KEYS = [
  { key: "E48", label: "Unidad de servicio" },
  { key: "H87", label: "Pieza" },
  { key: "KGM", label: "Kilogramo" },
  { key: "MTR", label: "Metro" },
  { key: "LTR", label: "Litro" },
  { key: "XBX", label: "Caja" },
  { key: "DAY", label: "Día" },
  { key: "MON", label: "Mes" },
  { key: "HUR", label: "Hora" },
];

export const DEFAULT_TAXES: ConceptTax[] = [
  { type: "IVA", rate: 0.16, factor: "Tasa", withholding: false },
];

export const DEFAULT_NEW_CFDI: NewCFDIForm = {
  client_id: "", receiver_rfc: "", receiver_name: "",
  receiver_email: "", receiver_cfdi_use: "G03",
  receiver_zip: "", receiver_regime: "601",
  serie: "A", currency: "MXN", exchange_rate: 1,
  payment_method: "PUE", payment_form: "03",
  cfdi_date: new Date().toISOString().split("T")[0],
  notes: "", concepts: [],
};

export type CFDITypeGroup = {
  group:    string;
  groupEs:  string;
  groupEn:  string;
  items:    CFDITypeOption[];
};

export type CFDITypeOption = {
  id:           string;
  type:         CFDIType;
  labelEs:      string;
  labelEn:      string;
  descEs:       string;
  descEn:       string;
  badge?:       string;
  disabled?:    boolean;
  disabledMsg?: string;
  icon:         string;
};

export const CFDI_TYPE_GROUPS: CFDITypeGroup[] = [
  {
    group: "ingreso", groupEs: "Ingresos", groupEn: "Income",
    items: [
      {
        id: "factura", type: "I", labelEs: "Factura", labelEn: "Invoice",
        descEs: "Comprobante de ingreso estándar CFDI 4.0",
        descEn: "Standard income receipt CFDI 4.0",
        icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
      },
      {
        id: "factura_carta_porte", type: "I", labelEs: "Factura con Carta Porte", labelEn: "Invoice with Bill of Lading",
        descEs: "Factura tipo I con Complemento Carta Porte 3.1 — para transportistas que cobran el flete al cliente",
        descEn: "Type I invoice with Bill of Lading 3.1 complement — for carriers that charge freight to clients",
        icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
      },
      {
        id: "comercio_exterior", type: "I", labelEs: "Factura con Comercio Exterior", labelEn: "Invoice with Foreign Trade",
        descEs: "Factura tipo I con Complemento de Comercio Exterior — operaciones de exportación",
        descEn: "Type I invoice with Foreign Trade complement — export operations",
        badge: "Pronto", disabled: true, disabledMsg: "Disponible próximamente",
        icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      },
    ],
  },
  {
    group: "egreso", groupEs: "Egresos", groupEn: "Credits",
    items: [
      {
        id: "nota_credito", type: "E", labelEs: "Nota de Crédito", labelEn: "Credit Note",
        descEs: "Devolución, descuento o bonificación sobre una factura emitida",
        descEn: "Return, discount or bonus on an issued invoice",
        icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
      },
    ],
  },
  {
    group: "pago", groupEs: "Complementos de Pago", groupEn: "Payment Complements",
    items: [
      {
        id: "complemento_pago", type: "P", labelEs: "Complemento de Pago (REP)", labelEn: "Payment Complement (REP)",
        descEs: "Registra el pago de una factura PPD ya emitida",
        descEn: "Records payment for an already issued PPD invoice",
        icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
      },
    ],
  },
  {
    group: "traslado", groupEs: "Traslados", groupEn: "Transfers",
    items: [
      {
        id: "traslado_carta_porte", type: "T", labelEs: "Traslado con Carta Porte", labelEn: "Transfer with Bill of Lading",
        descEs: "CFDI Tipo T con Complemento Carta Porte 3.1 — para mover mercancía propia o de cliente con vehículos propios",
        descEn: "Type T CFDI with Bill of Lading 3.1 complement — to move own or client goods with own vehicles",
        icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
      },
    ],
  },
  {
    group: "nomina", groupEs: "Nómina", groupEn: "Payroll",
    items: [
      {
        id: "nomina", type: "N", labelEs: "Recibo de Nómina", labelEn: "Payroll Receipt",
        descEs: "Timbra CFDIs de nómina para cada empleado con complemento nómina 1.2",
        descEn: "Stamp payroll CFDIs for each employee with payroll complement 1.2",
        icon: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M12 12h.01",
      },
    ],
  },
];

export type BusinessNoteType = "remision" | "honorarios" | "presupuesto" | "recibo" | "otro";
export type BusinessNoteStatus = "draft" | "sent" | "voided";

export type BusinessNote = {
  id:             string;
  company_id:     string;
  note_number:    string | null;
  type:           BusinessNoteType;
  status:         BusinessNoteStatus;
  date:           string;
  client_id:      string | null;
  receiver_name:  string;
  receiver_rfc:   string | null;
  receiver_email: string | null;
  subtotal:       number;
  tax_amount:     number;
  total:          number;
  currency:       string;
  concepts:       any[];
  notes:          string | null;
  pdf_url:        string | null;
  created_at:     string;
};

export const BUSINESS_NOTE_TYPES: { key: BusinessNoteType; labelEs: string; labelEn: string; descEs: string; descEn: string }[] = [
  { key: "remision",    labelEs: "Nota de Remisión",     labelEn: "Delivery Note",      descEs: "Acompaña mercancía sin valor fiscal",       descEn: "Accompanies goods without fiscal value" },
  { key: "honorarios",  labelEs: "Recibo de Honorarios", labelEn: "Honorarium Receipt", descEs: "Para servicios profesionales sin IVA",       descEn: "For professional services without VAT" },
  { key: "presupuesto", labelEs: "Presupuesto",          labelEn: "Estimate",           descEs: "Cotización informal sin compromiso",          descEn: "Informal quote without commitment" },
  { key: "recibo",      labelEs: "Recibo de Pago",       labelEn: "Payment Receipt",    descEs: "Comprobante informal de pago recibido",       descEn: "Informal proof of received payment" },
  { key: "otro",        labelEs: "Otro Documento",       labelEn: "Other Document",     descEs: "Documento personalizado sin valor fiscal",    descEn: "Custom document without fiscal value" },
];

// ═══════════════════════════════════════════════════════════════════════
// FILTROS DEL DASHBOARD DE FACTURACIÓN
// 
// Sistema de filtros multi-dimensional para la lista de CFDIs.
// Se compone de 4 grupos: Tipo, Estado, Período, Moneda + búsqueda libre.
// 
// Diseño SaaS-grade: cada filtro es ortogonal (independiente) y se
// combinan vía AND. La búsqueda libre tiene match parcial en folio,
// cliente, RFC y notas.
// ═══════════════════════════════════════════════════════════════════════

/** Filtro por tipo de comprobante CFDI */
export type ActiveTypeFilter =
  | "all"
  | "factura"           // Tipo I sin Carta Porte
  | "carta_porte"       // Tipo I o T con Complemento Carta Porte 3.1
  | "traslado"          // Tipo T sin Carta Porte (raro, casi no aplica)
  | "nota_credito"      // Tipo E (Egreso)
  | "complemento"       // Tipo P (Pago / REP)
  | "nomina";           // Tipo N

/** Filtro por estado del CFDI */
export type ActiveStatusFilter =
  | "all"
  | "valid"             // Vigente / Timbrado
  | "proforma"          // Borrador editable (sin timbrar)
  | "ppd_pending"       // PPD vigente sin REP completo (alerta de cobranza)
  | "cancelled";        // Cancelado / cancelación solicitada

/** Filtro por período temporal (se aplica sobre cfdi_date) */
export type PeriodFilter =
  | "today"             // Solo hoy
  | "week"              // Esta semana (lunes a domingo)
  | "month"             // Este mes calendario
  | "quarter"           // Este trimestre calendario
  | "year"              // Este año calendario
  | "all"               // Sin filtro de fecha
  | "custom";           // Rango personalizado (usa customStart / customEnd)

/** Filtro por moneda. Las opciones se construyen dinámicamente desde los CFDIs disponibles. */
export type CurrencyFilter = "all" | string; // "MXN" | "USD" | "EUR" | etc.

/** Estado completo de los filtros del Dashboard */
export type DashboardFilters = {
  type:          ActiveTypeFilter;
  status:        ActiveStatusFilter;
  period:        PeriodFilter;
  currency:      CurrencyFilter;
  /** Si period === "custom", fecha de inicio (formato ISO: YYYY-MM-DD) */
  customStart?:  string;
  /** Si period === "custom", fecha de fin (formato ISO: YYYY-MM-DD) */
  customEnd?:    string;
  /** Texto libre para buscar por folio, cliente, RFC, notas */
  search:        string;
};

/** Estado por defecto: todo abierto, sin búsqueda */
export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  type:     "all",
  status:   "all",
  period:   "all",
  currency: "all",
  search:   "",
};

/** Cuenta cuántos filtros están activos (distintos del default). Útil para mostrar el badge "Limpiar filtros". */
export function countActiveFilters(filters: DashboardFilters): number {
  let count = 0;
  if (filters.type     !== "all") count++;
  if (filters.status   !== "all") count++;
  if (filters.period   !== "all") count++;
  if (filters.currency !== "all") count++;
  if (filters.search.trim().length > 0) count++;
  return count;
}
