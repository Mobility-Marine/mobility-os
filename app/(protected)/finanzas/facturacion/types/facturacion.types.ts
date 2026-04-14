export type CFDIType = "I" | "E" | "P" | "T" | "N";
export type CFDIStatus = "valid" | "cancelled" | "cancellation_requested";
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
  receiver_rfc:          string;
  receiver_name:         string;
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
};

// Para crear una nueva factura en el drawer
export type NewCFDIForm = {
  // Receptor
  client_id:         string;
  receiver_rfc:      string;
  receiver_name:     string;
  receiver_email:    string;
  receiver_cfdi_use: string;
  receiver_zip:      string;
  receiver_regime:   string;
  // Config
  serie:             string;
  currency:          string;
  exchange_rate:     number;
  payment_method:    PaymentMethod;
  payment_form:      string;
  cfdi_date:         string;
  notes:             string;
  // Conceptos
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
  tax_rate:     number;
};

// Catálogos SAT más usados
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

export const DEFAULT_NEW_CFDI: NewCFDIForm = {
  client_id: "", receiver_rfc: "", receiver_name: "",
  receiver_email: "", receiver_cfdi_use: "G03",
  receiver_zip: "", receiver_regime: "601",
  serie: "A", currency: "MXN", exchange_rate: 1,
  payment_method: "PUE", payment_form: "03",
  cfdi_date: new Date().toISOString().split("T")[0],
  notes: "", concepts: [],
};

// ── TIPOS ADICIONALES ────────────────────────────────────────

export type CFDITypeGroup = {
  group:    string;
  groupEs:  string;
  groupEn:  string;
  items:    CFDITypeOption[];
};

export type CFDITypeOption = {
  id:          string;
  type:        CFDIType;
  labelEs:     string;
  labelEn:     string;
  descEs:      string;
  descEn:      string;
  badge?:      string;
  disabled?:   boolean;
  disabledMsg?:string;
  icon:        string; // SVG path d value
};

export const CFDI_TYPE_GROUPS: CFDITypeGroup[] = [
  {
    group: "ingreso", groupEs: "Ingresos", groupEn: "Income",
    items: [
      {
        id: "factura", type: "I", labelEs: "Factura", labelEn: "Invoice",
        descEs: "Comprobante de ingreso estándar CFDI 4.0", descEn: "Standard income receipt CFDI 4.0",
        icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
      },
      {
        id: "comercio_exterior", type: "I", labelEs: "Comercio Exterior", labelEn: "Foreign Trade",
        descEs: "Factura con complemento de Comercio Exterior", descEn: "Invoice with Foreign Trade complement",
        badge: "Pronto", disabled: true, disabledMsg: "Disponible próximamente",
        icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      },
      {
        id: "carta_porte", type: "I", labelEs: "Carta Porte (CCP)", labelEn: "Bill of Lading",
        descEs: "Factura con Complemento Carta Porte 3.1", descEn: "Invoice with Bill of Lading 3.1",
        badge: "Pronto", disabled: true, disabledMsg: "Disponible próximamente",
        icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
      },
    ],
  },
  {
    group: "egreso", groupEs: "Egresos", groupEn: "Credits",
    items: [
      {
        id: "nota_credito", type: "E", labelEs: "Nota de Crédito", labelEn: "Credit Note",
        descEs: "Devolución, descuento o bonificación sobre una factura emitida", descEn: "Return, discount or bonus on an issued invoice",
        icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
      },
    ],
  },
  {
    group: "pago", groupEs: "Complementos de Pago", groupEn: "Payment Complements",
    items: [
      {
        id: "complemento_pago", type: "P", labelEs: "Complemento de Pago (REP)", labelEn: "Payment Complement (REP)",
        descEs: "Registra el pago de una factura PPD ya emitida", descEn: "Records payment for an already issued PPD invoice",
        icon: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
      },
    ],
  },
  {
    group: "traslado", groupEs: "Traslados", groupEn: "Transfers",
    items: [
      {
        id: "traslado", type: "T", labelEs: "CFDI de Traslado", labelEn: "Transfer CFDI",
        descEs: "Movimiento de mercancías sin transacción comercial", descEn: "Goods movement without commercial transaction",
        badge: "Pronto", disabled: true, disabledMsg: "Disponible próximamente",
        icon: "M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3 M12 21l5-5-5-5 M7 16h10",
      },
    ],
  },
  {
    group: "nomina", groupEs: "Nómina", groupEn: "Payroll",
    items: [
      {
        id: "nomina", type: "N", labelEs: "Recibo de Nómina", labelEn: "Payroll Receipt",
        descEs: "Requiere configurar el módulo de Empleados primero", descEn: "Requires the Employees module to be configured first",
        disabled: true, disabledMsg: "Configura el módulo de Empleados para habilitar esta opción",
        icon: "M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M12 12h.01",
      },
    ],
  },
];

// Tipos para Notas sin valor fiscal
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
  { key: "remision",    labelEs: "Nota de Remisión",     labelEn: "Delivery Note",       descEs: "Acompaña mercancía sin valor fiscal", descEn: "Accompanies goods without fiscal value" },
  { key: "honorarios",  labelEs: "Recibo de Honorarios", labelEn: "Honorarium Receipt",  descEs: "Para servicios profesionales sin IVA", descEn: "For professional services without VAT" },
  { key: "presupuesto", labelEs: "Presupuesto",          labelEn: "Estimate",            descEs: "Cotización informal sin compromiso",   descEn: "Informal quote without commitment" },
  { key: "recibo",      labelEs: "Recibo de Pago",       labelEn: "Payment Receipt",     descEs: "Comprobante informal de pago recibido", descEn: "Informal proof of received payment" },
  { key: "otro",        labelEs: "Otro Documento",       labelEn: "Other Document",      descEs: "Documento personalizado sin valor fiscal", descEn: "Custom document without fiscal value" },
];
