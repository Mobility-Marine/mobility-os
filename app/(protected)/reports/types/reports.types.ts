export type ReportPeriod = "month" | "quarter" | "year" | "custom";

export type CurrencyReport = {
  mxn: number;
  usd: number;
  total_mxn_equiv: number; // USD convertido a MXN (para totales)
};

// ── EJECUTIVO ─────────────────────────────────────────────────
export type ReportEjecutivo = {
  periodo:          string;
  // Ingresos
  facturado:        CurrencyReport;
  cobrado:          CurrencyReport;
  por_cobrar:       CurrencyReport;
  // Costos
  por_pagar:        CurrencyReport;
  nomina_mes:       number;
  // Liquidez
  efectivo_bancos:  CurrencyReport;
  // Operación
  embarques_activos:number;
  clientes_activos: number;
  empleados_activos:number;
  // Tendencia 6 meses
  tendencia:        { mes: string; ingresos: number; egresos: number }[];
};

// ── COMERCIAL ─────────────────────────────────────────────────
export type ReportComercial = {
  // Funnel
  prospectos_total:       number;
  prospectos_calificados: number;
  cotizaciones_emitidas:  number;
  cotizaciones_ganadas:   number;
  pedidos_generados:      number;
  facturas_emitidas:      number;
  // Tasas
  tasa_cotizacion:   number; // % prospectos → cotización
  tasa_cierre:       number; // % cotizaciones → ganadas
  // Montos
  pipeline_valor:    CurrencyReport;
  cotizaciones_monto:CurrencyReport;
  facturado:         CurrencyReport;
  // Por estado cotización
  por_estado: { estado: string; count: number; monto: number }[];
  // Top clientes
  top_clientes: { nombre: string; monto: number; currency: string; facturas: number }[];
  // Tendencia mensual
  tendencia: { mes: string; cotizaciones: number; monto_mxn: number; monto_usd: number }[];
};

// ── LOGÍSTICA ─────────────────────────────────────────────────
export type ReportLogistica = {
  // Volumen
  embarques_total:      number;
  embarques_entregados: number;
  embarques_transito:   number;
  embarques_cancelados: number;
  tasa_entrega:         number; // % entregados
  // Ingresos por moneda
  ingresos:             CurrencyReport;
  costo_total:          CurrencyReport;
  margen:               CurrencyReport;
  margen_pct:           number;
  // Top clientes
  top_clientes: { nombre: string; embarques: number; ingreso: number; currency: string }[];
  // Por tipo de servicio
  por_servicio: { tipo: string; count: number; ingreso: number }[];
  // Tendencia
  tendencia: { mes: string; embarques: number; ingresos_mxn: number; ingresos_usd: number }[];
};

// ── FINANZAS ──────────────────────────────────────────────────
export type ReportFinanzas = {
  // P&L
  ingresos:           CurrencyReport;
  costo_ventas:       CurrencyReport;
  utilidad_bruta:     CurrencyReport;
  gastos_operativos:  CurrencyReport;
  utilidad_neta:      CurrencyReport;
  margen_neto_pct:    number;
  // CXC aging por moneda
  cxc_aging: {
    mxn: { total: number; c0_30: number; c31_60: number; c61_90: number; c90plus: number };
    usd: { total: number; c0_30: number; c31_60: number; c61_90: number; c90plus: number };
  };
  // CXP aging por moneda
  cxp_aging: {
    mxn: { total: number; c0_30: number; c31_60: number; c61_90: number; c90plus: number };
    usd: { total: number; c0_30: number; c31_60: number; c61_90: number; c90plus: number };
  };
  // Bancos
  bancos: { nombre: string; banco: string; currency: string; saldo: number }[];
  efectivo_total:     CurrencyReport;
  // Impuestos posición
  iva_posicion:       number; // positivo = a pagar, negativo = a favor
  isr_estimado:       number;
  // Tendencia P&L 6 meses
  tendencia: { mes: string; ingresos: number; costos: number; utilidad: number; currency: string }[];
};

// ── RH ────────────────────────────────────────────────────────
export type ReportRH = {
  headcount:          number;
  activos:            number;
  en_vacaciones:      number;
  bajas_ytd:          number;
  // Nómina
  nomina_periodo:     number;
  costo_total_patron: number; // incluye IMSS + INFONAVIT
  imss_patron:        number;
  infonavit:          number;
  // Por departamento
  por_departamento: { dept: string; count: number; costo: number }[];
  // Por tipo contrato
  por_contrato: { tipo: string; count: number }[];
  // Historial nóminas
  historial: { periodo: string; neto: number; percepciones: number; deducciones: number }[];
};

// ── ABASTECIMIENTO ────────────────────────────────────────────
export type ReportAbastecimiento = {
  // Órdenes de compra
  ordenes_total:     number;
  ordenes_abiertas:  number;
  ordenes_recibidas: number;
  monto_oc:          CurrencyReport;
  // Proveedores
  proveedores_activos: number;
  top_proveedores: { nombre: string; monto: number; ordenes: number; currency: string }[];
  // Por categoría
  por_categoria: { categoria: string; monto: number; count: number }[];
  // Inventario
  items_inventario:  number;
  valor_inventario:  number;
};
