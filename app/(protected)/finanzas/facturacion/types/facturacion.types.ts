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
